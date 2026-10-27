import React, { useEffect, useState } from 'react';
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
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { authService, User as AuthUser } from '../../services/authService';
import { useTheme } from '../../services/themeService';

interface LoginScreenProps {
  onSuccess: (user: AuthUser) => void;
}

const inputBaseCls =
  'w-full py-3 bg-input/60 border border-border rounded-2xl text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 transition';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { theme, toggleTheme } = useTheme();
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
  const [flashToast, setFlashToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const flash = sessionStorage.getItem('bmcast_flash_msg');
      if (flash) {
        sessionStorage.removeItem('bmcast_flash_msg');
        setSuccessMsg(flash);
        setFlashToast(flash);
        const timer = setTimeout(() => setFlashToast(null), 6500);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage errors
    }
    return undefined;
  }, []);

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
        setSuccessMsg('Conta criada com sucesso! Entrando no painel...');
        const u = res.user;
        setTimeout(() => onSuccess(u), 700);
      } else setErrorMsg(res.error || 'Erro ao registrar conta.');
    });
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundQuestion) {
      run(async () => {
        const q = await authService.findRecoveryQuestionAsync(recoveryEmail);
        if (!q) setErrorMsg('Não encontramos uma conta com este e-mail.');
        else setFoundQuestion(q);
      });
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
        setTimeout(() => onSuccess(u), 700);
      } else setErrorMsg(res.error || 'Não foi possível redefinir sua senha.');
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between font-sans transition-colors duration-200 overflow-x-hidden">
      {flashToast && (
        <div className="fixed top-4 left-4 right-16 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-600 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{flashToast}</span>
        </div>
      )}
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT COLUMN: BLCORE HERO SHOWCASE */}
        <aside
          className="relative hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16 text-white border-r border-border overflow-hidden"
          style={{ background: 'var(--gradient-hero)' }}
        >
          <div className="relative z-10">
            <Logo size="lg" forceLightText />
          </div>

          <div className="relative z-10 max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-sky-200 ring-1 ring-white/15 backdrop-blur-md">
              <Tv className="h-3.5 w-3.5 text-sky-300" />
              <span>Sinalização Digital &amp; TV Corporativa</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Painel profissional para <span className="text-sky-300">telas e TVs da sua empresa</span>
            </h2>

            <p className="text-white/80 text-sm leading-relaxed">
              Gerencie cardápios digitais, ofertas, murais corporativos, previsão do tempo ao vivo e QR Codes interativos com atualização instantânea nas suas telas.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-md space-y-1.5">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                  <CloudSun className="h-4 w-4" />
                  <span>Clima &amp; Letreiro</span>
                </div>
                <p className="text-xs text-white/75 leading-relaxed">
                  Meteorologia em tempo real e faixa de avisos contínua na tela.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-md space-y-1.5">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                  <QrCode className="h-4 w-4" />
                  <span>QR Code Interativo</span>
                </div>
                <p className="text-xs text-white/75 leading-relaxed">
                  Conecte clientes ao cardápio, WhatsApp ou Instagram direto pela TV.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-white/75">
            <ShieldCheck className="h-4 w-4 text-sky-300 shrink-0" />
            <span>Transmissão otimizada para TVs e totens.</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: BLCORE AUTH CARD */}
        <div className="relative flex items-center justify-center px-4 pt-16 pb-10 sm:px-8 sm:py-16 lg:px-12 bg-background">
          {/* Top-right Icon-Only Theme Switcher (anchored at page top so it does not scroll along) */}
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-30">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur-md hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="w-full max-w-md">
            {/* Mobile Brand */}
            <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
              <Logo size="md" />
            </div>

            {/* Extra-rounded blcore Card */}
            <div className="bl-card rounded-3xl sm:rounded-[2rem] p-5 sm:p-8">
              <div className="mb-5 sm:mb-6">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                  {mode === 'signin' && 'Bem-vindo de volta'}
                  {mode === 'signup' && 'Criar sua conta'}
                  {mode === 'recovery' && 'Recuperar acesso'}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {mode === 'signin' && 'Acesse seu painel de transmissão ou cadastre sua empresa.'}
                  {mode === 'signup' && 'Configure sua conta limpa do zero em poucos segundos.'}
                  {mode === 'recovery' && 'Responda sua pergunta de segurança para redefinir a senha.'}
                </p>
              </div>

              {/* Segmented Pill Switcher */}
              {mode !== 'recovery' && (
                <div className="grid w-full grid-cols-2 rounded-full border border-border bg-muted/70 p-1 mb-5 sm:mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`rounded-full py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
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
                    className={`rounded-full py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Criar conta
                  </button>
                </div>
              )}

              {/* Alerts */}
              {errorMsg && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-destructive/35 bg-destructive/10 p-3.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-foreground animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{successMsg}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@empresa.com"
                        autoComplete="off"
                        className={`${inputBaseCls} pl-11 pr-4`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="block text-xs font-semibold text-foreground">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('recovery');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputBaseCls} pl-11 pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Alternar visibilidade da senha"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Entrando...' : 'Entrar na Plataforma'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* MODE 2: SIGN UP */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Nome da Empresa ou Responsável *
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Minha Empresa"
                        className={`${inputBaseCls} pl-11 pr-4`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      E-mail Comercial *
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contato@empresa.com"
                        autoComplete="off"
                        className={`${inputBaseCls} pl-11 pr-4`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Senha de Acesso (mínimo 6 caracteres) *
                    </label>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputBaseCls} pl-11 pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Alternar visibilidade da senha"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl sm:rounded-3xl border border-border bg-muted/45 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <KeyRound className="h-4 w-4 text-primary shrink-0" />
                      <span>Pergunta de Recuperação de Senha *</span>
                    </div>
                    <div>
                      <label htmlFor="recovery-question" className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                        Sua pergunta
                      </label>
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
                        className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="recovery-key" className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                        Sua resposta
                      </label>
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
                        className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Cadastrando...' : 'Cadastrar e Iniciar'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* MODE 3: RECOVERY */}
              {mode === 'recovery' && (
                <form onSubmit={handleRecover} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      E-mail Cadastrado *
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      readOnly={!!foundQuestion}
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="contato@empresa.com"
                      className={`${inputBaseCls} px-4 read-only:opacity-70`}
                    />
                  </div>
                  {foundQuestion && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                          Sua pergunta de segurança
                        </label>
                        <p className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">
                          {foundQuestion}
                        </p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                          Resposta *
                        </label>
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          value={recoveryKeyInput}
                          onChange={(e) => setRecoveryKeyInput(e.target.value)}
                          placeholder="Digite sua resposta"
                          className={`${inputBaseCls} px-4`}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                          Nova Senha *
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className={`${inputBaseCls} pl-4 pr-11`}
                          />
                          <button
                            type="button"
                            aria-label="Mostrar senha"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                          Confirmar Senha *
                        </label>
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className={`${inputBaseCls} px-4`}
                        />
                      </div>
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Verificando...' : foundQuestion ? 'Redefinir Senha' : 'Continuar'}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setFoundQuestion(null);
                        setRecoveryKeyInput('');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Voltar ao login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer with comfortable spacing between phrases */}
            <footer className="mt-8 flex flex-col items-center gap-4 text-center px-2">
              <p className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Seus dados totalmente protegidos.</span>
              </p>

              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                © 2026 <span className="font-bold text-primary">BM CAST</span> · Desenvolvido por{' '}
                <span className="font-semibold text-primary">Breno Menon</span>{' '}
                <span className="text-muted-foreground/60">|</span>{' '}
                <span className="font-bold text-sky-500 dark:text-sky-400">BM Digital</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
