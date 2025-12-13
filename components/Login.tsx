
import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Database, Loader2, Check, AlertCircle, ArrowLeft, User } from 'lucide-react';
import { DBService } from '../db';
import { PrivacyModal } from './PrivacyModal';
import { Logo } from './Logo'; // IMPORTADO

interface LoginProps {
  onLogin: (username: string) => void;
  initialMessage?: string | null;
  messageType?: 'error' | 'success';
}

type AuthMode = 'login' | 'register' | 'recovery';

export const Login: React.FC<LoginProps> = ({ onLogin, initialMessage, messageType = 'error' }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState(''); // Novo campo Nome
  const [username, setUsername] = useState(''); // Agora será tratado como Email
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Carregar credenciais salvas e mensagens iniciais
  useEffect(() => {
    const savedUser = localStorage.getItem('fp360_saved_user');
    
    if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true);
    }

    if (initialMessage) {
        if (messageType === 'success') {
            setSuccessMsg(initialMessage);
        } else {
            setError(initialMessage);
        }
    }
  }, [initialMessage, messageType]);

  const handleSaveCredentials = (email: string) => {
    if (rememberMe) {
        localStorage.setItem('fp360_saved_user', email);
    } else {
        localStorage.removeItem('fp360_saved_user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    // Limpar espaços em branco acidentais
    const cleanEmail = username.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    // Validação básica de email
    if (!cleanEmail.includes('@')) {
        setError('Por favor, insira um e-mail válido.');
        setIsLoading(false);
        return;
    }

    if (authMode !== 'recovery' && (!cleanEmail || !cleanPassword)) {
      setError('Preencha os campos de email e senha.');
      setIsLoading(false);
      return;
    }

    if (authMode === 'register' && !cleanName) {
        setError('Por favor, informe seu nome completo.');
        setIsLoading(false);
        return;
    }

    try {
        if (authMode === 'recovery') {
            await DBService.requestPasswordReset(cleanEmail);
            setSuccessMsg('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
            setIsLoading(false);
            return;
        }

        if (authMode === 'register') {
            if (!acceptedTerms) {
                setError('Você precisa aceitar os Termos e Política de Privacidade para criar uma conta.');
                setIsLoading(false);
                return;
            }

            if (cleanPassword.length < 6) {
                setError('A senha deve ter no mínimo 6 caracteres.');
                setIsLoading(false);
                return;
            }

            // Registrar usuário com NOME
            const { user, session } = await DBService.registerUser({
                name: cleanName,
                username: cleanEmail,
                password: cleanPassword,
                createdAt: new Date().toISOString()
            });
            
            handleSaveCredentials(cleanEmail);

            if (session) {
                // Sessão criada automaticamente (Email confirmation OFF no Supabase)
                onLogin(user.id);
            } else if (user) {
                // Usuário criado, mas sem sessão (Email confirmation ON)
                setSuccessMsg('Cadastro realizado! Verifique seu e-mail (inclusive SPAM) para confirmar a conta antes de entrar.');
                setError('');
                setAuthMode('login'); // Volta para tela de login para forçar o usuário a ver a mensagem
            }

        } else {
            // Login
            const user = await DBService.loginUser(cleanEmail, cleanPassword);
            if (user) {
                handleSaveCredentials(cleanEmail);
                onLogin(user.id);
            }
        }
    } catch (err: any) {
        console.error("Erro auth:", err);
        // Tradução amigável de erros comuns do Supabase
        if (err.message.includes('Invalid login credentials')) {
            setError('E-mail ou senha incorretos. Se criou a conta agora, verifique se já confirmou o e-mail.');
        } else if (err.message.includes('Email not confirmed')) {
            setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
        } else if (err.message.includes('User already registered')) {
            setError('Este e-mail já está cadastrado. Tente fazer login.');
        } else if (err.message.includes('Rate limit')) {
            setError('Muitas tentativas. Aguarde alguns instantes.');
        } else {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue via-[#0a192f] to-black p-4 font-sans">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in relative overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10 flex flex-col items-center">
          {/* Logo Maior e com estilo */}
          <div className="mb-4 transform hover:scale-105 transition-transform duration-500">
             <Logo className="w-24 h-24" showText={false} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            FINANCE <span className="text-brand-gold">PRO 360</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Gestão financeira de alta performance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {/* Nome Completo - Apenas no Cadastro */}
          {authMode === 'register' && (
            <div>
                <label className="block text-xs font-bold text-brand-gold uppercase mb-1 ml-1 tracking-wider">Nome Completo</label>
                <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all"
                    placeholder="Seu nome"
                    disabled={isLoading}
                />
                </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-brand-gold uppercase mb-1 ml-1 tracking-wider">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={18} />
              <input 
                type="email" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {authMode !== 'recovery' && (
            <div>
                <label className="block text-xs font-bold text-brand-gold uppercase mb-1 ml-1 tracking-wider">Senha</label>
                <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all"
                    placeholder="••••••••"
                    disabled={isLoading}
                />
                </div>
            </div>
          )}

          {authMode === 'login' && (
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-brand-gold bg-slate-800 border-slate-600 rounded focus:ring-brand-gold cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer select-none hover:text-white transition-colors">
                        Lembrar-me
                    </label>
                </div>
                <button 
                    type="button" 
                    onClick={() => switchMode('recovery')} 
                    className="text-xs text-brand-gold hover:text-yellow-400 font-medium transition-colors"
                >
                    Esqueceu a senha?
                </button>
              </div>
          )}
          
          {/* LGPD Consent Checkbox - Only on Register */}
          {authMode === 'register' && (
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 text-brand-gold bg-slate-800 border-slate-600 rounded focus:ring-brand-gold cursor-pointer shrink-0"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-400 cursor-pointer leading-relaxed">
                        Li e concordo com os <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-brand-gold font-bold hover:underline">Termos de Uso</button>.
                    </label>
                </div>
             </div>
          )}

          {successMsg && (
             <div className="p-3 rounded-lg text-sm font-medium text-center border animate-fade-in bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex flex-col items-center gap-2">
                <Check size={20} />
                {successMsg}
             </div>
          )}

          {error && (
            <div className="p-3 rounded-lg text-sm font-medium text-center border animate-fade-in bg-rose-500/10 text-rose-400 border-rose-500/30 flex flex-col items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <>
                    {authMode === 'login' ? 'ACESSAR SISTEMA' : authMode === 'register' ? 'CRIAR CONTA' : 'RECUPERAR'}
                    {authMode === 'login' && <ArrowRight size={18} />}
                    {authMode === 'recovery' && <Mail size={18} />}
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10 flex flex-col gap-3">
          {authMode === 'recovery' ? (
             <button 
                onClick={() => switchMode('login')}
                className="text-sm text-slate-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-2"
             >
                <ArrowLeft size={16} /> Voltar para o Login
             </button>
          ) : (
              <button 
                onClick={() => switchMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sm text-slate-400 hover:text-brand-gold font-medium transition-colors"
                disabled={isLoading}
              >
                {authMode === 'login' ? 'Não tem conta? Criar nova' : 'Já possui conta? Fazer Login'}
              </button>
          )}
        </div>
        
        <div className="mt-8 text-center">
            <button onClick={() => setShowPrivacyModal(true)} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                Política de Privacidade & LGPD • © 2030 Finance Pro 360
            </button>
        </div>
      </div>

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};
