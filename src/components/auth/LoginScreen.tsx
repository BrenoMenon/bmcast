import React, { useState } from 'react';
import { 
  Mail, Lock, User, ArrowRight, ShieldCheck, 
  AlertCircle, KeyRound, CheckCircle2, 
  ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { authService, AuthUser } from '../../services/supabaseClient';
import { Logo } from '../common/Logo';

interface LoginScreenProps {
  onSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Custom Security Question & Answer (User writes their own question and answer)
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Recovery Form State
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    setErrorMsg(null);
    setSuccessMsg(null);

    // MODE: RECOVERY
    if (mode === 'recovery') {
      if (!email.trim() || !recoveryAnswer.trim() || !newPassword) {
        setErrorMsg('Por favor, preencha todos os campos para redefinir sua senha.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('A confirmação da nova senha não confere.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('A nova senha deve conter pelo menos 6 caracteres.');
        return;
      }

      setLoading(true);
      const res = await authService.resetPasswordWithRecovery(
        email,
        'question',
        recoveryAnswer,
        newPassword
      );
      setLoading(false);

      if (res.success) {
        setSuccessMsg('Senha atualizada com sucesso! Você já pode entrar com sua nova senha.');
        setPassword(newPassword);
        setTimeout(() => {
          setMode('signin');
          setSuccessMsg(null);
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Resposta incorreta ou e-mail não encontrado.');
      }
      return;
    }

    // MODE: SIGN IN
    if (mode === 'signin') {
      if (!email || !password) return;
      setLoading(true);
      try {
        const res = await authService.signIn(email, password);
        if (res.user) {
          onSuccess(res.user);
        } else {
          setErrorMsg(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        }
      } catch {
        setErrorMsg('Erro ao autenticar. Tente novamente.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // MODE: SIGN UP
    if (mode === 'signup') {
      if (!email || !password) return;
      if (password.length < 6) {
        setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
        return;
      }
      if (!securityQuestion.trim()) {
        setErrorMsg('Por favor, escreva sua pergunta de segurança.');
        return;
      }
      if (!securityAnswer.trim()) {
        setErrorMsg('Por favor, digite a resposta para a sua pergunta de segurança.');
        return;
      }

      setLoading(true);
      try {
        const res = await authService.signUp(
          email,
          password,
          name,
          securityQuestion.trim(),
          securityAnswer.trim()
        );
        setLoading(false);
        if (res.user) {
          setSuccessMsg('Conta criada com sucesso! Redirecionando para o painel...');
          setTimeout(() => {
            if (res.user) onSuccess(res.user);
          }, 1200);
        } else {
          setErrorMsg(res.error || 'Erro ao registrar conta.');
        }
      } catch {
        setErrorMsg('Falha ao registrar conta.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#06080E] text-slate-100 flex flex-col justify-between p-4 sm:p-6 antialiased selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navbar (Clean, no green dot) */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Logo size="md" />
        <div className="text-[11px] font-semibold text-slate-400 hidden sm:flex items-center gap-2">
          <span className="text-blue-400 font-medium">Servidor de Transmissão Ativo</span>
        </div>
      </header>

      {/* Main Login Box */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="rounded-2xl bg-[#0B0F1A] border border-[#1E293B] shadow-2xl p-6 sm:p-8 space-y-5">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {mode === 'signin' && 'Acessar o Painel'}
              {mode === 'signup' && 'Criar Nova Conta'}
              {mode === 'recovery' && 'Recuperar Acesso'}
            </h1>
            <p className="text-xs text-slate-400">
              {mode === 'signin' && 'Digite seu e-mail e senha cadastrados.'}
              {mode === 'signup' && 'Cadastre seus dados e escreva sua pergunta secreta e resposta.'}
              {mode === 'recovery' && 'Digite seu e-mail e responda à sua pergunta secreta.'}
            </p>
          </div>

          {/* Mode Switcher */}
          {mode !== 'recovery' && (
            <div className="flex rounded-xl bg-[#07090F] p-1 border border-[#1E293B]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SIGN UP: FULL NAME / COMPANY */}
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
                    placeholder="Ex: Carlos / Minha Empresa Ltda"
                  />
                </div>
              </div>
            )}

            {/* EMAIL (All modes) */}
            <div>
              <label className="bm-label">
                E-mail de Acesso
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

            {/* PASSWORD (Sign In / Sign Up) */}
            {mode !== 'recovery' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="bm-label mb-0">
                    Senha
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('recovery');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        if (email.trim()) {
                          const sec = authService.getSecurityForEmail(email);
                          if (sec && sec.question) setRecoveryQuestion(sec.question);
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
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
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* SIGN UP: CHAVE DE RECUPERAÇÃO - OPÇÃO DE ESCREVER PERGUNTA E RESPOSTA */}
            {mode === 'signup' && (
              <div className="p-3.5 rounded-xl bg-[#080C16] border border-[#1E293B] space-y-3">
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

            {/* RECOVERY MODE: CHAVE DE RECUPERAÇÃO COM PERGUNTA E RESPOSTA */}
            {mode === 'recovery' && (
              <div className="space-y-3.5">
                {/* Box de Chave de Recuperação no topo */}
                <div className="p-3.5 rounded-xl bg-[#080C16] border border-[#1E293B] space-y-3">
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
                      placeholder="Ex: Qual o nome da sua mãe?"
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
                  <label className="bm-label">
                    Nova Senha
                  </label>
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
                  <label className="bm-label">
                    Confirmar Nova Senha
                  </label>
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

            {/* ACTION BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-900/30 disabled:opacity-50 active:scale-98 cursor-pointer mt-1"
            >
              <span>
                {loading
                  ? 'Processando...'
                  : mode === 'signin'
                  ? 'Acessar Painel'
                  : mode === 'signup'
                  ? 'Criar Minha Conta'
                  : 'Redefinir Senha & Entrar'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Back button in recovery mode */}
          {mode === 'recovery' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-white font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para tela de login</span>
              </button>
            </div>
          )}

          {/* Secure badge */}
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Seus dados totalmente seguros</span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer - Only on login page per user request */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 border-t border-[#1A2234] text-xs text-slate-400">
        <p className="font-medium">
          © Desenvolvido por{' '}
          <span className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
            Breno Menon
          </span>{' '}
          <span className="text-slate-600">|</span>{' '}
          <span className="text-white font-extrabold transition-colors">
            BM Digital
          </span>
        </p>
      </footer>
    </div>
  );
};
