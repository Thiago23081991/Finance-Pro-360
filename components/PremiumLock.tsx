import React from 'react';
import { Lock, Zap, Check, PlayCircle } from 'lucide-react';
import { PLANS_CONFIG } from '../constants';

interface PremiumLockProps {
    config?: any;
    userEmail?: string;
    userId?: string;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ config, userEmail, userId }) => {

    const handleUpgrade = () => {
        const link = PLANS_CONFIG.premium.checkoutUrl;
        const finalLink = `${link}?email=${userEmail || ''}&custom_id=${userId || ''}`;
        window.open(finalLink, '_blank');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-8 animate-fade-in fade-in-0 duration-700">
            <div className="w-24 h-24 bg-brand-gold/10 rounded-full flex items-center justify-center relative mb-4">
                <Lock size={48} className="text-brand-gold drop-shadow-md" />
                <div className="absolute -top-2 -right-2 bg-brand-blue text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-white/10 shadow-lg">
                    Premium
                </div>
            </div>

            <div className="max-w-md space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                    Conteúdo Exclusivo
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                    A área <span className="text-brand-gold font-bold">Finance Academy</span> é exclusiva para membros Premium. Desbloqueie agora e domine suas finanças.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-8 w-full max-w-sm shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-yellow-500"></div>

                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    O que você vai aprender
                </h3>

                <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-3">
                        <PlayCircle className="shrink-0 text-brand-gold mt-0.5" size={18} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Mentalidade de Riqueza</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <PlayCircle className="shrink-0 text-brand-gold mt-0.5" size={18} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Inteligência Emocional Financeira</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <PlayCircle className="shrink-0 text-brand-gold mt-0.5" size={18} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Como sair das Dívidas</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <PlayCircle className="shrink-0 text-brand-gold mt-0.5" size={18} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Estratégias de Investimento</span>
                    </li>
                </ul>

                <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-brand-blue font-black py-4 rounded-xl shadow-lg shadow-brand-gold/20 mt-8 transform transition-all active:scale-95 group flex items-center justify-center gap-2"
                >
                    <Zap className="fill-brand-blue group-hover:scale-110 transition-transform" size={18} />
                    DESBLOQUEAR TUDO
                </button>
                <p className="text-[10px] text-slate-400 mt-3">Pagamento único e vitalício</p>
            </div>
        </div>
    );
};
