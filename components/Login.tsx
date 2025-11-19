
import React, { useState } from 'react';
import { Lock, User, ArrowRight, Wallet } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    const storedUsers = localStorage.getItem('fp360_users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};

    if (isRegistering) {
      if (users[username]) {
        setError('Usuário já existe.');
        return;
      }
      // Register new user (Simple storage simulation)
      users[username] = password;
      localStorage.setItem('fp360_users', JSON.stringify(users));
      onLogin(username);
    } else {
      if (users[username] && users[username] === password) {
        onLogin(username);
      } else {
        setError('Usuário ou senha incorretos.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-200">
             <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Pro 360</h1>
          <p className="text-slate-500 mt-2">Gestão financeira inteligente.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Seu nome de usuário"
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
                placeholder="Sua senha segura"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium text-center border border-rose-100">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            {isRegistering ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-xs text-slate-400">
        © 2030 Finance Pro 360 Inc.
      </div>
    </div>
  );
};
