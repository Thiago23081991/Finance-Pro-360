import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        // Android / Desktop (Chrome)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a delay to not be annoying
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS: Logic to show prompt (e.g., if visited 2+ times, logic omitted for simplicity, showing always for demo)
        if (ios) {
            setTimeout(() => setShowPrompt(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-8 md:w-96"
                >
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Download size={18} className="text-violet-600" />
                                    Instalar App
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Adicione à sua tela inicial para acesso rápido e offline.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>

                        {isIOS ? (
                            <div className="text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                                <p className="flex items-center gap-1 mb-1 font-bold">
                                    Para instalar no iPhone:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                    <li>Toque no botão <Share size={10} className="inline mx-1" /> (Compartilhar)</li>
                                    <li>Selecione "Adicionar à Tela de Início"</li>
                                </ol>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 active:scale-95 transition-all"
                            >
                                Instalar Agora
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
