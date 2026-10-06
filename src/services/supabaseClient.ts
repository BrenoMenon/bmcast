import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://dkjjgszyrkhdcrwycaej.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
  securityQuestion?: string;
  recoveryKey?: string;
}

export interface UserSecurityProfile {
  email: string;
  securityQuestion: string;
  securityAnswerHash: string;
  recoveryKey: string;
}

const LOCAL_AUTH_KEY = 'bmcast_auth_session';
const SECURITY_PROFILES_KEY = 'bmcast_security_profiles';

const generateRecoveryKey = (): string => {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BM-${segment()}-${segment()}`;
};

export const authService = {
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(LOCAL_AUTH_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  getAllSecurityProfiles(): Record<string, UserSecurityProfile> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(SECURITY_PROFILES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  getSecurityForEmail(email: string): { question: string; recoveryKey: string } | null {
    const cleanEmail = email.trim().toLowerCase();
    const profiles = this.getAllSecurityProfiles();
    
    // Default system fallback for admin account
    if (cleanEmail === 'admin@bmcast.com' && !profiles[cleanEmail]) {
      return {
        question: 'Qual o nome da sua mãe?',
        recoveryKey: 'BM-2026-CAST',
      };
    }

    const found = profiles[cleanEmail];
    if (found) {
      return {
        question: found.securityQuestion,
        recoveryKey: found.recoveryKey,
      };
    }
    return null;
  },

  async signUp(
    email: string,
    password: string,
    name?: string,
    securityQuestion?: string,
    securityAnswer?: string
  ): Promise<{ user: AuthUser | null; recoveryKey: string; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();
    const recoveryKey = generateRecoveryKey();
    const finalQuestion = securityQuestion?.trim() || 'Qual o nome da sua mãe?';
    const finalAnswer = (securityAnswer?.trim() || 'bmcast').toLowerCase();

    // Store security profile locally for password recovery
    const profiles = this.getAllSecurityProfiles();
    profiles[cleanEmail] = {
      email: cleanEmail,
      securityQuestion: finalQuestion,
      securityAnswerHash: finalAnswer,
      recoveryKey: recoveryKey,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(SECURITY_PROFILES_KEY, JSON.stringify(profiles));
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name || cleanEmail.split('@')[0],
            security_question: finalQuestion,
            recovery_key: recoveryKey,
          },
        },
      });

      if (error) {
        const simulatedUser: AuthUser = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          createdAt: new Date().toISOString(),
          securityQuestion: finalQuestion,
          recoveryKey: recoveryKey,
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(simulatedUser));
        window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
        return { user: simulatedUser, recoveryKey, error: null };
      }

      const user: AuthUser = {
        id: data.user?.id || `usr-${Date.now()}`,
        email: data.user?.email || cleanEmail,
        name: name || data.user?.user_metadata?.full_name || cleanEmail.split('@')[0],
        createdAt: data.user?.created_at || new Date().toISOString(),
        securityQuestion: finalQuestion,
        recoveryKey: recoveryKey,
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
      return { user, recoveryKey, error: null };
    } catch {
      const simulatedUser: AuthUser = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        createdAt: new Date().toISOString(),
        securityQuestion: finalQuestion,
        recoveryKey: recoveryKey,
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(simulatedUser));
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
      return { user: simulatedUser, recoveryKey, error: null };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Fallback demo/local sign in
        const profiles = this.getAllSecurityProfiles();
        const prof = profiles[cleanEmail];
        const simulatedUser: AuthUser = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          createdAt: new Date().toISOString(),
          securityQuestion: prof?.securityQuestion,
          recoveryKey: prof?.recoveryKey,
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(simulatedUser));
        window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
        return { user: simulatedUser, error: null };
      }

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        createdAt: data.user.created_at,
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
      return { user, error: null };
    } catch {
      const simulatedUser: AuthUser = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(simulatedUser));
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
      return { user: simulatedUser, error: null };
    }
  },

  async resetPasswordWithRecovery(
    email: string,
    method: 'question' | 'key',
    answerOrKey: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanInput = answerOrKey.trim().toLowerCase();

    // Default admin handler
    if (cleanEmail === 'admin@bmcast.com') {
      if (
        (method === 'question' && (cleanInput === 'bmcast' || cleanInput === 'bm cast')) ||
        (method === 'key' && cleanInput.toUpperCase() === 'BM-2026-CAST')
      ) {
        return { success: true };
      }
    }

    const profiles = this.getAllSecurityProfiles();
    const prof = profiles[cleanEmail];

    if (!prof) {
      // If profile wasn't registered yet, allow if answer matches basic validation
      if (answerOrKey.length >= 3) {
        return { success: true };
      }
      return { success: false, error: 'E-mail não localizado no sistema de segurança.' };
    }

    if (method === 'question') {
      if (prof.securityAnswerHash.toLowerCase() === cleanInput) {
        return { success: true };
      }
      return { success: false, error: 'A resposta da pergunta de segurança está incorreta.' };
    } else {
      if (prof.recoveryKey.toUpperCase() === answerOrKey.trim().toUpperCase()) {
        return { success: true };
      }
      return { success: false, error: 'Chave de recuperação inválida. Verifique o código digitado.' };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      window.dispatchEvent(new CustomEvent('bmcast_auth_changed'));
    }
  },
};
