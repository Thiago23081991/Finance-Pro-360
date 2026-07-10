import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
    CreditCard, Target, Flame, Clock, ChevronRight, Zap, Shield,
    PiggyBank, BarChart2, RefreshCw, BellOff, Sparkles, Info,
    DollarSign, ArrowUpRight, Calendar, Siren, Award
} from 'lucide-react';
import { Transaction, Goal, Debt, AppConfig, BudgetLimit } from '../types';
import { formatCurrency } from '../utils';
import { DBService } from '../db';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AlertCategory =
    | 'budget'
    | 'card'
    | 'debt'
    | 'goal'
    | 'spending'
    | 'saving'
    | 'streak'
    | 'insight';

export interface SmartAlert {
    id: string;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    message: string;
    detail?: string;
    actionLabel?: string;
    onAction?: () => void;
    createdAt: Date;
    read: boolean;
    dismissedAt?: Date;
}

interface SmartAlertsHubProps {
    transactions: Transaction[];
    goals: Goal[];
    debts: Debt[];
    config: AppConfig;
    onNavigate: (tab: any) => void;
}

// ─────────────────────────────────────────────
// ALERT ENGINE
// ─────────────────────────────────────────────
const DISMISSED_KEY = 'fp360_dismissed_alerts';
const READ_KEY = 'fp360_read_alerts';

const getDismissed = (): string[] => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); }
    catch { return []; }
};
const getRead = (): string[] => {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); }
    catch { return []; }
};
const dismissAlert = (id: string) => {
    const list = getDismissed();
    if (!list.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]));
};
const markRead = (id: string) => {
    const list = getRead();
    if (!list.includes(id)) localStorage.setItem(READ_KEY, JSON.stringify([...list, id]));
};

function buildAlerts(
    transactions: Transaction[],
    goals: Goal[],
    debts: Debt[],
    config: AppConfig,
    budgetLimits: BudgetLimit[],
    onNavigate: (tab: any) => void
): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const dismissed = getDismissed();
    const readIds = getRead();

    const push = (a: Omit<SmartAlert, 'createdAt' | 'read'>) => {
        if (dismissed.includes(a.id)) return;
        alerts.push({ ...a, createdAt: new Date(), read: readIds.includes(a.id) });
    };

    // Helper: filter to current month
    const monthTxs = transactions.filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const expenses = monthTxs.filter(t => t.type === 'expense');
    const incomes = monthTxs.filter(t => t.type === 'income');

    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const currency = config.currency || 'BRL';

    // ── 1. ORÇAMENTO POR CATEGORIA ─────────────────────────────
    budgetLimits.forEach(limit => {
        const spent = expenses
            .filter(t => t.category === limit.category)
            .reduce((s, t) => s + t.amount, 0);
        const pct = limit.amount > 0 ? (spent / limit.amount) * 100 : 0;
        const threshold = limit.alertThreshold || 80;

        if (pct >= 100) {
            push({
                id: `budget-exceeded-${limit.category}-${thisMonth}-${thisYear}`,
                severity: 'critical',
                category: 'budget',
                title: `Limite estourado — ${limit.category}`,
                message: `Você gastou ${formatCurrency(spent, currency)} de ${formatCurrency(limit.amount, currency)} no orçamento de ${limit.category}.`,
                detail: `${Math.round(pct)}% do limite mensal utilizado.`,
                actionLabel: 'Ver Orçamento',
                onAction: () => onNavigate('orcamento'),
            });
        } else if (pct >= threshold) {
            push({
                id: `budget-warning-${limit.category}-${thisMonth}-${thisYear}`,
                severity: 'warning',
                category: 'budget',
                title: `Atenção — ${limit.category}`,
                message: `Você usou ${Math.round(pct)}% do orçamento de ${limit.category}. Restam ${formatCurrency(limit.amount - spent, currency)}.`,
                actionLabel: 'Ver Orçamento',
                onAction: () => onNavigate('orcamento'),
            });
        }
    });

    // ── 2. GASTO ACIMA DA MÉDIA HISTÓRICA POR CATEGORIA ────────
    const categoryMap: Record<string, number[]> = {};
    const last3Months = [0, 1, 2].map(offset => {
        const d = new Date(thisYear, thisMonth - offset - 1, 1);
        return { month: d.getMonth(), year: d.getFullYear() };
    });

    last3Months.forEach(({ month, year }) => {
        transactions
            .filter(t => {
                const d = new Date(t.date + 'T12:00:00');
                return t.type === 'expense' && d.getMonth() === month && d.getFullYear() === year;
            })
            .forEach(t => {
                if (!categoryMap[t.category]) categoryMap[t.category] = [];
                categoryMap[t.category].push(t.amount);
            });
    });

    // Sum this month's spending by category
    const thisMonthByCategory: Record<string, number> = {};
    expenses.forEach(t => {
        thisMonthByCategory[t.category] = (thisMonthByCategory[t.category] || 0) + t.amount;
    });

    Object.entries(thisMonthByCategory).forEach(([cat, spent]) => {
        const hist = categoryMap[cat];
        if (!hist || hist.length < 2) return;
        const histSum: number[] = [];
        last3Months.forEach(({ month, year }) => {
            const s = transactions
                .filter(t => {
                    const d = new Date(t.date + 'T12:00:00');
                    return t.type === 'expense' && t.category === cat && d.getMonth() === month && d.getFullYear() === year;
                })
                .reduce((sum, t) => sum + t.amount, 0);
            if (s > 0) histSum.push(s);
        });
        if (histSum.length === 0) return;
        const avg = histSum.reduce((a, b) => a + b, 0) / histSum.length;
        const overshoot = (spent / avg - 1) * 100;

        if (overshoot >= 40 && avg > 100) {
            push({
                id: `spending-spike-${cat}-${thisMonth}-${thisYear}`,
                severity: 'warning',
                category: 'spending',
                title: `Gasto alto em ${cat}`,
                message: `Você gastou ${formatCurrency(spent, currency)} em ${cat} este mês — ${Math.round(overshoot)}% acima da sua média histórica de ${formatCurrency(avg, currency)}.`,
                detail: `Média dos últimos 3 meses: ${formatCurrency(avg, currency)}`,
                actionLabel: 'Ver Despesas',
                onAction: () => onNavigate('despesas'),
            });
        }
    });

    // ── 3. VENCIMENTO DE CARTÕES ───────────────────────────────
    (config.creditCards || []).forEach(card => {
        const dueDay = card.dueDay;
        let nextDue = new Date(thisYear, thisMonth, dueDay);
        if (today > nextDue) nextDue = new Date(thisYear, thisMonth + 1, dueDay);
        const diffDays = Math.ceil((nextDue.getTime() - today.getTime()) / 86400000);

        if (diffDays >= 0 && diffDays <= 5) {
            const severity: AlertSeverity = diffDays === 0 ? 'critical' : diffDays <= 2 ? 'warning' : 'info';
            push({
                id: `card-due-${card.id}-${thisMonth}-${thisYear}`,
                severity,
                category: 'card',
                title: diffDays === 0 ? `Fatura vence HOJE — ${card.name}` : `Fatura vence em ${diffDays} dia${diffDays > 1 ? 's' : ''} — ${card.name}`,
                message: `O cartão ${card.name} tem fatura com vencimento ${diffDays === 0 ? 'hoje' : `em ${diffDays} dias`}. Evite juros pagando em dia.`,
                actionLabel: 'Ver Cartões',
                onAction: () => onNavigate('despesas'),
            });
        }
    });

    // ── 4. DÍVIDAS VENCENDO ────────────────────────────────────
    debts.forEach(debt => {
        if (!debt.dueDate) return;
        const due = new Date(debt.dueDate + 'T12:00:00');
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

        if (diffDays >= -1 && diffDays <= 5) {
            const severity: AlertSeverity = diffDays <= 0 ? 'critical' : diffDays <= 2 ? 'warning' : 'info';
            push({
                id: `debt-due-${debt.id}`,
                severity,
                category: 'debt',
                title: diffDays < 0 ? `Dívida vencida — ${debt.name}` : diffDays === 0 ? `Dívida vence hoje — ${debt.name}` : `Dívida vencendo — ${debt.name}`,
                message: `${debt.name}: ${formatCurrency(debt.totalAmount, currency)} ${diffDays < 0 ? `venceu há ${Math.abs(diffDays)} dias` : diffDays === 0 ? 'vence hoje' : `vence em ${diffDays} dias`}.`,
                actionLabel: 'Ver Dívidas',
                onAction: () => onNavigate('dividas'),
            });
        }
    });

    // ── 5. METAS ──────────────────────────────────────────────
    goals.forEach(goal => {
        if (goal.status !== 'Em andamento') return;

        // Meta concluída
        if (goal.currentValue >= goal.targetValue) {
            push({
                id: `goal-done-${goal.id}`,
                severity: 'success',
                category: 'goal',
                title: `Meta concluída! 🎉`,
                message: `Parabéns! Você alcançou a meta "${goal.name}" de ${formatCurrency(goal.targetValue, currency)}.`,
                actionLabel: 'Ver Metas',
                onAction: () => onNavigate('metas'),
            });
            return;
        }

        // Meta próxima da conclusão (>= 90%)
        const pct = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
        if (pct >= 90 && pct < 100) {
            push({
                id: `goal-almost-${goal.id}`,
                severity: 'success',
                category: 'goal',
                title: `Quase lá! — ${goal.name}`,
                message: `Você está a ${formatCurrency(goal.targetValue - goal.currentValue, currency)} de concluir a meta "${goal.name}". Continue assim! 💪`,
                actionLabel: 'Aportar',
                onAction: () => onNavigate('metas'),
            });
        }
    });

    // ── 6. BALANÇO NEGATIVO ────────────────────────────────────
    if (totalIncome > 0 && balance < 0) {
        push({
            id: `negative-balance-${thisMonth}-${thisYear}`,
            severity: 'critical',
            category: 'spending',
            title: 'Saldo mensal negativo',
            message: `Suas despesas (${formatCurrency(totalExpense, currency)}) superam a renda (${formatCurrency(totalIncome, currency)}) em ${formatCurrency(Math.abs(balance), currency)} este mês.`,
            detail: 'Identifique cortes possíveis no orçamento.',
            actionLabel: 'Ver Dashboard',
            onAction: () => onNavigate('controle'),
        });
    }

    // ── 7. TAXA DE POUPANÇA BAIXA ──────────────────────────────
    if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
        if (savingsRate > 0 && savingsRate < 10) {
            push({
                id: `low-savings-${thisMonth}-${thisYear}`,
                severity: 'warning',
                category: 'saving',
                title: 'Taxa de poupança muito baixa',
                message: `Você está poupando apenas ${savingsRate.toFixed(1)}% da renda. O ideal é pelo menos 20% para uma saúde financeira sólida.`,
                detail: 'Considere reduzir gastos ou aumentar a renda.',
                actionLabel: 'Ver Orçamento',
                onAction: () => onNavigate('orcamento'),
            });
        }
    }

    // ── 8. INSIGHT POSITIVO — sem gastos no dia ────────────────
    const todayStr = today.toISOString().split('T')[0];
    const spentToday = expenses.filter(t => t.date === todayStr).reduce((s, t) => s + t.amount, 0);
    if (spentToday === 0 && today.getHours() >= 18) {
        push({
            id: `zero-spend-day-${todayStr}`,
            severity: 'success',
            category: 'insight',
            title: 'Dia sem gastos! 🏆',
            message: 'Você não registrou nenhuma despesa hoje. Cada dia assim é um passo mais perto das suas metas!',
        });
    }

    // ── 9. CONCENTRAÇÃO DE GASTOS ─────────────────────────────
    if (totalExpense > 0) {
        const topCat = Object.entries(thisMonthByCategory)
            .sort((a, b) => b[1] - a[1])[0];
        if (topCat) {
            const [cat, spent] = topCat;
            const pct = (spent / totalExpense) * 100;
            if (pct > 50 && totalExpense > 500) {
                push({
                    id: `concentration-${cat}-${thisMonth}-${thisYear}`,
                    severity: 'info',
                    category: 'insight',
                    title: `Alta concentração em ${cat}`,
                    message: `${Math.round(pct)}% das suas despesas este mês (${formatCurrency(spent, currency)}) estão concentradas em "${cat}".`,
                    detail: 'Diversificar pode indicar um orçamento mais equilibrado.',
                    actionLabel: 'Ver Despesas',
                    onAction: () => onNavigate('despesas'),
                });
            }
        }
    }

    // Sort: critical first, then warning, then info/success, then by date
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    return alerts;
}

// ─────────────────────────────────────────────
// STYLE MAPS
// ─────────────────────────────────────────────
const SEVERITY_STYLES: Record<AlertSeverity, {
    icon: React.ReactNode;
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    badge: string;
}> = {
    critical: {
        icon: <Siren size={15} />,
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-800/60',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        iconColor: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-500 text-white',
    },
    warning: {
        icon: <AlertTriangle size={15} />,
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800/50',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500 text-white',
    },
    info: {
        icon: <Info size={15} />,
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800/50',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-500 text-white',
    },
    success: {
        icon: <CheckCircle2 size={15} />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500 text-white',
    },
};

const CATEGORY_ICONS: Record<AlertCategory, React.ReactNode> = {
    budget: <BarChart2 size={13} />,
    card: <CreditCard size={13} />,
    debt: <DollarSign size={13} />,
    goal: <Target size={13} />,
    spending: <TrendingDown size={13} />,
    saving: <PiggyBank size={13} />,
    streak: <Flame size={13} />,
    insight: <Sparkles size={13} />,
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
    budget: 'Orçamento',
    card: 'Cartão',
    debt: 'Dívida',
    goal: 'Meta',
    spending: 'Gastos',
    saving: 'Poupança',
    streak: 'Sequência',
    insight: 'Insight',
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export const SmartAlertsHub: React.FC<SmartAlertsHubProps> = ({
    transactions, goals, debts, config, onNavigate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [activeFilter, setActiveFilter] = useState<AlertSeverity | AlertCategory | 'all'>('all');
    const [dismissVersion, setDismissVersion] = useState(0); // trigger re-compute on dismiss

    // Load budget limits once
    useEffect(() => {
        if (!config.userId) return;
        DBService.getBudgetLimits(config.userId)
            .then(setBudgetLimits)
            .catch(console.error);
    }, [config.userId]);

    // Recompute alerts when data changes
    useEffect(() => {
        const built = buildAlerts(transactions, goals, debts, config, budgetLimits, onNavigate);
        setAlerts(built);
    }, [transactions, goals, debts, config, budgetLimits, dismissVersion]);

    const unreadCount = useMemo(() => alerts.filter(a => !a.read).length, [alerts]);

    const filteredAlerts = useMemo(() => {
        if (activeFilter === 'all') return alerts;
        return alerts.filter(a => a.severity === activeFilter || a.category === activeFilter);
    }, [alerts, activeFilter]);

    const handleOpen = () => {
        setIsOpen(true);
        // Mark all visible as read
        alerts.forEach(a => {
            if (!a.read) markRead(a.id);
        });
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    };

    const handleDismiss = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        dismissAlert(id);
        setDismissVersion(v => v + 1);
    }, []);

    const handleDismissAll = () => {
        alerts.forEach(a => dismissAlert(a.id));
        setDismissVersion(v => v + 1);
    };

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;

    // Category filter chips
    const presentCategories = useMemo(() =>
        [...new Set(alerts.map(a => a.category))],
        [alerts]
    );

    return (
        <>
            {/* Bell Button */}
            <button
                id="smart-alerts-bell-btn"
                onClick={handleOpen}
                className="p-2 relative hover:bg-white/10 rounded-full transition-colors"
                aria-label="Central de Alertas"
            >
                <Bell size={22} className={criticalCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full border-2 border-brand-blue ${criticalCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-900'}`}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Full-screen Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[70] flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel — slides up from bottom */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 max-h-[92dvh] bg-white dark:bg-slate-950 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        >
                            {/* Drag Handle */}
                            <div className="flex justify-center pt-3 pb-1 shrink-0">
                                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="px-5 pb-3 pt-2 flex items-start justify-between shrink-0 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-brand-blue/10 rounded-lg">
                                            <Zap size={16} className="text-brand-blue" />
                                        </div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                            Alertas Inteligentes
                                        </h2>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-8">
                                        {alerts.length === 0
                                            ? 'Tudo em ordem por aqui ✅'
                                            : `${alerts.length} alerta${alerts.length > 1 ? 's' : ''} detectado${alerts.length > 1 ? 's' : ''}`
                                        }
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {alerts.length > 0 && (
                                        <button
                                            onClick={handleDismissAll}
                                            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                                        >
                                            <BellOff size={13} /> Limpar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Summary Chips */}
                            {alerts.length > 0 && (
                                <div className="px-4 py-2.5 flex gap-2 overflow-x-auto hide-scrollbar shrink-0 border-b border-slate-100 dark:border-slate-800">
                                    {/* "All" chip */}
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${activeFilter === 'all'
                                            ? 'bg-brand-blue text-white border-brand-blue'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        Todos
                                        <span className="bg-white/20 text-current rounded-full px-1.5 py-0.5 text-[10px]">{alerts.length}</span>
                                    </button>

                                    {/* Critical chip */}
                                    {criticalCount > 0 && (
                                        <button
                                            onClick={() => setActiveFilter('critical')}
                                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${activeFilter === 'critical'
                                                ? 'bg-rose-500 text-white border-rose-500'
                                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                                                }`}
                                        >
                                            <Siren size={11} /> Urgente
                                            <span className="bg-white/20 text-current rounded-full px-1.5 py-0.5 text-[10px]">{criticalCount}</span>
                                        </button>
                                    )}

                                    {/* Category chips */}
                                    {presentCategories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveFilter(cat)}
                                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${activeFilter === cat
                                                ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-700 dark:border-slate-200'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                }`}
                                        >
                                            {CATEGORY_ICONS[cat]}
                                            {CATEGORY_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Alerts List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {filteredAlerts.length === 0 ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center py-16 text-center"
                                        >
                                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-4">
                                                <Shield size={36} className="text-emerald-500" />
                                            </div>
                                            <h3 className="font-black text-lg text-slate-800 dark:text-white mb-1">
                                                Tudo sob controle!
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                                                {activeFilter !== 'all'
                                                    ? 'Nenhum alerta nessa categoria. Mude o filtro para ver outros.'
                                                    : 'Não há alertas no momento. Suas finanças estão em boa forma!'}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        filteredAlerts.map((alert, index) => {
                                            const styles = SEVERITY_STYLES[alert.severity];
                                            return (
                                                <motion.div
                                                    key={alert.id}
                                                    layout
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                                                    transition={{ delay: index * 0.04 }}
                                                    className={`relative rounded-2xl border p-4 ${styles.bg} ${styles.border}`}
                                                >
                                                    {/* Unread dot */}
                                                    {!alert.read && (
                                                        <span className="absolute top-3 right-10 w-2 h-2 bg-brand-blue rounded-full" />
                                                    )}

                                                    {/* Dismiss button */}
                                                    <button
                                                        id={`dismiss-alert-${alert.id}`}
                                                        onClick={(e) => handleDismiss(alert.id, e)}
                                                        className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                                                    >
                                                        <X size={13} />
                                                    </button>

                                                    <div className="flex items-start gap-3 pr-6">
                                                        {/* Icon */}
                                                        <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center ${styles.iconBg} ${styles.iconColor}`}>
                                                            {styles.icon}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            {/* Category + severity badge */}
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${styles.badge}`}>
                                                                    {styles.icon}
                                                                    {alert.severity === 'critical' ? 'URGENTE' :
                                                                        alert.severity === 'warning' ? 'ATENÇÃO' :
                                                                            alert.severity === 'success' ? 'POSITIVO' : 'INFO'}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                                                    {CATEGORY_ICONS[alert.category]}
                                                                    {CATEGORY_LABELS[alert.category]}
                                                                </span>
                                                            </div>

                                                            {/* Title */}
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug mb-1">
                                                                {alert.title}
                                                            </h4>

                                                            {/* Message */}
                                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                                {alert.message}
                                                            </p>

                                                            {/* Detail */}
                                                            {alert.detail && (
                                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">
                                                                    {alert.detail}
                                                                </p>
                                                            )}

                                                            {/* Action */}
                                                            {alert.actionLabel && alert.onAction && (
                                                                <button
                                                                    id={`alert-action-${alert.id}`}
                                                                    onClick={() => { alert.onAction?.(); setIsOpen(false); }}
                                                                    className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide transition-colors ${styles.iconColor} hover:underline`}
                                                                >
                                                                    {alert.actionLabel}
                                                                    <ChevronRight size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>

                                {/* Footer padding */}
                                <div className="h-4" />
                            </div>

                            {/* Bottom safe area */}
                            <div className="pb-safe shrink-0" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
