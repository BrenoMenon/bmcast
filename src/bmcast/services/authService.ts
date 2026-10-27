import { supabaseService, SUPABASE_CHANGED_EVENT } from './supabaseClient';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // SHA-256 (salted)
  recoveryKeyHash: string; // SHA-256 (salted) of the recovery answer
  recoveryQuestion?: string; // question written by the user (plain text)
  salt: string;
  createdAt: string;
}

export interface AuthSession {
  user: { id: string; name: string; email: string };
  token: string;
}

export type User = AuthSession['user'];
type Result = { success: boolean; error?: string; user?: User };

const STORAGE_USERS_KEY = 'bmcast_registered_users_v4';
const STORAGE_SESSION_KEY = 'bmcast_active_session_v4';
const isBrowser = () => typeof window !== 'undefined';

const normEmail = (e: string) => e.trim().toLowerCase();
const normKey = (k: string) => k.trim().toLowerCase().replace(/\s+/g, ' ');
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function randomId(len = 16) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function mapRowToAccount(row: any): UserAccount {
  return {
    id: row.id,
    name: row.name,
    email: normEmail(row.email),
    passwordHash: row.password_hash,
    recoveryKeyHash: row.recovery_key_hash,
    ...(row.recovery_question ? { recoveryQuestion: row.recovery_question } : {}),
    salt: row.salt,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

class AuthenticationService {
  private users: UserAccount[] = [];
  private currentSession: AuthSession | null = null;

  constructor() {
    if (!isBrowser()) return;
    try {
      const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
      const parsed = rawUsers ? JSON.parse(rawUsers) : [];
      this.users = Array.isArray(parsed) ? parsed : [];
      const rawSession = localStorage.getItem(STORAGE_SESSION_KEY);
      const s = rawSession ? JSON.parse(rawSession) : null;
      this.currentSession = s && s.user ? s : null;
    } catch {
      this.users = [];
      this.currentSession = null;
    }

    setTimeout(() => {
      this.syncLocalUsersToServer();
      this.syncUsersFromSupabase();
    }, 350);

    window.addEventListener(SUPABASE_CHANGED_EVENT, () => {
      this.syncUsersFromSupabase();
    });
  }

  private saveUsers() {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
    } catch {
      /* ignore quota */
    }
  }

  private upsertLocalAccountRecord(acc: UserAccount) {
    if (!acc || !acc.email) return;
    const email = normEmail(acc.email);
    const normalized: UserAccount = { ...acc, email };
    const idx = this.users.findIndex((u) => normEmail(u.email) === email || u.id === normalized.id);
    if (idx >= 0) {
      this.users[idx] = normalized;
    } else {
      this.users.push(normalized);
    }
    this.saveUsers();
  }

  async syncLocalUsersToServer() {
    if (!isBrowser() || this.users.length === 0) return;
    try {
      await fetch('/api/auth/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: this.users }),
      });
    } catch {
      /* server unreachable fallback */
    }
  }

  private async upsertUserToSupabase(u: UserAccount) {
    if (supabaseService.isSchemaKnownMissing()) return;
    const client = supabaseService.getClient();
    if (!client) return;
    try {
      await client.from('app_users').upsert({
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
      /* fallback local */
    }
  }

  private async syncUsersFromSupabase() {
    if (supabaseService.isSchemaKnownMissing()) return;
    const client = supabaseService.getClient();
    if (!client) return;
    try {
      const { data, error } = await client.from('app_users').select('*');
      if (error || !Array.isArray(data)) return;
      let changed = false;
      for (const row of data) {
        const remote = mapRowToAccount(row);
        const idx = this.users.findIndex((u) => u.email === remote.email);
        if (idx >= 0) {
          this.users[idx] = remote;
          changed = true;
        } else {
          this.users.push(remote);
          changed = true;
        }
      }
      if (changed) {
        this.saveUsers();
        this.syncLocalUsersToServer();
      }
    } catch {
      /* ignore */
    }
  }

  private async fetchRemoteUserByEmail(email: string): Promise<UserAccount | null> {
    if (supabaseService.isSchemaKnownMissing()) return null;
    const client = supabaseService.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('app_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error || !data) return null;
      const acc = mapRowToAccount(data);
      this.upsertLocalAccountRecord(acc);
      return acc;
    } catch {
      return null;
    }
  }

  private startSession(u: { id: string; name: string; email: string }) {
    this.currentSession = {
      user: { id: u.id, name: u.name, email: normEmail(u.email) },
      token: randomId(24),
    };
    if (isBrowser()) {
      try {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
    }
    return this.currentSession.user;
  }

  getCurrentUser(): User | null {
    return this.currentSession ? this.currentSession.user : null;
  }

  async signUp(p: {
    name: string;
    email: string;
    password: string;
    recoveryKey: string;
    recoveryQuestion?: string;
  }): Promise<Result> {
    const email = normEmail(p.email);
    const password = p.password;
    const key = normKey(p.recoveryKey);
    if (!email || !password) return { success: false, error: 'E-mail e senha são obrigatórios.' };
    if (!isEmail(email)) return { success: false, error: 'Informe um e-mail válido.' };
    if (password.length < 6) return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    const question = (p.recoveryQuestion ?? '').trim();
    if (p.recoveryQuestion !== undefined && question.length < 5)
      return { success: false, error: 'Escreva uma pergunta de recuperação com pelo menos 5 caracteres.' };
    if (key.length < 2) return { success: false, error: 'Escreva a resposta da pergunta de recuperação.' };

    const candidateId = `usr_${randomId(8)}`;

    // 1. Primary cross-device server signup
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: candidateId,
          name: p.name.trim() || (email.split('@')[0] ?? email),
          email,
          password,
          recoveryKey: key,
          recoveryQuestion: question || 'Qual o nome do meu pet?',
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success && json?.user) {
        if (json.accountRecord) {
          this.upsertLocalAccountRecord(json.accountRecord);
          this.upsertUserToSupabase(json.accountRecord);
        }
        return { success: true, user: this.startSession(json.user) };
      }
      if (json?.error) {
        return { success: false, error: String(json.error) };
      }
    } catch {
      /* fallback below if offline */
    }

    // 2. Fallback local + Supabase
    const existingRemote = await this.fetchRemoteUserByEmail(email);
    if (existingRemote || this.users.some((u) => u.email === email))
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };

    const salt = randomId(12);
    const user: UserAccount = {
      id: candidateId,
      name: p.name.trim() || (email.split('@')[0] ?? email),
      email,
      salt,
      passwordHash: await sha256(salt + password),
      recoveryKeyHash: await sha256(salt + key),
      ...(question ? { recoveryQuestion: question.slice(0, 200) } : {}),
      createdAt: new Date().toISOString(),
    };
    this.upsertLocalAccountRecord(user);
    await this.upsertUserToSupabase(user);
    return { success: true, user: this.startSession(user) };
  }

  async signIn(emailRaw: string, password: string): Promise<Result> {
    const email = normEmail(emailRaw);
    if (!email || !password) return { success: false, error: 'Informe seu e-mail e senha.' };

    // 1. Primary cross-device server sign-in
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.user) {
          if (json.accountRecord) {
            this.upsertLocalAccountRecord(json.accountRecord);
          }
          return { success: true, user: this.startSession(json.user) };
        }
      }
    } catch {
      /* fallback below */
    }

    // 2. Check local browser cache (e.g. account created prior to server DB) and sync it up!
    let user = this.users.find((u) => normEmail(u.email) === email) || null;
    if (!user) {
      user = await this.fetchRemoteUserByEmail(email);
    }
    if (!user || (await sha256(user.salt + password)) !== user.passwordHash) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    await this.syncLocalUsersToServer();
    return { success: true, user: this.startSession(user) };
  }

  async recoverPassword(p: { email: string; recoveryKey: string; newPassword: string }): Promise<Result> {
    const email = normEmail(p.email);
    if (p.newPassword.length < 6) return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };

    // 1. Primary cross-device server recovery
    try {
      await this.syncLocalUsersToServer();
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recoveryKey: p.recoveryKey,
          newPassword: p.newPassword,
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success && json?.user) {
        if (json.accountRecord) {
          this.upsertLocalAccountRecord(json.accountRecord);
          this.upsertUserToSupabase(json.accountRecord);
        }
        return { success: true, user: this.startSession(json.user) };
      }
      if (res.status === 401 && json?.error) {
        return { success: false, error: String(json.error) };
      }
    } catch {
      /* fallback below */
    }

    let user = this.users.find((u) => normEmail(u.email) === email) || null;
    if (!user) {
      user = await this.fetchRemoteUserByEmail(email);
    }
    if (!user || (await sha256(user.salt + normKey(p.recoveryKey))) !== user.recoveryKeyHash)
      return { success: false, error: 'Resposta de recuperação incorreta.' };
    user.passwordHash = await sha256(user.salt + p.newPassword);
    this.saveUsers();
    await this.syncLocalUsersToServer();
    await this.upsertUserToSupabase(user);
    return { success: true, user: this.startSession(user) };
  }

  getRecoveryQuestion(emailRaw: string): string | null {
    const user = this.users.find((u) => normEmail(u.email) === normEmail(emailRaw));
    if (!user) return null;
    return user.recoveryQuestion || 'Qual o nome do meu pet?';
  }

  async findRecoveryQuestionAsync(emailRaw: string): Promise<string | null> {
    const email = normEmail(emailRaw);
    if (!email) return null;

    try {
      await this.syncLocalUsersToServer();
      const res = await fetch('/api/auth/recovery-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.found && json?.question) {
          return String(json.question);
        }
      }
    } catch {
      /* fallback below */
    }

    const localQ = this.getRecoveryQuestion(email);
    if (localQ) return localQ;
    const remote = await this.fetchRemoteUserByEmail(email);
    if (!remote) return null;
    return remote.recoveryQuestion || 'Qual o nome do meu pet?';
  }

  private async verifyCurrent(password: string): Promise<UserAccount | null> {
    const id = this.currentSession?.user.id;
    const user = this.users.find((u) => u.id === id);
    if (!user || (await sha256(user.salt + password)) !== user.passwordHash) return null;
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<Result> {
    if (newPassword.length < 6) return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    const userId = this.currentSession?.user.id;
    if (!userId) return { success: false, error: 'Sessão inválida.' };

    try {
      await this.syncLocalUsersToServer();
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        if (json.accountRecord) {
          this.upsertLocalAccountRecord(json.accountRecord);
          this.upsertUserToSupabase(json.accountRecord);
        }
        return { success: true };
      }
      if (json?.error) return { success: false, error: String(json.error) };
    } catch {
      /* fallback below */
    }

    const user = await this.verifyCurrent(currentPassword);
    if (!user) return { success: false, error: 'Senha atual incorreta.' };
    user.passwordHash = await sha256(user.salt + newPassword);
    this.saveUsers();
    await this.syncLocalUsersToServer();
    await this.upsertUserToSupabase(user);
    return { success: true };
  }

  async changeRecovery(currentPassword: string, question: string, answer: string): Promise<Result> {
    const q = question.trim();
    const a = normKey(answer);
    if (q.length < 5) return { success: false, error: 'Escreva uma pergunta com pelo menos 5 caracteres.' };
    if (a.length < 2) return { success: false, error: 'Escreva a resposta da pergunta.' };
    const userId = this.currentSession?.user.id;
    if (!userId) return { success: false, error: 'Sessão inválida.' };

    try {
      await this.syncLocalUsersToServer();
      const res = await fetch('/api/auth/change-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, question: q, answer: a }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        if (json.accountRecord) {
          this.upsertLocalAccountRecord(json.accountRecord);
          this.upsertUserToSupabase(json.accountRecord);
        }
        return { success: true };
      }
      if (json?.error) return { success: false, error: String(json.error) };
    } catch {
      /* fallback below */
    }

    const user = await this.verifyCurrent(currentPassword);
    if (!user) return { success: false, error: 'Senha atual incorreta.' };
    user.recoveryQuestion = q.slice(0, 200);
    user.recoveryKeyHash = await sha256(user.salt + a);
    this.saveUsers();
    await this.syncLocalUsersToServer();
    await this.upsertUserToSupabase(user);
    return { success: true };
  }

  async deleteAccount(currentPassword: string): Promise<Result> {
    const userId = this.currentSession?.user.id;
    if (!userId) return { success: false, error: 'Sessão inválida.' };

    try {
      await this.syncLocalUsersToServer();
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        this.users = this.users.filter((u) => u.id !== userId);
        this.saveUsers();
        const client = supabaseService.getClient();
        if (client && !supabaseService.isSchemaKnownMissing()) {
          client
            .from('app_users')
            .delete()
            .eq('id', userId)
            .then(() => {}, () => {});
        }
        this.signOut();
        return { success: true };
      }
      if (json?.error) return { success: false, error: String(json.error) };
    } catch {
      /* fallback below */
    }

    const user = await this.verifyCurrent(currentPassword);
    if (!user) return { success: false, error: 'Senha atual incorreta.' };
    this.users = this.users.filter((u) => u.id !== user.id);
    this.saveUsers();
    const client = supabaseService.getClient();
    if (client && !supabaseService.isSchemaKnownMissing()) {
      client
        .from('app_users')
        .delete()
        .eq('id', user.id)
        .then(() => {}, () => {});
    }
    this.signOut();
    return { success: true };
  }

  signOut() {
    this.currentSession = null;
    if (isBrowser()) {
      try {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
    }
  }
}

export const authService = new AuthenticationService();
