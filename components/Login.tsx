
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue via-[#0a192f] to-black p-4 font-sans">
      <Helmet>
        <title>Finance Pro 360 | Gestão Financeira Pessoal e Empresarial</title>
        <meta name="description" content="O Finance Pro 360 é a melhor plataforma para controle financeiro, gestão de gastos, investimentos e planejamento de metas. Transforme sua vida financeira hoje." />
        <meta name="keywords" content="finanças, controle financeiro, gestão de gastos, investimentos, metas financeiras, app financeiro, finance pro 360" />
      </Helmet>
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-md animate-fade-in relative overflow-hidden group">

        {/* Subtle glow effect behind the form */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-gold/20 rounded-full blur-[80px] group-hover:bg-brand-gold/30 transition-all duration-700 pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-all duration-700 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="mb-2 inline-flex justify-center w-full transform hover:scale-105 transition-transform duration-500">
            <Logo className="h-24 sm:h-32 w-auto" showText={false} />
          </div>
          <p className="text-slate-300/80 mt-4 text-sm font-medium tracking-wide">Gestão de Alta Performance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {authMode === 'register' && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 outline-none transition-all shadow-inner" placeholder="Como deseja ser chamado" required />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest pl-1">E-mail de Acesso</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
              <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 outline-none transition-all shadow-inner" placeholder="exemplo@email.com" required />
            </div>
          </div>

          {authMode !== 'recovery' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 outline-none transition-all shadow-inner" placeholder="••••••••" required />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 px-1">
            {authMode === 'login' ? (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-brand-gold" />
                  Lembrar e-mail
                </label>
                <button type="button" onClick={() => setAuthMode('recovery')} className="text-xs text-brand-gold hover:underline">Esqueceu a senha?</button>
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
            className="w-full mt-2 bg-gradient-to-r from-brand-gold via-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-black py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? <Loader2 className="animate-spin text-slate-900" size={20} /> : (
              <>
                {authMode === 'login' ? 'ENTRAR NO SISTEMA' : authMode === 'register' ? 'CRIAR MINHA CONTA' : 'RECUPERAR ACESSO'}
                <ArrowRight size={18} className="translate-y-[1px]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-6 relative z-10">
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            {authMode === 'login' ? 'Não tem conta? Registre-se agora' : 'Já possui conta? Faça Login'}
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
  );
};
