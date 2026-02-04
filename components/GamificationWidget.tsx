
import React from 'react';
import { Trophy, Flame, Star, Lock } from 'lucide-react';
import { GamificationService, LEVELS } from '../services/GamificationService';

interface GamificationWidgetProps {
    xp: number;
    streak: number;
    levelName: string;
    onClick?: () => void;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ xp, streak, levelName, onClick }) => {
    const currentLevel = LEVELS.find(l => l.name === levelName) || LEVELS[0];
    const nextLevel = GamificationService.getNextLevel(levelName);

    // Calculate Progress
    // If max level, progress is 100%
    // Progress = (Current XP - CurrentLevel Min) / (NextLevel Min - CurrentLevel Min)
    let progress = 100;
    let nextLevelXP = xp;

    if (nextLevel) {
        const range = nextLevel.minXP - currentLevel.minXP;
        const current = xp - currentLevel.minXP;
        progress = Math.min(100, Math.max(0, (current / range) * 100));
        nextLevelXP = nextLevel.minXP;
    }

    return (
        <div onClick={onClick} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Trophy size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Seu Nível</div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            {levelName}
                            {levelName === 'Ouro' && <span className="text-yellow-400">👑</span>}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800">
                            <Flame size={14} className="fill-current" /> {streak} dias seguidos
                        </div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>{xp} XP</span>
                        <span>{nextLevel ? `${nextLevelXP} XP` : 'MAX'}</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-medium mt-1">
                        {nextLevel ? `Faltam ${nextLevelXP - xp} XP para o nível ${nextLevel.name}` : 'Você atingiu o nível máximo!'}
                    </p>
                </div>
            </div>
        </div>
    );
};
