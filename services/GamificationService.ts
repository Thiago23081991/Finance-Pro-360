
import { Transaction, Goal, AppConfig } from '../types';

export type BadgeId = 'first_step' | 'saver' | 'investor' | 'streak_7' | 'streak_30' | 'big_spender';

export interface Badge {
    id: BadgeId;
    name: string;
    description: string;
    icon: string; // Emoji char
    xpReward: number;
}

export const LEVELS = [
    { name: 'Bronze', minXP: 0, color: '#cd7f32' },
    { name: 'Prata', minXP: 1000, color: '#c0c0c0' },
    { name: 'Ouro', minXP: 5000, color: '#ffd700' },
    { name: 'Platina', minXP: 10000, color: '#e5e4e2' }
];

export const BADGES: Record<BadgeId, Badge> = {
    first_step: {
        id: 'first_step',
        name: 'Primeiro Passo',
        description: 'Registrou a primeira despesa.',
        icon: '🦶',
        xpReward: 100
    },
    saver: {
        id: 'saver',
        name: 'Poupador Iniciante',
        description: 'Criou sua primeira meta financeira.',
        icon: '🐷',
        xpReward: 200
    },
    investor: {
        id: 'investor',
        name: 'Futuro Rico',
        description: 'Registrou um investimento.',
        icon: '🚀',
        xpReward: 300
    },
    streak_7: {
        id: 'streak_7',
        name: 'Semana Perfeita',
        description: 'Usou o app por 7 dias seguidos.',
        icon: '🔥',
        xpReward: 500
    },
    streak_30: {
        id: 'streak_30',
        name: 'Hábito de Ferro',
        description: 'Usou o app por 30 dias seguidos.',
        icon: '💎',
        xpReward: 1000
    },
    big_spender: {
        id: 'big_spender',
        name: 'Patrão',
        description: 'Registrou uma despesa única acima de R$ 1.000.',
        icon: '💸',
        xpReward: 150
    }
};

export const GamificationService = {
    calculateLevel(xp: number) {
        // Find the highest level where xp >= minXP
        return LEVELS.slice().reverse().find(l => xp >= l.minXP) || LEVELS[0];
    },

    getNextLevel(currentLevelName: string) {
        const idx = LEVELS.findIndex(l => l.name === currentLevelName);
        if (idx === -1 || idx === LEVELS.length - 1) return null;
        return LEVELS[idx + 1];
    },

    checkAchievements(
        currentBadges: string[],
        stats: {
            transactions: Transaction[];
            goals: Goal[];
            streak: number;
        }
    ): Badge[] {
        const newBadges: Badge[] = [];

        // Check First Step
        if (!currentBadges.includes('first_step') && stats.transactions.length > 0) {
            newBadges.push(BADGES.first_step);
        }

        // Check Big Spender
        if (!currentBadges.includes('big_spender') && stats.transactions.some(t => t.amount >= 1000 && t.type === 'expense')) {
            newBadges.push(BADGES.big_spender);
        }

        // Check Saver
        if (!currentBadges.includes('saver') && stats.goals.length > 0) {
            newBadges.push(BADGES.saver);
        }

        // Check Streak 7
        if (!currentBadges.includes('streak_7') && stats.streak >= 7) {
            newBadges.push(BADGES.streak_7);
        }

        // Check Streak 30
        if (!currentBadges.includes('streak_30') && stats.streak >= 30) {
            newBadges.push(BADGES.streak_30);
        }

        return newBadges;
    }
};
