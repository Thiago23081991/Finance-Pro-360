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
      <div className="bg-slate-800 border border-slate-700 text-white p-4 rounded-lg shadow-2xl flex items-start gap-4 max-w-sm ring-1 ring-white/10">
        <div className="bg-blue-600 p-2 rounded-full shrink-0 mt-1 shadow-lg shadow-blue-900/50">
            <Bell size={16} className="text-white" />
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1 text-blue-100">Lembrete Financeiro</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">{message}</p>
            {actionLabel && (
                <button 
                    onClick={onAction}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors uppercase tracking-wide"
                >
                    {actionLabel} <ChevronRight size={12} />
                </button>
            )}
        </div>
        <button 
            onClick={handleClose} 
            className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"
        >
            <X size={16} />
        </button>
      </div>
    </div>
  );
};