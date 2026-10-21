import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Tv,
  CloudSun,
  QrCode,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { authService, User as AuthUser } from '../../services/authService';

interface LoginScreenProps {
  onSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');

  // Common inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up specific inputs
  const [name, setName] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');

  // Password Recovery specific inputs
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [foundQuestion, setFoundQuestion] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('light') ? 'light' : 'dark'
  );
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(next);
    try { localStorage.setItem('bmcast_theme_mode', next); } catch { /* ignore */ }
    setTheme(next);
  };

  const run = async (fn: () => Promise<void>) => {
    if (loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await fn();
    } catch {
      setErrorMsg('Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await authService.signIn(email, password);
      if (res.success && res.user) onSuccess(res.user);
      else setErrorMsg(res.error || 'Credenciais inválidas.');
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await authService.signUp({ name, email, password, recoveryKey, recoveryQuestion });
      if (res.success && res.user) {
        setSuccessMsg('Conta criada com sucesso! Guarde sua pergunta e resposta de recuperação. Entrando...');
        const u = res.user;
        setTimeout(() => onSuccess(u), 1200);
      } else setErrorMsg(res.error || 'Erro ao registrar conta.');
    });
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundQuestion) {
      setErrorMsg(null);
      const q = authService.getRecoveryQuestion(recoveryEmail);
      if (!q) setErrorMsg('Não encontramos uma conta com este e-mail.');
      else setFoundQuestion(q);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas informadas não coincidem.');
      return;
    }
    run(async () => {
      const res = await authService.recoverPassword({
        email: recoveryEmail,
        recoveryKey: recoveryKeyInput,
        newPassword,
      });
      if (res.success && res.user) {
        setSuccessMsg('Senha atualizada com sucesso! Entrando...');
        const u = res.user;
        setTimeout(() => onSuccess(u), 900);
      } else setErrorMsg(res.error || 'Não foi possível redefinir sua senha.');
    });
  };

  return (
    <div className="app-shell min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        className="fixed right-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-full border border-slate-700 bg-slate-900 text-sky-400 shadow-md transition hover:scale-105"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT COLUMN: HERO ASIDE (Clean Executive Blue & Slate, No AI Gradients) */}
        <aside className="keep-dark dark relative hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16 text-white bg-slate-900 border-r border-slate-800">
          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Logo size="lg" />
          </div>

          {/* Center Pitch Content */}
          <div className="relative z-10 max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-400">
              <Tv className="w-3.5 h-3.5" />
              <span>Sinalização Digital & TV Corporativa</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Painel profissional para <span className="text-sky-400">telas e TVs da sua empresa</span>
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Sistema corporativo para exibição de cardápios, comunicados, preços, previsão do tempo ao vivo via API e QR Codes interativos. Comece com seu painel 100% limpo e personalize tudo.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <CloudSun className="w-4 h-4" />
                  <span>Clima ao Vivo</span>
                </div>
                <p className="text-[11px] text-slate-400">Dados meteorológicos em tempo real direto na tela.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <QrCode className="w-4 h-4" />
                  <span>QR Code & Marca</span>
                </div>
                <p className="text-[11px] text-slate-400">Logo da sua empresa e links nos seus slides.</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Sistema seguro e otimizado para transmissão contínua.</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: LOGIN FORM CONTAINER */}
        <div className="relative flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12 bg-slate-950">
          <div className="w-full max-w-md">
            {/* Mobile Header Logo */}
            <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
              <Logo size="lg" />
            </div>

            {/* Rounded Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                  {mode === 'signin' && 'Bem-vindo de volta'}
                  {mode === 'signup' && 'Criar sua conta'}
                  {mode === 'recovery' && 'Recuperar acesso'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  {mode === 'signin' && 'Entre na sua conta ou crie uma nova em segundos.'}
                  {mode === 'signup' && 'Cadastre seu estabelecimento e inicie a transmissão.'}
                  {mode === 'recovery' && 'Responda sua pergunta de recuperação para criar uma nova senha.'}
                </p>
              </div>

              {/* Segmented Rounded Pill Tabs */}
              <div className="grid w-full grid-cols-2 bg-slate-950 p-1.5 rounded-full border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-sky-600 text-white shadow-md font-bold'
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
                  className={`py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-sky-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Criar conta
                </button>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="p-3.5 mb-5 rounded-2xl bg-red-950/40 border border-red-900/60 text-xs text-red-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 mb-5 rounded-2xl bg-blue-950/50 border border-blue-500/40 text-xs text-blue-100 flex items-start gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">Status da Ação:</span>
                    <span className="leading-relaxed">{successMsg}</span>
                  </div>
                </div>
              )}

              {/* MODE 1: SIGN IN */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-3" autoComplete="off">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: nome@empresa.com" autoComplete="off"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('recovery');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs text-blue-400 hover:underline cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm rounded-full transition-all shadow-md cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Entrando...' : 'Entrar na Plataforma'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* MODE 2: SIGN UP */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome do Estabelecimento ou Responsável *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Empório Gourmet & Café"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      E-mail Comercial *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: contato@empresa.com" autoComplete="off"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Senha de Acesso (mínimo 6 caracteres) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-3 bg-[#0b101b] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Pergunta e resposta de recuperação */}
                  <div className="p-4 rounded-2xl bg-[#0b101b] border border-[#222f46] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      <span>Recuperação de senha *</span>
                    </div>
                    <div>
                      <label htmlFor="recovery-question" className="block text-[11px] font-semibold text-slate-300 mb-1">Sua pergunta</label>
                      <input
                        id="recovery-question"
                        type="text"
                        required
                        minLength={5}
                        maxLength={200}
                        autoComplete="off"
                        value={recoveryQuestion}
                        onChange={(e) => setRecoveryQuestion(e.target.value)}
                        placeholder="Ex: Qual o nome do meu pet?"
                        className="w-full px-3.5 py-3 bg-[#131c2e] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="recovery-key" className="block text-[11px] font-semibold text-slate-300 mb-1">Sua resposta</label>
                      <input
                        id="recovery-key"
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        autoComplete="off"
                        value={recoveryKey}
                        onChange={(e) => setRecoveryKey(e.target.value)}
                        placeholder="Ex: Thor"
                        className="w-full px-3.5 py-3 bg-[#131c2e] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">Se esquecer a senha, mostraremos sua pergunta e você digita a resposta. Maiúsculas não importam.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm rounded-full transition-all shadow-md cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Cadastrando...' : 'Cadastrar e Iniciar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* MODE 3: RECOVERY */}
              {mode === 'recovery' && (
                <form onSubmit={handleRecover} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail Cadastrado *</label>
                    <input type="email" required autoComplete="off" readOnly={!!foundQuestion} value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="Ex: contato@empresa.com" className="w-full px-3.5 py-3 bg-[#131c2e] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 read-only:opacity-70" />
                  </div>
                  {foundQuestion && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sua pergunta</label>
                        <p className="px-3.5 py-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-sm font-semibold text-blue-100">{foundQuestion}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Resposta *</label>
                        <input type="text" required autoComplete="off" value={recoveryKeyInput} onChange={(e) => setRecoveryKeyInput(e.target.value)} placeholder="Digite sua resposta" className="w-full px-3.5 py-3 bg-[#131c2e] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nova Senha *</label>
                        <div className="relative">
                          <input type={showNewPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full px-3.5 py-3 bg-[#131c2e] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-11" />
                          <button type="button" aria-label="Mostrar senha" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmar Senha *</label>
                        <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="w-full px-3.5 py-3 bg-[#131c2e] border border-[#222f46] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                      </div>
                    </>
                  )}
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full transition-all shadow-md cursor-pointer disabled:opacity-50">
                    {loading ? 'Salvando...' : foundQuestion ? 'Redefinir Senha' : 'Continuar'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setFoundQuestion(null);
                        setRecoveryKeyInput('');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar ao login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Security Note */}
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Seus dados totalmente protegidos.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
