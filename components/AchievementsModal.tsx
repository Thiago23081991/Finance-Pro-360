
import React from 'react';
import { BADGES, BadgeId } from '../services/GamificationService';
import { X, Trophy, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    unlockedBadges: string[];
    xp: number;
    levelName: string;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, unlockedBadges, xp, levelName }) => {
    if (!isOpen) return null;

    const allBadges = Object.values(BADGES);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 text-white relative">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Trophy size={24} className="text-yellow-300" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Suas Conquistas</h2>
                        </div>
                        <p className="opacity-90 font-medium">Você é nível {levelName} com {xp} XP total.</p>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {allBadges.map((badge) => {
                                const isUnlocked = unlockedBadges.includes(badge.id);
                                return (
                                    <div
                                        key={badge.id}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${isUnlocked
                                                ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/50 shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale-[0.8]'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`text-3xl ${!isUnlocked && 'opacity-50'}`}>
                                                {badge.icon}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                                    {badge.name}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                    {badge.description}
                                                </p>
                                                {isUnlocked && (
                                                    <div className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2 py-0.5 rounded-full">
                                                        +{badge.xpReward} XP
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!isUnlocked && (
                                            <div className="absolute top-3 right-3 text-slate-400">
                                                <Lock size={14} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
