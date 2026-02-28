
import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Loader2, Check, AlertCircle, User, ShieldCheck } from 'lucide-react';
import { DBService } from '../db';
import { PrivacyModal } from './PrivacyModal';
import { Logo } from './Logo';
import { Helmet } from 'react-helmet-async';

interface LoginProps {
  onLogin: (username: string) => void;
  initialMessage?: string | null;
  messageType?: 'error' | 'success';
}

type AuthMode = 'login' | 'register' | 'recovery';

export const Login: React.FC<LoginProps> = ({ onLogin, initialMessage, messageType = 'error' }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // Tratado como E-mail
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('fp360_saved_user');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
    if (initialMessage) {
      if (messageType === 'success') setSuccessMsg(initialMessage);
      else setError(initialMessage);
    }
  }, [initialMessage, messageType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    const cleanEmail = username.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail.includes('@')) {
      setError('Por favor, insira um e-mail válido.');
      setIsLoading(false);
      return;
    }

    try {
      if (authMode === 'recovery') {
        await DBService.requestPasswordReset(cleanEmail);
        setSuccessMsg('Se o e-mail estiver cadastrado, você receberá um link de recuperação.');
      } else if (authMode === 'register') {
        if (!acceptedTerms) {
          setError('Você precisa aceitar os termos de privacidade (LGPD) para criar uma conta.');
          setIsLoading(false);
          return;
        }
        if (cleanPassword.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');

        const { user, session } = await DBService.registerUser({
          name: cleanName,
          username: cleanEmail,
          password: cleanPassword,
          createdAt: new Date().toISOString()
        });

        if (session) onLogin(user.id);
        else {
          setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.');
          setAuthMode('login');
        }
      } else {
        const user = await DBService.loginUser(cleanEmail, cleanPassword);
        if (user) {
          if (rememberMe) localStorage.setItem('fp360_saved_user', cleanEmail);
          else localStorage.removeItem('fp360_saved_user');
          onLogin(user.id);
        }
      }
    } catch (err: any) {
      // Improved error handling
      let msg = '';
      if (typeof err === 'string') msg = err;
      else if (err instanceof Error) msg = err.message;
      else if (err?.message) msg = err.message;
      else if (err?.error_description) msg = err.error_description;

      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique se digitou corretamente.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Tente recuperar a senha ou fazer login.');
      } else if (msg.includes('rate limit')) {
        setError('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else {
        // Only log unexpected system errors
        console.warn("Auth warning:", err);
        setError(msg || 'Erro na autenticação. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a192f] font-sans selection:bg-brand-gold/30 selection:text-white">
      <Helmet>
        <title>Finance Pro 360 | Gestão Financeira Pessoal e Empresarial</title>
        <meta name="description" content="O Finance Pro 360 é a melhor plataforma para controle financeiro." />
      </Helmet>

      {/* Left Side: Hero Image Banner (Re-using the logo image as an immersive banner) */}
      <div className="w-full lg:w-[55%] relative flex flex-col justify-between items-start min-h-[35vh] lg:min-h-screen overflow-hidden">
        {/* Background Image Setup */}
        <div className="absolute inset-0 z-0">
          <img
            src="/logo.png"
            alt="Finance Pro 360"
            className="w-full h-full object-cover lg:object-center opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1640622300473-977435c38c04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
            }}
          />
          {/* Gradient overlays to blend into the right panel and dark background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-[#0a192f]/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#0a192f]/80 lg:to-[#0a192f] mix-blend-multiply"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a192f] to-transparent lg:hidden"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a192f] to-transparent hidden lg:block"></div>
        </div>

        {/* Optional Logo overlay on Desktop */}
        <div className="relative z-10 p-8 lg:p-14 w-full h-full flex flex-col justify-end pb-12 opacity-0 animate-fade-in [animation-fill-mode:forwards] [animation-delay:400ms] hidden lg:flex">
          <div className="max-w-xl">
            <div className="mb-6">
              <div className="w-16 h-1 w-12 bg-brand-gold rounded-full mb-6 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-full bg-white/50 animate-shimmer"></div></div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-xl">
              Domine suas <br /><span className="text-brand-gold bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-amber-300">plano de ação.</span>
            </h1>
            <p className="text-lg text-slate-300/90 font-medium leading-relaxed max-w-lg drop-shadow-md">
              O Finance Pro 360 centraliza sua gestão financeira e estratégica em um ecossistema de alta performance.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 lg:p-16 relative bg-[#0a192f] z-10 -mt-8 sm:-mt-12 lg:mt-0 rounded-t-[2.5rem] lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none min-h-[65vh] lg:min-h-screen">

        {/* Subtle glow orb */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md animate-fade-in relative z-10">

          {/* Mobile Logo Fallback */}
          <div className="lg:hidden relative flex justify-center mb-8">
            <div className="w-20 h-1 bg-white/10 rounded-full mb-8 absolute -top-12"></div>
            <Logo className="h-20 w-auto" showText={false} />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-white mb-2">
              {authMode === 'login' ? 'Acessar Painel' : authMode === 'register' ? 'Criar Nova Conta' : 'Recuperar Acesso'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {authMode === 'login' ? 'Insira suas credenciais para continuar' : authMode === 'register' ? 'Preencha seus dados para entrar a bordo' : 'Enviaremos instruções para o seu e-mail'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {authMode === 'register' && (
              <div className="animate-fade-in">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-widest pl-1">Nome Completo</label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-brand-gold transition-colors" size={18} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm placeholder-slate-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" placeholder="Como deseja ser chamado" required />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-widest pl-1">E-mail de Acesso</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-brand-gold transition-colors" size={18} />
                <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm placeholder-slate-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" placeholder="ex. diretor@empresa.com" required />
              </div>
            </div>

            {authMode !== 'recovery' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-widest pl-1">Senha</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-brand-gold transition-colors" size={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm placeholder-slate-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" placeholder="••••••••" required />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 px-1">
              {authMode === 'login' ? (
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-gold focus:ring-brand-gold/50 focus:ring-offset-slate-900" />
                    <span className="select-none">Lembrar-me</span>
                  </label>
                  <button type="button" onClick={() => setAuthMode('recovery')} className="text-sm font-medium text-brand-gold hover:text-yellow-400 transition-colors">Esqueceu a senha?</button>
                </div>
              ) : authMode === 'register' && (
                <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer group">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-gold" />
                  <span>
                    Li e aceito a <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-brand-gold font-bold hover:underline">Política de Privacidade e Termos da LGPD</button>.
                  </span>
                </label>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed font-medium">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3 animate-fade-in">
                <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300 leading-relaxed font-medium">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-brand-gold via-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-black py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:shadow-[0_15px_40px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:hover:translate-y-0 text-sm tracking-wide uppercase"
            >
              {isLoading ? <Loader2 className="animate-spin text-slate-900" size={20} /> : (
                <>
                  {authMode === 'login' ? 'Acessar Plataforma' : authMode === 'register' ? 'Criar minha conta' : 'Enviar Link de Recuperação'}
                  <ArrowRight size={18} className="translate-y-[1px]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center flex flex-col gap-6 relative z-10">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              {authMode === 'login' ? 'Não tem conta? Registre-se gratuitamente' : 'Já possui conta? Fazer Login'}
            </button>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="group flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ShieldCheck size={14} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[11px] uppercase tracking-widest font-bold">Segurança & Privacidade LGPD</span>
              </button>
            </div>
          </div>
        </div>
        <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      </div>
    </div>
  );
};
