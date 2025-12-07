
import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Wallet, Database, Loader2, Check, X as XIcon, KeyRound, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { DBService } from '../db';
import { supabase } from '../supabaseClient';
import { PrivacyModal } from './PrivacyModal';

interface LoginProps {
  onLogin: (username: string) => void;
  initialMessage?: string | null;
  messageType?: 'error' | 'success';
}

export const Login: React.FC<LoginProps> = ({ onLogin, initialMessage, messageType = 'error' }) => {
  const [isRegistering, setIsRegistering] = useState(false);
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

    // Validação básica de email
    if (!cleanEmail.includes('@')) {
        setError('Por favor, insira um e-mail válido.');
        setIsLoading(false);
        return;
    }

    if (!cleanEmail || !cleanPassword) {
      setError('Preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
        if (isRegistering) {
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

            // Registrar usuário
            const { user, session } = await DBService.registerUser({
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
                setIsRegistering(false); // Volta para tela de login para forçar o usuário a ver a mensagem
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-fade-in relative overflow-hidden transition-colors">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full z-0 opacity-50"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-xl mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50">
             <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Finance Pro 360</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-2">
            <Database size={14} className="text-blue-500"/>
            Cloud Database
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Sua senha segura"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between ml-1">
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Lembrar E-mail
                </label>
            </div>
          </div>
          
          {/* LGPD Consent Checkbox - Only on Register */}
          {isRegistering && (
             <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                        Li e concordo com os <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Termos de Uso e Política de Privacidade</button>, consentindo com a coleta e tratamento dos meus dados para fins de gestão financeira.
                    </label>
                </div>
             </div>
          )}

          {successMsg && (
             <div className="p-3 rounded-lg text-sm font-medium text-center border animate-fade-in bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 flex flex-col items-center gap-2">
                <Check size={20} />
                {successMsg}
             </div>
          )}

          {error && (
            <div className="p-3 rounded-lg text-sm font-medium text-center border animate-fade-in bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800 flex flex-col items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <>
                    {isRegistering ? 'Criar Conta' : 'Entrar'}
                    <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            disabled={isLoading}
          >
            {isRegistering ? 'Já possui conta? Fazer Login' : 'Não tem conta? Criar nova'}
          </button>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-xs text-slate-400 flex flex-col items-center">
        <span>© 2030 Finance Pro 360 Inc.</span>
        <button onClick={() => setShowPrivacyModal(true)} className="text-[10px] opacity-70 hover:opacity-100 underline mt-1">
            Política de Privacidade & LGPD
        </button>
      </div>

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};
