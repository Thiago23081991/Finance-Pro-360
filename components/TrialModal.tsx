import React, { useEffect, useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';

interface TrialModalProps {
    daysRemaining: number;
    onClose: () => void;
}

export const TrialModal: React.FC<TrialModalProps> = ({ daysRemaining, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to finish
    };

    if (!isVisible && daysRemaining === 0) return null; // Or logic/state specific check if needed

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
            <div
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-md max-w-sm w-full p-6 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mb-2">
                        <Clock size={32} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            Período de Testes
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Você tem <strong className="text-amber-500 font-bold">{daysRemaining} dias</strong> restantes no seu período gratuito.
                            Aproveite para testar todas as funcionalidades Premium!
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                    >
                        Continuar Usando
                    </button>

                    <p className="text-[10px] text-slate-400">
                        Nenhuma cobrança será feita durante o período de testes.
                    </p>
                </div>
            </div>
        </div>
    );
};
