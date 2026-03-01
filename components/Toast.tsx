
import React, { useEffect, useState } from 'react';
import { X, Bell, ChevronRight } from 'lucide-react';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, actionLabel, onAction, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation in
    const t1 = setTimeout(() => setIsVisible(true), 50);
    // Auto dismiss after 8 seconds
    const t2 = setTimeout(() => {
        handleClose();
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleClose = () => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for animation to finish
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg shadow-md flex items-start gap-4 max-w-sm ring-1 ring-black/5 dark:ring-white/10 transition-colors">
        <div className="bg-blue-100 dark:bg-blue-600 p-2 rounded-full shrink-0 mt-1 shadow-sm">
            <Bell size={16} className="text-blue-600 dark:text-white" />
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-bold mb-1 text-slate-800 dark:text-white">Lembrete Financeiro</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{message}</p>
            {actionLabel && (
                <button 
                    onClick={onAction}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors uppercase tracking-wide"
                >
                    {actionLabel} <ChevronRight size={12} />
                </button>
            )}
        </div>
        <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
            <X size={16} />
        </button>
      </div>
    </div>
  );
};
