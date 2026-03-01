
import React, { useState } from 'react';
import { DBService } from '../db';
import { Lock, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ResetPasswordModalProps {
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }

    if (newPassword !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }

    setLoading(true);
    try {
        // Usamos o username do usuário logado (que acabou de entrar pelo link)
        // O metodo resetUserPassword faz update da senha do usuário logado
        await DBService.resetUserPassword('', newPassword); 
        setSuccess(true);
        setTimeout(() => {
            onClose();
        }, 3000);
    } catch (e: any) {
        setError(e.message || "Erro ao atualizar senha.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
       
       <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-xl shadow-md relative animate-fade-in border border-slate-200 dark:border-slate-700">
           <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400">
                    <Lock size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Redefinir Senha</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Digite sua nova senha abaixo.</p>
           </div>

           {success ? (
               <div className="text-center py-6">
                   <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 animate-bounce">
                       <Check size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Senha Atualizada!</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Você já pode usar sua nova senha.</p>
               </div>
           ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nova Senha</label>
                       <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Mínimo 6 caracteres"
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirmar Senha</label>
                       <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Repita a senha"
                       />
                   </div>

                   {error && (
                       <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm p-3 rounded flex items-center gap-2">
                           <AlertCircle size={16} />
                           {error}
                       </div>
                   )}

                   <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                   >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Nova Senha'}
                   </button>
               </form>
           )}
       </div>
    </div>
  );
};
