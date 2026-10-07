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
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';

interface LoginScreenProps {
  onSuccess: (user: { id: string; name: string; email: string }, isNewRegistration?: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { theme } = useTheme();
  // As requested: the LEFT column ALWAYS stays dark, while ONLY the right column adapts to light/dark
  const isRightDark = theme === 'dark';

  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recovery Key Fields (no hardcoded suggestion, empty by default)
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Password Reset Fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [detectedQuestion, setDetectedQuestion] = useState<string | null>(null);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.user) {
      const authenticatedUser = res.user;
      setSuccessMsg(`Bem-vindo de volta, ${authenticatedUser.name || 'Usuário'}! Login realizado com sucesso.`);
      try {
        sessionStorage.setItem(
          'bmcast_auth_flash',
          JSON.stringify({
            visible: true,
            message: `Bem-vindo de volta, ${authenticatedUser.name || 'Usuário'}! Login realizado com sucesso.`,
            type: 'login',
          })
        );
      } catch {}
      setTimeout(() => {
        onSuccess(authenticatedUser, false);
      }, 400);
    } else {
      setErrorMsg(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await authService.signUp({
      name,
      email,
      password,
      securityQuestion,
      securityAnswer,
    });
    setLoading(false);

    if (res.success && res.user) {
      const newUser = res.user;
      setSuccessMsg(`Conta criada com sucesso! Seja bem-vindo ao BM CAST, ${newUser.name}!`);
      try {
        sessionStorage.setItem(
          'bmcast_auth_flash',
          JSON.stringify({
            visible: true,
            message: `Conta criada com sucesso! Seja bem-vindo ao BM CAST, ${newUser.name}!`,
            type: 'signup',
          })
        );
      } catch {}
      setTimeout(() => {
        onSuccess(newUser, true);
      }, 500);
    } else {
      setErrorMsg(res.error || 'Erro ao registrar conta.');
    }
  };

  const handleCheckEmailForRecovery = () => {
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido para busca.');
      return;
    }
    setErrorMsg(null);
    const q = authService.getSecurityQuestion(recoveryEmail);
    if (q) {
      setDetectedQuestion(q);
      setSuccessMsg('Pergunta de segurança localizada.');
    } else {
      setDetectedQuestion(null);
      setErrorMsg('E-mail não localizado no sistema.');
    }
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas informadas não coincidem.');
      return;
    }

    setLoading(true);
    const res = authService.recoverPassword({
      email: recoveryEmail,
      securityAnswer: recoveryAnswerInput,
      newPassword,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Senha atualizada com sucesso.');
      setTimeout(() => {
        const u = authService.getCurrentUser();
        if (u) onSuccess(u, false);
      }, 700);
    } else {
      setErrorMsg(res.error || 'Não foi possível redefinir sua senha.');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 
        LEFT COLUMN: ALWAYS STAYS IN DARK THEME
        Clean corporate broadcast layout, unchanged by light mode toggle
      */}
      <aside className="relative hidden lg:flex flex-col justify-between p-8 xl:p-12 bg-[#0c1220] text-white border-r border-slate-800/80 overflow-hidden select-none">
        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo size="lg" variant="dark" />
        </div>

        {/* Center Pitch Content */}
        <div className="relative z-10 max-w-lg space-y-5 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/25 text-sky-400">
            <Tv className="w-3.5 h-3.5" />
            <span>Sinalização Digital Corporativa</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight text-white">
            Gestão profissional de telas e menus para o seu negócio
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Painel completo para sincronização de Smart TVs em tempo real, letreiros ao vivo, boletim meteorológico e cardápios dinâmicos.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#111827]/70">
              <span className="block text-xl font-black text-sky-400">100%</span>
              <span className="text-xs text-slate-400">Personalizável com sua marca</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#111827]/70">
              <span className="block text-xl font-black text-sky-400">24/7</span>
              <span className="text-xs text-slate-400">Transmissão em Tempo Real</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <span>Desenvolvido por Breno Menon | BM Digital</span>
        </div>
      </aside>

      {/* 
        RIGHT COLUMN: ADAPTS TO LIGHT/DARK MODE
        Compact, clean cards, no border clipping
      */}
      <main
        className={`relative flex flex-col justify-between p-5 sm:p-8 lg:p-12 transition-colors duration-200 overflow-y-auto ${
          isRightDark ? 'bg-[#090e17] text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Top Bar on Right Column */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Auth Box Container */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          <div className="mb-6">
            <h1
              className={`text-2xl font-black tracking-tight ${
                isRightDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {mode === 'signin' && 'Acessar seu Painel'}
              {mode === 'signup' && 'Criar Nova Conta'}
              {mode === 'recovery' && 'Recuperar Acesso'}
            </h1>
            <p className={`text-xs mt-1 ${isRightDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {mode === 'signin' && 'Entre para gerenciar suas transmissões, telas e slides.'}
              {mode === 'signup' && 'Cadastre seu estabelecimento para iniciar o sistema.'}
              {mode === 'recovery' && 'Responda sua pergunta secreta para definir uma nova senha.'}
            </p>
          </div>

          {/* Feedback */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-600 dark:text-sky-400">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isRightDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isRightDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@empresa.com"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    className={`block text-xs font-semibold ${
                      isRightDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isRightDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                      isRightDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-5 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Acessando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <p className={`text-xs ${isRightDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Não possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    Cadastre-se grátis
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isRightDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Nome do Estabelecimento ou Responsável *
                </label>
                <div className="relative">
                  <User
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isRightDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pizzaria Bella / João Silva"
                    className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isRightDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  E-mail Oficial *
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isRightDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isRightDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Crie sua Senha (mín. 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isRightDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                      isRightDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Question Compact Card */}
              <div
                className={`p-3 rounded-xl border space-y-2 box-border ${
                  isRightDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Chave de Recuperação</span>
                </div>

                <div>
                  <label
                    className={`block text-[10px] mb-1 font-medium ${
                      isRightDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Pergunta Secreta *
                  </label>
                  <input
                    type="text"
                    required
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    placeholder="Digite sua pergunta (ex: Primeiro animal de estimação, Cidade onde nasceu...)"
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[10px] mb-1 font-medium ${
                      isRightDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Sua Resposta Secreta *
                  </label>
                  <input
                    type="text"
                    required
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Digite sua resposta"
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                      isRightDark
                        ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-5 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Cadastrando...' : 'Cadastrar e Abrir Tutorial'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1.5 text-center">
                <p className={`text-xs ${isRightDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 3: PASSWORD RECOVERY */}
          {mode === 'recovery' && (
            <div className="space-y-3.5">
              {!detectedQuestion ? (
                <div className="space-y-3">
                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isRightDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Informe seu E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          isRightDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      />
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="seuemail@empresa.com"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                          isRightDark
                            ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckEmailForRecovery}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Localizar Pergunta de Segurança</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecover} className="space-y-3">
                  <div
                    className={`p-3 rounded-xl border space-y-1.5 box-border ${
                      isRightDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">
                      Pergunta Secreta
                    </span>
                    <p className={`text-xs font-semibold ${isRightDark ? 'text-white' : 'text-slate-900'}`}>
                      "{detectedQuestion}"
                    </p>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isRightDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Sua Resposta
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryAnswerInput}
                      onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                      placeholder="Digite a resposta correta"
                      className={`w-full px-3 py-2 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                        isRightDark
                          ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isRightDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Nova Senha (mín. 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          isRightDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-9 py-2 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                          isRightDark
                            ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${
                          isRightDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isRightDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Confirme a Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                        isRightDark
                          ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Salvando...' : 'Salvar Nova Senha'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setDetectedQuestion(null);
                  }}
                  className={`text-xs inline-flex items-center gap-1 font-semibold cursor-pointer ${
                    isRightDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom footer */}
        <div className="w-full max-w-md mx-auto pt-4 text-center">
          <p className={`text-xs font-medium ${isRightDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Desenvolvido por Breno Menon | BM Digital
          </p>
        </div>
      </main>
    </div>
  );
};
