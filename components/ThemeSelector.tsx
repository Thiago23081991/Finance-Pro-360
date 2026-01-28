import React, { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'default' | 'nubank' | 'cyberpunk' | 'minimalist';

const THEMES: { id: Theme; name: string; color: string }[] = [
    { id: 'default', name: 'Finance Blue', color: '#2563eb' },
    { id: 'nubank', name: 'Roxo Nu', color: '#820ad1' },
    { id: 'cyberpunk', name: 'Cyber Neon', color: '#00ff9d' },
    { id: 'minimalist', name: 'Minimalista', color: '#18181b' },
];

export const ThemeSelector: React.FC = () => {
    const [currentTheme, setCurrentTheme] = useState<Theme>('default');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('fp360_theme') as Theme;
        if (savedTheme) {
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement;
        // Remove previous theme attributes
        root.removeAttribute('data-theme');

        // precise mapping for default vs others
        if (theme !== 'default') {
            root.setAttribute('data-theme', theme);
        }

        setCurrentTheme(theme);
        localStorage.setItem('fp360_theme', theme);
    };

    const handleThemeChange = (theme: Theme) => {
        applyTheme(theme);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title="Alterar Tema"
            >
                <Palette size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 origin-top-right"
                    >
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                            Escolha um Tema
                        </div>
                        <div className="space-y-1">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleThemeChange(theme.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentTheme === theme.id
                                            ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                                            style={{ backgroundColor: theme.color }}
                                        ></div>
                                        {theme.name}
                                    </div>
                                    {currentTheme === theme.id && <Check size={14} className="text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
