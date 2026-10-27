import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'bmcast-db.json');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://dkjjgszyrkhdcrwycaej.supabase.co').trim();
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD').trim();

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  recoveryKeyHash: string;
  recoveryQuestion?: string;
  salt: string;
  createdAt: string;
}

interface WorkspaceData {
  screens: any[];
  media: any[];
  playlists: any[];
  config: any;
  ticker: any;
  weather: any;
  updatedAt: string;
}

interface ServerDatabase {
  users: StoredUser[];
  workspaces: Record<string, WorkspaceData>;
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function loadDatabase(): ServerDatabase {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], workspaces: {} };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      workspaces: parsed?.workspaces && typeof parsed.workspaces === 'object' ? parsed.workspaces : {},
    };
  } catch (err) {
    console.warn('Warning reading bmcast-db.json, initializing clean store:', err);
    return { users: [], workspaces: {} };
  }
}

let store: ServerDatabase = loadDatabase();

function saveDatabase() {
  try {
    ensureDirectories();
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist bmcast-db.json:', err);
  }
}

const normEmail = (e: string) => String(e || '').trim().toLowerCase();
const normKey = (k: string) => String(k || '').trim().toLowerCase().replace(/\s+/g, ' ');

function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

async function mirrorUserToSupabase(u: StoredUser) {
  if (!supabase) return;
  try {
    await supabase.from('app_users').upsert({
      id: u.id,
      name: u.name,
      email: u.email,
      password_hash: u.passwordHash,
      recovery_key_hash: u.recoveryKeyHash,
      recovery_question: u.recoveryQuestion || '',
      salt: u.salt,
      created_at: u.createdAt,
    });
  } catch {
    // Supabase tables optional if not yet created in external dashboard
  }
}

async function findSupabaseUserByEmail(email: string): Promise<StoredUser | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error || !data) return null;
    const mapped: StoredUser = {
      id: data.id,
      name: data.name,
      email: normEmail(data.email),
      passwordHash: data.password_hash,
      recoveryKeyHash: data.recovery_key_hash,
      ...(data.recovery_question ? { recoveryQuestion: data.recovery_question } : {}),
      salt: data.salt,
      createdAt: data.created_at || new Date().toISOString(),
    };
    const idx = store.users.findIndex((x) => normEmail(x.email) === mapped.email);
    if (idx >= 0) store.users[idx] = mapped;
    else store.users.push(mapped);
    saveDatabase();
    return mapped;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve uploaded media assets with long-lived cache headers
  ensureDirectories();
  app.use(
    '/api/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '365d',
      immutable: true,
    })
  );

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, users: store.users.length });
  });

  // Upload image (slide background, company logo, custom QR) as binary file
  app.post('/api/upload', (req: Request, res: Response) => {
    try {
      const { dataUrl, folder = 'slides', fileName = 'asset.png' } = req.body || {};
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        res.status(400).json({ error: 'Formato de arquivo inválido.' });
        return;
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
      if (!match || !match[1] || !match[2]) {
        res.status(400).json({ error: 'Dados de imagem inválidos.' });
        return;
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, '') || 'slides';
      const rawExt = path.extname(String(fileName)).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const mimeExt = mimeType.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'png';
      const ext = rawExt || (mimeExt === 'jpeg' ? 'jpg' : mimeExt) || 'png';

      const targetDir = path.join(UPLOADS_DIR, safeFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filePath = path.join(targetDir, uniqueName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      res.json({ ok: true, url: `/api/uploads/${safeFolder}/${uniqueName}` });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Erro ao salvar imagem no servidor.' });
    }
  });

  // Sync existing local browser accounts so accounts created previously work across devices immediately
  app.post('/api/auth/sync-users', async (req: Request, res: Response) => {
    try {
      const incoming = Array.isArray(req.body?.users) ? req.body.users : [];
      let changed = false;

      for (const raw of incoming) {
        if (!raw || !raw.email || !raw.passwordHash || !raw.salt) continue;
        const email = normEmail(raw.email);
        const existingIdx = store.users.findIndex((u) => normEmail(u.email) === email);
        if (existingIdx < 0) {
          const acc: StoredUser = {
            id: String(raw.id || `usr_${crypto.randomBytes(8).toString('hex')}`),
            name: String(raw.name || email.split('@')[0] || 'Empresa'),
            email,
            passwordHash: String(raw.passwordHash),
            recoveryKeyHash: String(raw.recoveryKeyHash || ''),
            ...(raw.recoveryQuestion ? { recoveryQuestion: String(raw.recoveryQuestion) } : {}),
            salt: String(raw.salt),
            createdAt: String(raw.createdAt || new Date().toISOString()),
          };
          store.users.push(acc);
          changed = true;
          mirrorUserToSupabase(acc);
        }
      }

      if (changed) saveDatabase();
      res.json({ ok: true });
    } catch (err) {
      console.error('Sync users error:', err);
      res.status(500).json({ ok: false });
    }
  });

  // Register new account
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { id, name, email: rawEmail, password, recoveryKey, recoveryQuestion } = req.body || {};
      const email = normEmail(rawEmail);
      const cleanName = String(name || '').trim() || email.split('@')[0] || 'Empresa';
      const cleanQuestion = String(recoveryQuestion || '').trim().slice(0, 200);
      const cleanAnswer = normKey(recoveryKey);

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        res.status(400).json({ success: false, error: 'Informe um e-mail válido.' });
        return;
      }
      if (!password || String(password).length < 6) {
        res.status(400).json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
      }
      if (cleanQuestion.length < 5) {
        res.status(400).json({
          success: false,
          error: 'Escreva uma pergunta de recuperação com pelo menos 5 caracteres.',
        });
        return;
      }
      if (cleanAnswer.length < 2) {
        res.status(400).json({
          success: false,
          error: 'Escreva a resposta da pergunta de recuperação.',
        });
        return;
      }

      let existing = store.users.find((u) => normEmail(u.email) === email) || null;
      if (!existing) {
        existing = await findSupabaseUserByEmail(email);
      }
      if (existing) {
        res.status(409).json({ success: false, error: 'Já existe uma conta cadastrada com este e-mail.' });
        return;
      }

      const salt = crypto.randomBytes(12).toString('hex');
      const newUser: StoredUser = {
        id: typeof id === 'string' && id.startsWith('usr_') ? id : `usr_${crypto.randomBytes(8).toString('hex')}`,
        name: cleanName,
        email,
        salt,
        passwordHash: sha256Hex(salt + String(password)),
        recoveryKeyHash: sha256Hex(salt + cleanAnswer),
        recoveryQuestion: cleanQuestion,
        createdAt: new Date().toISOString(),
      };

      store.users.push(newUser);
      saveDatabase();
      await mirrorUserToSupabase(newUser);

      res.json({
        success: true,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
        accountRecord: newUser,
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ success: false, error: 'Erro ao registrar conta.' });
    }
  });

  // Sign in across any device (PC, mobile, tablet)
  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    try {
      const email = normEmail(req.body?.email);
      const password = String(req.body?.password || '');

      let user = store.users.find((u) => normEmail(u.email) === email) || null;
      if (!user) {
        user = await findSupabaseUserByEmail(email);
      }

      if (!user || sha256Hex(user.salt + password) !== user.passwordHash) {
        res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
        return;
      }

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        accountRecord: user,
      });
    } catch (err) {
      console.error('Signin error:', err);
      res.status(500).json({ success: false, error: 'Erro ao autenticar conta.' });
    }
  });

  // Find security question by email
  app.post('/api/auth/recovery-question', async (req: Request, res: Response) => {
    try {
      const email = normEmail(req.body?.email);
      let user = store.users.find((u) => normEmail(u.email) === email) || null;
      if (!user) {
        user = await findSupabaseUserByEmail(email);
      }
      if (!user) {
        res.status(404).json({ found: false });
        return;
      }
      res.json({
        found: true,
        question: user.recoveryQuestion || 'Qual o nome do meu pet?',
      });
    } catch {
      res.status(500).json({ found: false });
    }
  });

  // Recover password with security answer
  app.post('/api/auth/recover', async (req: Request, res: Response) => {
    try {
      const email = normEmail(req.body?.email);
      const recoveryKey = normKey(req.body?.recoveryKey);
      const newPassword = String(req.body?.newPassword || '');

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        return;
      }

      let user = store.users.find((u) => normEmail(u.email) === email) || null;
      if (!user) {
        user = await findSupabaseUserByEmail(email);
      }

      if (!user || sha256Hex(user.salt + recoveryKey) !== user.recoveryKeyHash) {
        res.status(401).json({ success: false, error: 'Resposta de recuperação incorreta.' });
        return;
      }

      user.passwordHash = sha256Hex(user.salt + newPassword);
      saveDatabase();
      await mirrorUserToSupabase(user);

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        accountRecord: user,
      });
    } catch {
      res.status(500).json({ success: false, error: 'Erro ao redefinir senha.' });
    }
  });

  // Change password for authenticated user
  app.post('/api/auth/change-password', async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, newPassword } = req.body || {};
      if (!newPassword || String(newPassword).length < 6) {
        res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        return;
      }
      const user = store.users.find((u) => u.id === userId);
      if (!user || sha256Hex(user.salt + String(currentPassword || '')) !== user.passwordHash) {
        res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
        return;
      }
      user.passwordHash = sha256Hex(user.salt + String(newPassword));
      saveDatabase();
      await mirrorUserToSupabase(user);
      res.json({ success: true, accountRecord: user });
    } catch {
      res.status(500).json({ success: false, error: 'Erro ao alterar senha.' });
    }
  });

  // Change recovery question & answer
  app.post('/api/auth/change-recovery', async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, question, answer } = req.body || {};
      const q = String(question || '').trim().slice(0, 200);
      const a = normKey(answer);
      if (q.length < 5) {
        res.status(400).json({ success: false, error: 'Escreva uma pergunta com pelo menos 5 caracteres.' });
        return;
      }
      if (a.length < 2) {
        res.status(400).json({ success: false, error: 'Escreva a resposta da pergunta.' });
        return;
      }
      const user = store.users.find((u) => u.id === userId);
      if (!user || sha256Hex(user.salt + String(currentPassword || '')) !== user.passwordHash) {
        res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
        return;
      }
      user.recoveryQuestion = q;
      user.recoveryKeyHash = sha256Hex(user.salt + a);
      saveDatabase();
      await mirrorUserToSupabase(user);
      res.json({ success: true, accountRecord: user });
    } catch {
      res.status(500).json({ success: false, error: 'Erro ao atualizar chave de recuperação.' });
    }
  });

  // Delete account and workspace
  app.post('/api/auth/delete-account', async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword } = req.body || {};
      const user = store.users.find((u) => u.id === userId);
      if (!user || sha256Hex(user.salt + String(currentPassword || '')) !== user.passwordHash) {
        res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
        return;
      }
      store.users = store.users.filter((u) => u.id !== userId);
      delete store.workspaces[userId];
      saveDatabase();
      if (supabase) {
        supabase.from('app_users').delete().eq('id', userId).then(() => {}, () => {});
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Erro ao excluir conta.' });
    }
  });

  // Get workspace data for a user account
  app.get('/api/workspace/:userId', (req: Request, res: Response) => {
    const userId = String(req.params.userId || '').trim();
    if (!userId || userId === 'guest') {
      res.json({ exists: false });
      return;
    }
    const ws = store.workspaces[userId];
    if (!ws) {
      res.json({ exists: false });
      return;
    }
    res.json({ exists: true, workspace: ws });
  });

  // Save/update workspace data for a user account
  app.put('/api/workspace/:userId', (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId || '').trim();
      if (!userId || userId === 'guest') {
        res.status(400).json({ ok: false, error: 'Escopo inválido.' });
        return;
      }
      const body = req.body || {};
      const prev = store.workspaces[userId];

      store.workspaces[userId] = {
        screens: Array.isArray(body.screens) ? body.screens : prev?.screens || [],
        media: Array.isArray(body.media) ? body.media : prev?.media || [],
        playlists: Array.isArray(body.playlists) ? body.playlists : prev?.playlists || [],
        config: body.config !== undefined ? body.config : prev?.config || null,
        ticker: body.ticker !== undefined ? body.ticker : prev?.ticker || null,
        weather: body.weather !== undefined ? body.weather : prev?.weather || null,
        updatedAt: new Date().toISOString(),
      };
      saveDatabase();
      res.json({ ok: true, updatedAt: store.workspaces[userId].updatedAt });
    } catch (err) {
      console.error('Workspace save error:', err);
      res.status(500).json({ ok: false });
    }
  });

  // Check all used slugs/pairingCodes across all workspaces so short TV links never collide
  app.get('/api/screens/taken', (_req: Request, res: Response) => {
    const slugs: string[] = [];
    const codes: string[] = [];
    for (const ws of Object.values(store.workspaces)) {
      for (const s of ws.screens || []) {
        if (s?.slug) slugs.push(String(s.slug).toLowerCase());
        if (s?.pairingCode) codes.push(String(s.pairingCode));
      }
    }
    res.json({ slugs, codes });
  });

  // Public Smart TV & Totem Player resolver by short slug (/tv1, /loja) or 4-digit code (/1024)
  app.get('/api/player/:slugOrCode', (req: Request, res: Response) => {
    const target = decodeURIComponent(String(req.params.slugOrCode || ''))
      .trim()
      .toLowerCase()
      .replace(/^\/+/, '');

    if (!target) {
      res.json({ found: false });
      return;
    }

    for (const ws of Object.values(store.workspaces)) {
      const screens = Array.isArray(ws.screens) ? ws.screens : [];
      const matchedScreen = screens.find((s: any) => {
        const sSlug = String(s?.slug || '').trim().toLowerCase();
        const sCode = String(s?.pairingCode || '').trim().toLowerCase();
        const sDigits = sCode.replace(/^tv-/i, '');
        return sSlug === target || sCode === target || (sDigits && sDigits === target);
      });

      if (matchedScreen) {
        const playlists = Array.isArray(ws.playlists) ? ws.playlists : [];
        const mediaList = Array.isArray(ws.media) ? ws.media : [];
        const resolvedPlaylist =
          playlists.find((p: any) => p.id === matchedScreen.activePlaylistId) ||
          playlists.find((p: any) => Array.isArray(p.items) && p.items.length > 0) ||
          playlists[0] ||
          null;

        res.json({
          found: true,
          bundle: {
            screen: matchedScreen,
            playlist: resolvedPlaylist,
            mediaList,
            ticker: ws.ticker || null,
            weather: ws.weather || null,
            config: ws.config || null,
          },
        });
        return;
      }
    }

    res.json({ found: false });
  });

  // Unknown /api/* route handler
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');

    app.use(express.static(distPath, { index: false }));

    // SPA Catch-All so /tv1, /1024, /loja never return 404 on Smart TVs or mobile browsers
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.status(200).sendFile(indexHtmlPath);
      } else {
        res.status(200).sendFile(path.join(__dirname, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BM CAST server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
