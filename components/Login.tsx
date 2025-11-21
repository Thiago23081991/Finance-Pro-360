
import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Wallet, Database, Loader2, Check, X as XIcon, KeyRound } from 'lucide-react';
import { DBService } from '../db';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset Password State
  const [isResetting, setIsResetting] = useState(false);
  const [resetUser, setResetUser] = useState('');
  const [resetPass, setResetPass] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Carregar credenciais salvas ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('fp360_saved_user');
    const savedPass = localStorage.getItem('fp360_saved_pass');
    
    if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true); // Se tem dados salvos, marca o checkbox
    }
    if (savedPass) setPassword(savedPass);
  }, []);

  // Critérios de validação
  const validations = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const handleSaveCredentials = () => {
    if (rememberMe) {
        localStorage.setItem('fp360_saved_user', username);
        localStorage.setItem('fp360_saved_pass', password);
    } else {
        localStorage.removeItem('fp360_saved_user');
        localStorage.removeItem('fp360_saved_pass');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
        if (isRegistering) {
            // Validação de Força de Senha
            if (!validations.minLength || !validations.hasUpperCase || !validations.hasNumber || !validations.hasSpecialChar) {
                setError('A senha não atende aos requisitos de segurança.');
                setIsLoading(false);
                return;
            }

            await DBService.registerUser({
                username,
                password,
                createdAt: new Date().toISOString()
            });
            
            handleSaveCredentials();

            // Auto login after register
            onLogin(username);
        } else {
            const isValid = await DBService.loginUser(username, password);
            if (isValid) {
                handleSaveCredentials();
                onLogin(username);
            } else {
                setError('Usuário ou senha incorretos.');
            }
        }
    } catch (err: any) {
        setError(err.message || 'Ocorreu um erro no banco de dados.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenReset = () => {
      setIsResetting(true);
      setResetUser('');
      setResetPass('');
      setMasterKey('');
      setError('');
      setResetStatus('idle');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetStatus('idle');
      setError('');
      
      // Validação da Chave Mestra (Simulada para ambiente sem backend)
      // Remove espaços em branco antes e depois e converte para minúsculo para evitar erros de digitação
      if (masterKey.trim().toLowerCase() !== 'finance360') {
          setError('Chave de segurança inválida.');
          setResetStatus('error');
          return;
      }

      if (!resetUser || !resetPass) {
          setError('Preencha todos os campos.');
          setResetStatus('error');
          return;
      }

      try {
          await DBService.resetUserPassword(resetUser, resetPass);
          setResetStatus('success');
          setTimeout(() => {
              setIsResetting(false);
              setResetStatus('idle');
              setResetUser('');
              setResetPass('');
              setMasterKey('');
              setError('');
              alert('Senha atualizada com sucesso!');
          }, 2000);
      } catch (err) {
          setResetStatus('error');
          setError('Usuário não encontrado. Verifique se o nome está correto.');
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 animate-fade-in relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-50 rounded-full z-0 opacity-50"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-200">
             <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Pro 360</h1>
          <p className="text-slate-500 mt-2 flex items-center justify-center gap-2">
            <Database size={14} className="text-emerald-500"/>
            Database Enterprise Local
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Seu ID de acesso"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Sua credencial"
                disabled={isLoading}
              />
            </div>
            
            {/* Validação Visual de Senha (Apenas no Registro) */}
            {isRegistering && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Requisitos da senha:</p>
                    <div className="grid grid-cols-1 gap-1">
                        <ValidationItem valid={validations.minLength} label="Mínimo 8 caracteres" />
                        <ValidationItem valid={validations.hasUpperCase} label="Letra maiúscula (A-Z)" />
                        <ValidationItem valid={validations.hasNumber} label="Número (0-9)" />
                        <ValidationItem valid={validations.hasSpecialChar} label="Caractere especial (!@#...)" />
                    </div>
                </div>
            )}
          </div>

          {/* Checkbox Remember Me & Forgot Password */}
          <div className="flex items-center justify-between ml-1">
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-600 cursor-pointer select-none">
                    Lembrar
                </label>
            </div>
            <button 
                type="button"
                onClick={handleOpenReset}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
                Esqueci minha senha
            </button>
          </div>

          {error && !isResetting && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium text-center border border-rose-100 animate-fade-in">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <>
                    {isRegistering ? 'Criar Conta Segura' : 'Acessar Sistema'}
                    <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
            disabled={isLoading}
          >
            {isRegistering ? 'Já possui cadastro? Faça Login' : 'Novo usuário? Clique aqui'}
          </button>
        </div>

        {/* Reset Password Modal */}
        {isResetting && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Recuperação de Conta</h3>
                    <button 
                        onClick={() => { setIsResetting(false); setError(''); setResetStatus('idle'); }}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <XIcon size={20} />
                    </button>
                </div>
                
                <p className="text-sm text-slate-500 mb-6">
                    Para redefinir sua senha, insira seu usuário, a nova senha desejada e a <span className="font-bold text-slate-700">Chave de Segurança Mestra</span> fornecida pelo administrador.
                </p>

                <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário</label>
                        <input 
                            type="text" 
                            value={resetUser}
                            onChange={(e) => setResetUser(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                            placeholder="Nome de usuário"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
                        <input 
                            type="password" 
                            value={resetPass}
                            onChange={(e) => setResetPass(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                            placeholder="Nova senha"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                             <KeyRound size={12} /> Chave de Segurança
                        </label>
                        <input 
                            type="password" 
                            value={masterKey}
                            onChange={(e) => setMasterKey(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-slate-50"
                            placeholder="Digite a chave mestra..."
                            required
                        />
                    </div>

                    {resetStatus === 'error' && (
                        <p className="text-xs text-rose-500 font-medium text-center animate-fade-in">{error || 'Erro ao resetar.'}</p>
                    )}
                     {resetStatus === 'success' && (
                        <p className="text-xs text-emerald-500 font-medium text-center animate-fade-in">Senha alterada com sucesso! Redirecionando...</p>
                    )}

                    <button 
                        type="submit" 
                        className="w-full bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                        Redefinir Senha
                    </button>
                </form>
                <div className="mt-auto text-center">
                    <p className="text-[10px] text-slate-400">Chave Padrão: finance360</p>
                </div>
            </div>
        )}
      </div>
      
      <div className="fixed bottom-4 text-xs text-slate-400 flex flex-col items-center">
        <span>© 2030 Finance Pro 360 Inc.</span>
        <span className="text-[10px] opacity-70">Powered by IndexedDB Technology</span>
      </div>
    </div>
  );
};

// Componente auxiliar para item de validação
const ValidationItem = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${valid ? 'text-emerald-600' : 'text-slate-400'}`}>
        {valid ? <Check size={12} strokeWidth={3} /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
        <span className={valid ? 'font-medium' : ''}>{label}</span>
    </div>
);
