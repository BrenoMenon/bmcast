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
      this.currentSession = s && s.user && this.users.some((u) => u.id === s.user.id) ? s : null;
    } catch {
      this.users = [];
      this.currentSession = null;
    }
  }

  private saveUsers() {
    if (isBrowser()) localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
  }

  private startSession(u: UserAccount) {
    this.currentSession = { user: { id: u.id, name: u.name, email: u.email }, token: randomId(24) };
    if (isBrowser()) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
    }
    return this.currentSession.user;
  }

  getCurrentUser(): User | null {
    return this.currentSession ? this.currentSession.user : null;
  }

  async signUp(p: { name: string; email: string; password: string; recoveryKey: string; recoveryQuestion?: string }): Promise<Result> {
    const email = normEmail(p.email);
    const password = p.password;
    const key = normKey(p.recoveryKey);
    if (!email || !password) return { success: false, error: 'E-mail e senha são obrigatórios.' };
    if (!isEmail(email)) return { success: false, error: 'Informe um e-mail válido.' };
    if (password.length < 6) return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    const question = (p.recoveryQuestion ?? '').trim();
    if (p.recoveryQuestion !== undefined && question.length < 5) return { success: false, error: 'Escreva uma pergunta de recuperação com pelo menos 5 caracteres.' };
    if (key.length < 2) return { success: false, error: 'Escreva a resposta da pergunta de recuperação.' };
    if (this.users.some((u) => u.email === email))
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };

    const salt = randomId(12);
    const user: UserAccount = {
      id: `usr_${randomId(8)}`,
      name: p.name.trim() || (email.split('@')[0] ?? email),
      email,
      salt,
      passwordHash: await sha256(salt + password),
      recoveryKeyHash: await sha256(salt + key),
      ...(question ? { recoveryQuestion: question.slice(0, 200) } : {}),
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveUsers();
    return { success: true, user: this.startSession(user) };
  }

  async signIn(emailRaw: string, password: string): Promise<Result> {
    const email = normEmail(emailRaw);
    const user = this.users.find((u) => u.email === email);
    if (!user || (await sha256(user.salt + password)) !== user.passwordHash)
      return { success: false, error: 'E-mail ou senha incorretos.' };
    return { success: true, user: this.startSession(user) };
  }

  async recoverPassword(p: { email: string; recoveryKey: string; newPassword: string }): Promise<Result> {
    const email = normEmail(p.email);
    if (p.newPassword.length < 6) return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    const user = this.users.find((u) => u.email === email);
    if (!user || (await sha256(user.salt + normKey(p.recoveryKey))) !== user.recoveryKeyHash)
      return { success: false, error: 'Resposta de recuperação incorreta.' };
    user.passwordHash = await sha256(user.salt + p.newPassword);
    this.saveUsers();
    return { success: true, user: this.startSession(user) };
  }

  getRecoveryQuestion(emailRaw: string): string | null {
    const user = this.users.find((u) => u.email === normEmail(emailRaw));
    if (!user) return null;
    return user.recoveryQuestion || 'Qual é a sua chave de recuperação?';
  }

  private async verifyCurrent(password: string): Promise<UserAccount | null> {
    const id = this.currentSession?.user.id;
    const user = this.users.find((u) => u.id === id);
    if (!user || (await sha256(user.salt + password)) !== user.passwordHash) return null;
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<Result> {
    if (newPassword.length < 6) return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    const user = await this.verifyCurrent(currentPassword);
    if (!user) return { success: false, error: 'Senha atual incorreta.' };
    user.passwordHash = await sha256(user.salt + newPassword);
    this.saveUsers();
    return { success: true };
  }

  async changeRecovery(currentPassword: string, question: string, answer: string): Promise<Result> {
    const q = question.trim();
    const a = normKey(answer);
    if (q.length < 5) return { success: false, error: 'Escreva uma pergunta com pelo menos 5 caracteres.' };
    if (a.length < 2) return { success: false, error: 'Escreva a resposta da pergunta.' };
    const user = await this.verifyCurrent(currentPassword);
    if (!user) return { success: false, error: 'Senha atual incorreta.' };
    user.recoveryQuestion = q.slice(0, 200);
    user.recoveryKeyHash = await sha256(user.salt + a);
    this.saveUsers();
    return { success: true };
  }

  async deleteAccount(currentPassword: string): Promise<Result> {
    const user = await this.verifyCurrent(currentPassword);
    if (!user) return { success: false, error: 'Senha atual incorreta.' };
    this.users = this.users.filter((u) => u.id !== user.id);
    this.saveUsers();
    this.signOut();
    return { success: true };
  }

  signOut() {
    this.currentSession = null;
    if (isBrowser()) {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
    }
  }
}

export const authService = new AuthenticationService();
