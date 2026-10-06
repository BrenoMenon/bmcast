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
  ShieldCheck,
  Tv,
  CloudSun,
  QrCode,
  Radio,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { authService } from '../../services/authService';

interface LoginScreenProps {
  onSuccess: (user: { id: string; name: string; email: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recovery Key Fields
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
      onSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = authService.signUp({
      name,
      email,
      password,
      securityQuestion,
      securityAnswer,
    });
    setLoading(false);

    if (res.success && res.user) {
      onSuccess(res.user);
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
      setSuccessMsg('Pergunta de segurança localizada com sucesso.');
    } else {
      setDetectedQuestion(null);
      setErrorMsg('E-mail não localizado na base do sistema.');
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
        if (u) onSuccess(u);
      }, 700);
    } else {
      setErrorMsg(res.error || 'Não foi possível redefinir sua senha.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-slate-100 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT COLUMN: HERO ASIDE (Exact BL Core Style) */}
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16 text-white">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.4) 40%, rgba(13, 19, 31, 1) 90%)',
            }}
          />

          {/* Decorative glowing sphere */}
          <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-10 bottom-1/4 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Logo size="lg" />
          </div>

          {/* Center Pitch Content */}
          <div className="relative z-10 max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-[#2dd4bf]">
              <Tv className="w-3.5 h-3.5" />
              <span>Sinalização Digital & TV Corporativa</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Transforme telas comuns em <span className="bl-gradient-text">canais de alta conversão</span>
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Sistema moderno para exibição de cardápios interativos, comunicados corporativos, previsão do tempo ao vivo via API e QR Codes personalizáveis.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#151f32]/80 border border-[#25334a] backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 text-[#2dd4bf] font-bold text-xs">
                  <CloudSun className="w-4 h-4" />
                  <span>Clima ao Vivo</span>
                </div>
                <p className="text-[11px] text-slate-400">Dados oficiais atualizados automaticamente na TV.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#151f32]/80 border border-[#25334a] backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 text-[#2dd4bf] font-bold text-xs">
                  <QrCode className="w-4 h-4" />
                  <span>QR Code & Marca</span>
                </div>
                <p className="text-[11px] text-slate-400">Personalize marca e QR code em cada slide.</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#2dd4bf]" />
            <span>Plataforma protegida e preparada para transmissão 24/7.</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: LOGIN FORM CONTAINER (Exact BL Core Style) */}
        <div className="relative flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile Header Logo */}
            <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
              <Logo size="lg" />
            </div>

            {/* Rounded Card */}
            <div className="rounded-3xl border border-[#25334a] bg-[#151f32] p-6 sm:p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                  {mode === 'signin' && 'Bem-vindo de volta'}
                  {mode === 'signup' && 'Criar sua conta'}
                  {mode === 'recovery' && 'Recuperar acesso'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  {mode === 'signin' && 'Entre na sua conta ou crie uma nova em segundos.'}
                  {mode === 'signup' && 'Cadastre seu estabelecimento e inicie a transmissão.'}
                  {mode === 'recovery' && 'Responda sua pergunta secreta para cadastrar nova senha.'}
                </p>
              </div>

              {/* Segmented Rounded Pill Tabs */}
              <div className="grid w-full grid-cols-2 bg-[#0d131f] p-1.5 rounded-full border border-[#25334a] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-[#2dd4bf] text-[#042f2e] shadow-md font-bold'
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
                      ? 'bg-[#2dd4bf] text-[#042f2e] shadow-md font-bold'
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
                <div className="p-3.5 mb-5 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
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
                        placeholder="nome@empresa.com"
                        className="w-full pl-10 pr-4 py-3 bg-[#0d131f] border border-[#25334a] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/25 transition-all"
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
                          setRecoveryEmail(email);
                          if (email) {
                            const q = authService.getSecurityQuestion(email);
                            if (q) setDetectedQuestion(q);
                          }
                        }}
                        className="text-xs text-[#2dd4bf] hover:underline cursor-pointer"
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
                        className="w-full pl-10 pr-11 py-3 bg-[#0d131f] border border-[#25334a] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/25 transition-all"
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
                    className="w-full py-3.5 px-6 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-[0.98] text-[#042f2e] font-bold text-sm rounded-full transition-all shadow-md cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Entrando...' : 'Entrar na Plataforma'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* MODE 2: SIGN UP */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
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
                        placeholder="Ex: Pontes Lanches & Burger"
                        className="w-full pl-10 pr-4 py-3 bg-[#0d131f] border border-[#25334a] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/25 transition-all"
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
                        placeholder="contato@empresa.com"
                        className="w-full pl-10 pr-4 py-3 bg-[#0d131f] border border-[#25334a] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/25 transition-all"
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
                        className="w-full pl-10 pr-11 py-3 bg-[#0d131f] border border-[#25334a] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/25 transition-all"
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

                  {/* Pergunta de Recuperação */}
                  <div className="p-4 rounded-2xl bg-[#0d131f] border border-[#25334a] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <KeyRound className="w-4 h-4 text-[#2dd4bf]" />
                      <span>Chave de Recuperação de Senha</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                        Escreva sua Pergunta Secreta *
                      </label>
                      <input
                        type="text"
                        required
                        value={securityQuestion}
                        onChange={(e) => setSecurityQuestion(e.target.value)}
                        placeholder="Ex: Qual foi o meu primeiro carro?"
                        className="w-full px-3.5 py-2.5 bg-[#151f32] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                        Digite a Resposta *
                      </label>
                      <input
                        type="text"
                        required
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        placeholder="Digite a resposta correta"
                        className="w-full px-3.5 py-2.5 bg-[#151f32] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-[0.98] text-[#042f2e] font-bold text-sm rounded-full transition-all shadow-md cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Cadastrando...' : 'Cadastrar e Iniciar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* MODE 3: RECOVERY */}
              {mode === 'recovery' && (
                <form onSubmit={handleRecover} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      E-mail Cadastrado
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="seuemail@empresa.com"
                        className="flex-1 px-3.5 py-3 bg-[#0d131f] border border-[#25334a] rounded-xl text-sm text-white focus:outline-none focus:border-[#2dd4bf]"
                      />
                      <button
                        type="button"
                        onClick={handleCheckEmailForRecovery}
                        className="px-5 py-3 bg-[#1e293b] hover:bg-[#28384f] text-xs font-bold text-white rounded-full transition-colors cursor-pointer border border-[#2d3d57]"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {detectedQuestion && (
                    <div className="p-4 rounded-2xl bg-[#0d131f] border border-[#25334a] space-y-3">
                      <div className="text-xs text-slate-400 font-semibold">
                        Sua Pergunta Secreta:
                      </div>
                      <div className="p-3 rounded-xl bg-[#151f32] border border-[#25334a] text-xs font-bold text-white">
                        {detectedQuestion}
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Sua Resposta *
                        </label>
                        <input
                          type="text"
                          required
                          value={recoveryAnswerInput}
                          onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                          placeholder="Digite a resposta"
                          className="w-full px-3.5 py-2.5 bg-[#151f32] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nova Senha *
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-3.5 pr-10 py-2.5 bg-[#151f32] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Confirmar Senha *
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full px-3.5 py-2.5 bg-[#151f32] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-[#042f2e] font-bold text-xs rounded-full transition-all shadow-md cursor-pointer"
                      >
                        Redefinir Senha
                      </button>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
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
              <ShieldCheck className="h-4 w-4 text-[#2dd4bf]" />
              <span>Seus dados totalmente protegidos.</span>
            </p>

            {/* FOOTER WITH COPYRIGHT FIRST */}
            <footer className="mt-4 border-0 px-4 py-4 text-center text-xs text-slate-400">
              <p className="mx-auto max-w-2xl leading-relaxed">
                © Desenvolvido por <span className="font-semibold text-white">Breno Menon</span> | <span className="text-[#2dd4bf] font-bold">BM Digital</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
