import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { authService, AuthUser } from '../../services/supabaseClient';
import { Logo } from '../common/Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);

    if (mode === 'signup') {
      const res = await authService.signUp(email, password, name);
      setLoading(false);
      if (res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Erro ao registrar conta');
      }
    } else {
      const res = await authService.signIn(email, password);
      setLoading(false);
      if (res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Erro ao efetuar login');
      }
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    const res = await authService.signIn('admin@bmcast.com', 'bmcast2026');
    setLoading(false);
    if (res.user) {
      onSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bm-card w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Logo size="md" showSubtitle={false} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {mode === 'signin' ? 'Acessar Painel BM Cast' : 'Criar Conta no BM Cast'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin'
              ? 'Digite seu e-mail e senha para gerenciar suas TVs e playlists.'
              : 'Cadastre sua conta para sincronizar suas telas e mídias em nuvem.'}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome ou Razão Social
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Oliveira / Hamburgueria BM"
                  className="bm-input w-full pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="bm-input w-full pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bm-input w-full pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md disabled:opacity-50"
          >
            <span>{loading ? 'Processando...' : mode === 'signin' ? 'Entrar no Sistema' : 'Criar Minha Conta'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Acesso Rápido de Demonstração (Sem digitação)</span>
          </button>
        </div>

        {/* Toggle sign in / sign up */}
        <div className="text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Criar conta gratuita
              </button>
            </p>
          ) : (
            <p>
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Fazer login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
