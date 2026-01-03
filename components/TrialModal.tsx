import React, { useState, useEffect } from 'react';
import { X, Clock, PartyPopper, CheckCircle } from 'lucide-react';
import { Logo } from './Logo';

interface TrialModalProps {
    isOpen: boolean;
    daysRemaining: number;
    onClose: () => void;
}

export const TrialModal: React.FC<TrialModalProps> = ({ isOpen, daysRemaining, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay for animation
            setTimeout(() => setVisible(true), 100);
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen && !visible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative transform transition-all duration-500 ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>

                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-gold to-brand-blue"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <div className="mb-6 inline-block">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/20 mx-auto">
                                <Clock size={32} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                <CheckCircle size={14} />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Bem-vindo a Bordo!</h2>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Seu período de teste está ativo</p>
                        <div className="flex items-end justify-center gap-2">
                            <span className="text-3xl font-black text-brand-blue dark:text-brand-gold leading-none">{daysRemaining}</span>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">dias restantes</span>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                        Aproveite para explorar todas as funcionalidades do Finance Pro 360 e organizar sua vida financeira.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full bg-brand-blue hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-blue/10 transition-all active:scale-95"
                    >
                        COMEÇAR AGORA
                    </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 text-center border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400">Oferta válida para novos cadastros</p>
                </div>
            </div>
        </div>
    );
};
