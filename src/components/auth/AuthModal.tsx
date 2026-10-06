import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, X, KeyRound, Eye, EyeOff } from 'lucide-react';
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
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Custom Question & Answer
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (mode === 'recovery' && val.trim()) {
      const sec = authService.getSecurityForEmail(val);
      if (sec && sec.question) {
        setRecoveryQuestion(sec.question);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'recovery') {
        if (!recoveryAnswer.trim() || !newPassword) {
          setErrorMsg('Preencha a resposta e a nova senha.');
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMsg('A confirmação da nova senha não confere.');
          return;
        }
        if (newPassword.length < 6) {
          setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
          return;
        }

        const res = await authService.resetPasswordWithRecovery(
          email,
          'question',
          recoveryAnswer,
          newPassword
        );
        if (res.success) {
          setMode('signin');
          setPassword(newPassword);
        } else {
          setErrorMsg(res.error || 'Resposta incorreta ou e-mail não encontrado.');
        }
      } else if (mode === 'signup') {
        if (!securityQuestion.trim()) {
          setErrorMsg('Escreva sua pergunta de segurança.');
          return;
        }
        if (!securityAnswer.trim()) {
          setErrorMsg('Digite a resposta da pergunta de segurança.');
          return;
        }
        const res = await authService.signUp(
          email,
          password,
          name,
          securityQuestion.trim(),
          securityAnswer.trim()
        );
        if (res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setErrorMsg(res.error || 'Erro ao registrar conta');
        }
      } else {
        const res = await authService.signIn(email, password);
        if (res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setErrorMsg(res.error || 'Credenciais inválidas');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 sm:p-7 space-y-4 rounded-2xl bg-[#0B0F1A] border border-[#1E293B] shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-1">
            <Logo size="md" showSubtitle={false} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {mode === 'signin' && 'Acessar Painel BM Cast'}
            {mode === 'signup' && 'Criar Conta no BM Cast'}
            {mode === 'recovery' && 'Recuperar Acesso'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin' && 'Digite seu e-mail e senha de acesso.'}
            {mode === 'signup' && 'Cadastre seus dados e escreva sua pergunta secreta e resposta.'}
            {mode === 'recovery' && 'Digite seu e-mail e responda à sua pergunta secreta.'}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="bm-label">
                Nome ou Razão Social
              </label>
              <div className="bm-field-group">
                <div className="pl-3.5 pr-1 text-slate-400 shrink-0 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Minha Empresa"
                />
              </div>
            </div>
          )}

          <div>
            <label className="bm-label">
              Endereço de E-mail
            </label>
            <div className="bm-field-group">
              <div className="pl-3.5 pr-1 text-slate-400 shrink-0 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="seu.email@empresa.com"
              />
            </div>
          </div>

          {mode !== 'recovery' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="bm-label mb-0">
                  Senha
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery');
                      setErrorMsg(null);
                      if (email.trim()) {
                        const sec = authService.getSecurityForEmail(email);
                        if (sec && sec.question) setRecoveryQuestion(sec.question);
                      }
                    }}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="bm-field-group">
                <div className="pl-3.5 pr-1 text-slate-400 shrink-0 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-3 pl-1 text-slate-400 hover:text-slate-200 cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* SIGN UP: CHAVE DE RECUPERAÇÃO */}
          {mode === 'signup' && (
            <div className="p-3.5 rounded-xl bg-[#080C16] border border-[#1E293B] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>Chave de Recuperação</span>
              </div>

              <div>
                <label className="bm-label">
                  Escreva sua Pergunta Secreta *
                </label>
                <input
                  type="text"
                  required
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  placeholder="Ex: Qual o nome da sua mãe? / Sua comida favorita?"
                  className="bm-input"
                />
              </div>

              <div>
                <label className="bm-label">
                  Digite a Resposta *
                </label>
                <input
                  type="text"
                  required
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Digite a resposta"
                  className="bm-input"
                />
              </div>
            </div>
          )}

          {/* RECOVERY: CHAVE DE RECUPERAÇÃO */}
          {mode === 'recovery' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#080C16] border border-[#1E293B] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  <span>Chave de Recuperação</span>
                </div>

                <div>
                  <label className="bm-label">
                    Sua Pergunta Secreta *
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryQuestion}
                    onChange={(e) => setRecoveryQuestion(e.target.value)}
                    placeholder="Digite sua pergunta secreta"
                    className="bm-input"
                  />
                </div>

                <div>
                  <label className="bm-label">
                    Digite a Resposta *
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    placeholder="Digite a resposta"
                    className="bm-input"
                  />
                </div>
              </div>

              <div>
                <label className="bm-label">Nova Senha</label>
                <div className="bm-field-group">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="pr-3 pl-1 text-slate-400 hover:text-slate-200 cursor-pointer shrink-0"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="bm-label">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="bm-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md disabled:opacity-50 mt-1 cursor-pointer"
          >
            <span>
              {loading
                ? 'Processando...'
                : mode === 'signin'
                ? 'Entrar no Sistema'
                : mode === 'signup'
                ? 'Criar Minha Conta'
                : 'Salvar Nova Senha'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle sign in / sign up / back */}
        <div className="text-center text-xs text-slate-400">
          {mode === 'signin' && (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline cursor-pointer"
              >
                Criar conta gratuita
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline cursor-pointer"
              >
                Fazer login
              </button>
            </p>
          )}
          {mode === 'recovery' && (
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline cursor-pointer"
            >
              Voltar para o login
            </button>
          )}
        </div>

        {/* Secure badge */}
        <div className="pt-1 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seus dados totalmente seguros</span>
          </span>
        </div>
      </div>
    </div>
  );
};
