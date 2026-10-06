export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/Base64 stored locally
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
}

const STORAGE_USERS_KEY = 'bmcast_registered_users_v3';
const STORAGE_SESSION_KEY = 'bmcast_active_session_v3';

class AuthenticationService {
  private users: UserAccount[] = [];
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadFromStorage();
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

  /**
   * Registra uma nova conta com pergunta e resposta secreta
   */
  signUp(params: {
    name: string;
    email: string;
    password: string;
    securityQuestion: string;
    securityAnswer: string;
  }): { success: boolean; error?: string; user?: AuthSession['user'] } {
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
      return { success: false, error: 'Por favor, defina sua pergunta e resposta secreta para recuperação.' };
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

    // Inicia sessão automaticamente após cadastro
    this.currentSession = {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token: `tok_${Date.now()}`,
    };
    this.saveSession();

    return { success: true, user: this.currentSession.user };
  }

  /**
   * Login tradicional com email e senha
   */
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
    };
    this.saveSession();

    return { success: true, user: this.currentSession.user };
  }

  /**
   * Obtém a pergunta de segurança de um usuário pelo email
   */
  getSecurityQuestion(email: string): string | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return user ? user.securityQuestion : null;
  }

  /**
   * Redefine a senha validando a resposta de segurança
   */
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

    // Loga automaticamente com a nova senha
    this.currentSession = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: `tok_${Date.now()}`,
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
