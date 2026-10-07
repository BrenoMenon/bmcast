import { supabase } from './supabaseClient';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  securityQuestion: string;
  securityAnswer: string;
  createdAt: string;
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
  isNewRegistration?: boolean;
}

const STORAGE_USERS_KEY = 'bmcast_registered_users_v6';
const STORAGE_SESSION_KEY = 'bmcast_active_session_v6';

class AuthenticationService {
  private users: UserAccount[] = [];
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadFromStorage();
    this.trySyncFromSupabase();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
      this.users = rawUsers ? JSON.parse(rawUsers) : [];
      const rawSession = localStorage.getItem(STORAGE_SESSION_KEY);
      this.currentSession = rawSession ? JSON.parse(rawSession) : null;
    } catch (e) {
      console.error('Erro ao ler usuários:', e);
      this.users = [];
      this.currentSession = null;
    }
  }

  private async trySyncFromSupabase() {
    try {
      const { data, error } = await supabase.from('bmcast_users').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        // Mesclar usuários do Supabase
        const existingIds = new Set(this.users.map((u) => u.email.toLowerCase()));
        let changed = false;
        data.forEach((remoteUser) => {
          if (!existingIds.has(remoteUser.email?.toLowerCase())) {
            this.users.push(remoteUser);
            changed = true;
          }
        });
        if (changed) {
          this.saveUsers();
        }
      }
    } catch {
      // Falha silenciosa com fallback local garantido
    }
  }

  private saveUsers() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
  }

  private saveSession() {
    if (typeof window === 'undefined') return;
    if (this.currentSession) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
  }

  getCurrentUser(): AuthSession['user'] | null {
    return this.currentSession ? this.currentSession.user : null;
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  clearNewRegistrationFlag() {
    if (this.currentSession) {
      this.currentSession.isNewRegistration = false;
      this.saveSession();
    }
  }

  async signUp(params: {
    name: string;
    email: string;
    password: string;
    securityQuestion: string;
    securityAnswer: string;
  }): Promise<{ success: boolean; error?: string; user?: AuthSession['user'] }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPassword = params.password.trim();
    const cleanQuestion = params.securityQuestion.trim();
    const cleanAnswer = params.securityAnswer.trim().toLowerCase();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'E-mail e senha são obrigatórios.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    if (!cleanQuestion || !cleanAnswer) {
      return { success: false, error: 'Defina sua pergunta e resposta secreta para recuperação.' };
    }

    const existing = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: params.name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      passwordHash: cleanPassword,
      securityQuestion: cleanQuestion,
      securityAnswer: cleanAnswer,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveUsers();

    // Sincroniza em background no Supabase caso a tabela exista
    try {
      void supabase.from('bmcast_users').insert([newUser]);
    } catch {
      // Ignorar fallback seguro
    }

    this.currentSession = {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token: `tok_${Date.now()}`,
      isNewRegistration: true,
    };
    this.saveSession();

    return { success: true, user: this.currentSession.user };
  }

  signIn(email: string, password: string): { success: boolean; error?: string; user?: AuthSession['user'] } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'E-mail não encontrado. Crie sua conta primeiro.' };
    }
    if (user.passwordHash !== cleanPassword) {
      return { success: false, error: 'Senha incorreta. Tente novamente ou use a chave de recuperação.' };
    }

    this.currentSession = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: `tok_${Date.now()}`,
      isNewRegistration: false,
    };
    this.saveSession();

    return { success: true, user: this.currentSession.user };
  }

  getSecurityQuestion(email: string): string | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return user ? user.securityQuestion : null;
  }

  recoverPassword(params: {
    email: string;
    securityAnswer: string;
    newPassword: string;
  }): { success: boolean; error?: string } {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanAnswer = params.securityAnswer.trim().toLowerCase();
    const cleanNewPass = params.newPassword.trim();

    if (cleanNewPass.length < 6) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'E-mail não cadastrado.' };
    }

    if (user.securityAnswer.toLowerCase().trim() !== cleanAnswer) {
      return { success: false, error: 'Resposta de recuperação incorreta.' };
    }

    user.passwordHash = cleanNewPass;
    this.saveUsers();

    this.currentSession = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: `tok_${Date.now()}`,
      isNewRegistration: false,
    };
    this.saveSession();

    return { success: true };
  }

  signOut() {
    this.currentSession = null;
    this.saveSession();
  }
}

export const authService = new AuthenticationService();
