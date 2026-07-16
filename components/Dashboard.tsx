import React, { useState, useMemo } from 'react';
import { Transaction, Goal, AppConfig, Investment, FilterState, Tab, BankAccount } from '../types';
import { formatCurrency, getBudgetCategoryType } from '../utils';
import { MONTH_NAMES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, History, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, AlertTriangle, Lightbulb, Siren, Target, CheckCircle2, BarChart4, PieChart, LineChart as LineChartIcon, ArrowRightLeft, Lock, Landmark, FileText, Printer, Calculator, X, ChevronRight, CreditCard, Upload, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { DBService } from '../db';
import { MonthlyReportModal } from './MonthlyReportModal';
import { ProspectingModal } from './ProspectingModal';
import { PremiumBanner } from './PremiumBanner';
import { ForecastingService } from '../services/ForecastingService';

import { ForecastItem } from '../types';

interface DashboardProps {
    transactions: Transaction[];
    goals: Goal[];
    filter: FilterState;
    currency?: string;
    isPremium?: boolean;
    config?: AppConfig;
    onNavigate?: (tab: Tab) => void;
    bankAccounts?: BankAccount[];
}

const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('aliment')) return <Utensils size={16} />;
    if (lower.includes('transporte') || lower.includes('carro')) return <Car size={16} />;
    if (lower.includes('moradia') || lower.includes('casa')) return <Home size={16} />;
    if (lower.includes('saúde') || lower.includes('medico')) return <HeartPulse size={16} />;
    if (lower.includes('lazer') || lower.includes('viagem')) return <PartyPopper size={16} />;
    if (lower.includes('educa') || lower.includes('curso')) return <GraduationCap size={16} />;
    if (lower.includes('salário')) return <Banknote size={16} />;
    if (lower.includes('invest')) return <TrendingUp size={16} />;
    if (lower.includes('mercado')) return <ShoppingBag size={16} />;
    if (lower.includes('luz') || lower.includes('agua')) return <Zap size={16} />;
    return <CircleDollarSign size={16} />;
};

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter, currency = 'BRL', isPremium = false, config, onNavigate, bankAccounts = [] }) => {
    const [selectedTrendCategory, setSelectedTrendCategory] = useState<string>('Alimentação');

    const filteredTransactions = useMemo<Transaction[]>(() => {
        return transactions.filter(t => {
            const d = new Date(t.date + 'T12:00:00');
            return d.getMonth() === filter.month && d.getFullYear() === filter.year;
        });
    }, [transactions, filter]);

    const kpiData = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;
        return { income, expense, balance };
    }, [filteredTransactions]);

    const forecastData = useMemo(() => {
        // Calculate current total balance (simplified for MVP: assume 0 start or sum of all past txs)
        const currentBalance = transactions
            .filter(t => new Date(t.date) <= new Date())
            .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

        return ForecastingService.generateForecast(transactions, currentBalance);
    }, [transactions]);

    // --- INVESTIMENTOS ---
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showProspectingModal, setShowProspectingModal] = useState(false);
    const [selectedRuleCategory, setSelectedRuleCategory] = useState<'needs' | 'wants' | 'savings' | null>(null);

    React.useEffect(() => {
        // Assume userId is available from first transaction or passed as prop (ideally prop)
        // For now, simpler: retrieve from local storage if prop is missing or rely on DBService finding current user
        if (transactions.length > 0) {
            DBService.getInvestments(transactions[0].userId).then(setInvestments).catch(console.error);
        } else {
            DBService.getCurrentUser().then(u => {
                if (u) DBService.getInvestments(u.id).then(setInvestments);
            });
        }
    }, [transactions.length]); // Re-fetch only if txs length changes significantly or on mount

    const totalInvested = useMemo(() => {
        return investments.reduce((acc, curr) => acc + (curr.currentValue || curr.amount), 0);
    }, [investments]);

    // --- NOVAS METRICAS: MÊS ANTERIOR (MoM) ---
    const momComparison = useMemo(() => {
        const prevMonthDate = new Date(filter.year, filter.month - 1, 1);
        const prevMonth = prevMonthDate.getMonth();
        const prevYear = prevMonthDate.getFullYear();

        const prevTxs = transactions.filter(t => {
            const d = new Date(t.date + 'T12:00:00');
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });

        const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        const getPctChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            incomePct: getPctChange(kpiData.income, prevIncome),
            expensePct: getPctChange(kpiData.expense, prevExpense),
            prevIncome,
            prevExpense
        };
    }, [transactions, filter, kpiData]);

    // --- NOVAS METRICAS: CUSTO FIXO E RENDA LIVRE ---
    const fixedCostStats = useMemo(() => {
        // Considera recorrentes ativas (aquelas marcadas como isRecurring)
        // Uma abordagem simplificada: soma todas as despesas marcadas como isRecurring
        // Idealmente, filtraria apenas as únicas (agrupadas por descrição), mas vamos somar o que aparecer no mês ou média.
        // Melhor: Pegar todas as transações ÚNICAS marcadas como recurring no DB e somar seus valores mais recentes.

        // Vamos usar a lista filtrada do mês atual para ver o "realizado" de fixo, 
        // ou pegar todas as recorrentes "ativas" baseadas na última ocorrência?
        // Para simplificar e ser consistente com o organizador, vamos pegar a lista de templates (última tx de cada recorrente).

        const uniqueRecurring = new Map<string, number>();
        transactions
            .filter(t => t.type === 'expense' && t.isRecurring)
            .forEach(t => {
                // Usa descrição como chave para identificar "assinatura única"
                // Se já existe, atualiza apenas se a data for mais recente (embora aqui não estamos ordenando, assumimos ordem do DB)
                if (!uniqueRecurring.has(t.description)) {
                    uniqueRecurring.set(t.description, t.amount);
                }
            });

        const totalFixed = Array.from(uniqueRecurring.values()).reduce((acc, val) => acc + val, 0);
        const income = kpiData.income || 1; // Evitar divisão por zero
        const commitedPct = (totalFixed / income) * 100;
        const freeIncome = Math.max(0, kpiData.income - totalFixed);

        return { totalFixed, commitedPct, freeIncome };
    }, [transactions, kpiData.income]);

    // --- NOVAS METRICAS: SCORE DE SAÚDE FINANCEIRA ---
    const financialHealthScore = useMemo(() => {
        let score = 50; // Base start

        // 1. Orçamento (Gastar menos que ganha)
        if (kpiData.income >= kpiData.expense && kpiData.income > 0) score += 20;

        // 2. Capacidade de Poupança (> 15%)
        const savingsRate = kpiData.income > 0 ? (kpiData.income - kpiData.expense) / kpiData.income : 0;
        if (savingsRate > 0.15) score += 10;
        if (savingsRate > 0.30) score += 10; // Bonus master

        // 3. Metas Ativas
        const hasActiveGoal = goals.some(g => g.status === 'Em andamento');
        if (hasActiveGoal) score += 10;

        // 4. Sem Alertas Críticos (dívidas/estouro)
        // Vamos checar se saldo é negativo
        if (kpiData.balance < 0) score -= 20;

        return Math.max(0, Math.min(100, score));
    }, [kpiData, goals]);

    // --- 50/30/20 RULE CALCULATION ---
    const rule503020Stats = useMemo(() => {
        let needs = 0;
        let wants = 0;
        let savings = 0;

        // 1. Classify Expenses
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            const bucket = getBudgetCategoryType(t.category, t.description);
            if (bucket === 'needs') needs += t.amount;
            else if (bucket === 'wants') wants += t.amount;
            else if (bucket === 'savings') savings += t.amount;
        });

        // 2. Add 'Savings' from Investments (if tracked as transactions with category Investment, or explicit Investment type)
        // Usually, investments are Expenses in category 'Investimentos' or separate logic.
        // My helper categorizes 'Investimentos' as 'savings'.

        // Also Consider 'Renda' as the base 100%
        const income = kpiData.income || 1;

        return {
            needs: { val: needs, pct: (needs / income) * 100, target: 50 },
            wants: { val: wants, pct: (wants / income) * 100, target: 30 },
            savings: { val: savings, pct: (savings / income) * 100, target: 20 }
        };
    }, [filteredTransactions, kpiData.income]);

    // --- NOVA META EM DESTAQUE ---
    const featuredGoal = useMemo(() => {
        return goals.find(g => g.status === 'Em andamento') || null;
    }, [goals]);

    const availableCategories = useMemo<string[]>(() => {
        const cats = new Set<string>();
        transactions.forEach(t => { if (t.type === 'expense') cats.add(t.category); });
        return Array.from(cats);
    }, [transactions]);

    // --- LÓGICA DE ALERTAS INTELIGENTES (CATEGORIAS E HISTÓRICO) ---
    const smartAlerts = useMemo<{ type: 'warning' | 'critical'; message: string; detail: string }[]>(() => {
        const alerts: { type: 'warning' | 'critical'; message: string; detail: string }[] = [];

        // 1. Gastos Atuais por Categoria
        const currentExpenses: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            currentExpenses[t.category] = (currentExpenses[t.category] || 0) + t.amount;
        });

        // 2. Cálculo de Médias Históricas (Excluindo o mês atual do filtro para comparação justa)
        const historicalStats: Record<string, { total: number, uniqueMonths: Set<string> }> = {};

        transactions.forEach(t => {
            if (t.type !== 'expense') return;
            const d = new Date(t.date + 'T12:00:00');
            const isCurrentMonth = d.getMonth() === filter.month && d.getFullYear() === filter.year;

            if (!isCurrentMonth) {
                const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                if (!historicalStats[t.category]) {
                    historicalStats[t.category] = { total: 0, uniqueMonths: new Set() };
                }
                historicalStats[t.category].total += t.amount;
                historicalStats[t.category].uniqueMonths.add(monthKey);
            }
        });

        // ALERTA: CONCENTRAÇÃO (> 40% da renda)
        if (kpiData.income > 0) {
            Object.entries(currentExpenses).forEach(([cat, amount]) => {
                const ratio = (amount / kpiData.income) * 100;
                if (ratio > 40) {
                    alerts.push({
                        type: 'critical',
                        message: `Concentração Crítica: ${cat}`,
                        detail: `Esta categoria está consumindo ${ratio.toFixed(1)}% da sua receita mensal. Cuidado!`
                    });
                }
            });
        }

        // ALERTA: DESVIO DA MÉDIA HISTÓRICA E NOVOS GASTOS
        Object.entries(currentExpenses).forEach(([cat, amount]) => {
            const hist = historicalStats[cat];

            if (!hist) {
                // Nova Categoria detectada (sem histórico anterior)
                if (amount > 100) { // Ignora valores irrisórios
                    alerts.push({
                        type: 'warning',
                        message: `Novo Gasto: ${cat}`,
                        detail: `Você iniciou gastos relevantes nesta categoria este mês (${formatCurrency(amount, currency)}).`
                    });
                }
            } else if (hist.uniqueMonths.size > 0) {
                const avg = hist.total / hist.uniqueMonths.size;
                // Ignorar pequenas variações em valores baixos
                if (avg > 50) {
                    const deviation = ((amount - avg) / avg) * 100;

                    if (deviation > 50) {
                        alerts.push({
                            type: 'critical',
                            message: `Salto em ${cat}`,
                            detail: `Gasto ${deviation.toFixed(0)}% acima da sua média habitual (${formatCurrency(avg, currency)}). Atenção redobrada!`
                        });
                    } else if (deviation > 25) {
                        alerts.push({
                            type: 'warning',
                            message: `Aumento em ${cat}`,
                            detail: `Você gastou ${deviation.toFixed(0)}% a mais que a média histórica (${formatCurrency(avg, currency)}).`
                        });
                    }
                }
            }
        });

        // ALERTA: ORÇAMENTO ESTOURADO
        if (kpiData.balance < 0 && kpiData.income > 0) {
            alerts.push({
                type: 'critical',
                message: 'Orçamento Estourado',
                detail: `Suas despesas superaram as receitas em ${formatCurrency(Math.abs(kpiData.balance), currency)}.`
            });
        }

        return alerts;
    }, [filteredTransactions, transactions, kpiData.income, kpiData.balance, filter, currency]);

    // --- LÓGICA DE TENDÊNCIA POR CATEGORIA (12 MESES) ---
    const categoryTrendData = useMemo(() => {
        const data = [];
        let totalAmount = 0;
        let monthCount = 0;

        for (let i = 11; i >= 0; i--) {
            const d = new Date(filter.year, filter.month - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();

            const monthExpenses = transactions
                .filter(t => {
                    const td = new Date(t.date + 'T12:00:00');
                    return t.type === 'expense' &&
                        t.category === selectedTrendCategory &&
                        td.getMonth() === m &&
                        td.getFullYear() === y;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            if (monthExpenses > 0) monthCount++;
            totalAmount += monthExpenses;

            data.push({
                name: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
                valor: monthExpenses,
                fullDate: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            });
        }
        return {
            chartData: data,
            average: monthCount > 0 ? totalAmount / monthCount : 0
        };
    }, [transactions, filter, selectedTrendCategory]);

    // --- LÓGICA DE PROJEÇÃO FUTURA (6 MESES) ---
    const projectionData = useMemo<{ name: string; saldo: number; receita: number; despesa: number }[]>(() => {
        const data: { name: string; saldo: number; receita: number; despesa: number }[] = [];

        // 1. Calculate historical averages (Last 3 months)
        let totalInc = 0;
        let totalExp = 0;
        let count = 0;

        for (let i = 1; i <= 3; i++) {
            const d = new Date(filter.year, filter.month - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();

            const monthInc = transactions.filter(t => t.type === 'income' && new Date(t.date + 'T12:00:00').getMonth() === m && new Date(t.date + 'T12:00:00').getFullYear() === y).reduce((acc, t) => acc + t.amount, 0);
            const monthExp = transactions.filter(t => t.type === 'expense' && new Date(t.date + 'T12:00:00').getMonth() === m && new Date(t.date + 'T12:00:00').getFullYear() === y).reduce((acc, t) => acc + t.amount, 0);

            if (monthInc > 0 || monthExp > 0) {
                totalInc += monthInc;
                totalExp += monthExp;
                count++;
            }
        }

        const avgIncome = count > 0 ? totalInc / count : 0;
        const avgExpense = count > 0 ? totalExp / count : 0;

        const filterDateDetails = new Date(filter.year, filter.month + 1, 0); // Last day of filtered month

        // Calculate Base Balance (All transactions <= filterDateDetails)
        let runningBalance = transactions.reduce((acc, t) => {
            const tDate = new Date(t.date + 'T12:00:00');
            if (tDate <= filterDateDetails) {
                return acc + (t.type === 'income' ? t.amount : -t.amount);
            }
            return acc;
        }, 0);

        // Identify Recurring Templates
        const recurringTemplates = transactions.filter(t => t.isRecurring);

        // Project next 6 months
        for (let i = 1; i <= 6; i++) {
            const targetDate = new Date(filter.year, filter.month + i, 1);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();
            const targetMonthName = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase().replace('.', '');

            // 1. REAL Future Transactions (Installments/Scheduled) for this specific month
            const realMonthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date + 'T12:00:00');
                return tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear;
            });

            let explicitIncome = realMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            let explicitExpense = realMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            // 2. VIRTUAL Recurring Transactions
            recurringTemplates.forEach(template => {
                const tDate = new Date(template.date + 'T12:00:00');
                if (tDate < new Date(targetYear, targetMonth, 1)) {
                    if (template.type === 'income') explicitIncome += template.amount;
                    else explicitExpense += template.amount;
                }
            });

            // 3. SMART PROJECTION: 
            // If explicit data is greater than average, use explicit (Unusual month).
            // If explicit data is lower (e.g. just a small installment), assume average lifestyle fills the gap.
            // Exception: If explicit income is 0, we strictly use average income (assuming salary).

            const projectedIncome = Math.max(explicitIncome, avgIncome);
            const projectedExpense = Math.max(explicitExpense, avgExpense);

            runningBalance += (projectedIncome - projectedExpense);

            data.push({
                name: targetMonthName,
                saldo: runningBalance,
                receita: projectedIncome,
                despesa: projectedExpense
            });
        }

        return data;

    }, [transactions, filter]);

    // --- LÓGICA DE TENDÊNCIA MENSAL GERAL (12 MESES) ---
    const monthlyTrendData = useMemo(() => {
        const data = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(filter.year, filter.month - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();

            const monthExpenses = transactions
                .filter(t => {
                    const td = new Date(t.date + 'T12:00:00');
                    return t.type === 'expense' && td.getMonth() === m && td.getFullYear() === y;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const monthIncome = transactions
                .filter(t => {
                    const td = new Date(t.date + 'T12:00:00');
                    return t.type === 'income' && td.getMonth() === m && td.getFullYear() === y;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            data.push({
                name: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
                Receitas: monthIncome,
                Despesas: monthExpenses,
                fullDate: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            });
        }
        return data;
    }, [transactions, filter]);

    const barData = useMemo(() => {
        const data: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            data[t.category] = (data[t.category] || 0) + t.amount;
        });
        return Object.keys(data)
            .map(key => ({ name: key, value: data[key] }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const timelineData = useMemo(() => {
        const daysInMonth = new Date(filter.year, filter.month + 1, 0).getDate();
        const data = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${i.toString().padStart(2, '0')}/${(filter.month + 1).toString().padStart(2, '0')}`;
            let inc = 0, exp = 0;
            filteredTransactions.forEach(t => {
                const d = new Date(t.date + 'T12:00:00');
                if (d.getDate() === i) {
                    if (t.type === 'income') inc += t.amount;
                    else exp += t.amount;
                }
            });
            data.push({ name: dateStr, Receita: inc, Despesa: exp });
        }
        return data;
    }, [filteredTransactions, filter]);

    const recentTransactions = useMemo<Transaction[]>(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, ease: "easeOut" as const }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" as const } }
    };

    return (
        <motion.div
            className="space-y-0 md:space-y-2 pb-24 md:pb-10 font-outfit"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            {/* Premium Banner (Show only for free users) */}
            {!isPremium && <PremiumBanner />}

            {/* Conta Block (Nubank Style) */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1C1C1E] px-5 pt-6 pb-5 flex flex-col gap-4 rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5 mx-4 mt-4">
                <div className="flex justify-between items-center cursor-pointer">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Conta</h3>
                    <ChevronRight size={20} className="text-slate-400" />
                </div>
                <div>
                    <h2 className="text-[32px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">{formatCurrency(kpiData.balance, currency)}</h2>
                </div>

                {/* Quick Actions Carousel */}
                <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-3 pt-4 -mx-5 px-5 snap-x hide-scrollbar">
                    {[
                        { icon: <TrendingUp size={22} />, label: "Receitas", target: 'receitas' as Tab },
                        { icon: <CreditCard size={22} />, label: "Despesas", target: 'despesas' as Tab },
                        { icon: <BarChart4 size={22} />, label: "Investir", target: 'investimentos' as Tab },
                        { icon: <Scale size={22} />, label: "Dívidas", target: 'dividas' as Tab },
                        { icon: <PieChart size={22} />, label: "Orçamento", target: 'orcamento' as Tab }
                    ].map((btn, i) => (
                        <div key={i} onClick={() => onNavigate && onNavigate(btn.target)} className="flex flex-col items-center gap-2 min-w-[76px] snap-start cursor-pointer group">
                            <div className="w-[72px] h-[72px] rounded-full bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-800 dark:text-slate-100 group-hover:bg-slate-200 dark:group-hover:bg-[#333336] transition-colors">
                                {btn.icon}
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{btn.label}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── Minhas Contas Block ────────────────────────────────────── */}
            {bankAccounts.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white dark:bg-[#1C1C1E] px-5 py-5 flex flex-col gap-4 rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5 mx-4 mt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Minhas Contas</h3>
                        <button
                            onClick={() => onNavigate && onNavigate('config')}
                            className="text-xs font-bold text-brand-blue dark:text-brand-gold hover:underline transition-colors"
                        >
                            Gerenciar
                        </button>
                    </div>

                    {/* Cards de contas em scroll horizontal */}
                    <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x hide-scrollbar">
                        {bankAccounts.map((account) => {
                            const bal = account.currentBalance ?? account.initialBalance;
                            const isNeg = bal < 0;
                            return (
                                <div
                                    key={account.id}
                                    className="flex-shrink-0 snap-start rounded-2xl p-4 min-w-[160px] flex flex-col gap-2 shadow-sm"
                                    style={{ background: `${account.color}18`, border: `1.5px solid ${account.color}40` }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shadow"
                                            style={{ backgroundColor: account.color }}
                                        >
                                            {account.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{account.name}</span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-medium">Saldo atual</p>
                                        <p className={`text-[18px] font-black leading-tight ${isNeg ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                            {formatCurrency(bal, currency)}
                                        </p>
                                    </div>
                                    {/* Mini barra de progresso do saldo inicial */}
                                    {account.initialBalance > 0 && (
                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, (bal / account.initialBalance) * 100))}%`,
                                                    backgroundColor: account.color
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Total consolidado */}
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-3">
                        <span className="text-[13px] text-slate-500 font-medium">Total em contas</span>
                        <span className={`text-[16px] font-black ${
                            bankAccounts.reduce((s, a) => s + (a.currentBalance ?? a.initialBalance), 0) >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-500'
                        }`}>
                            {formatCurrency(
                                bankAccounts.reduce((s, a) => s + (a.currentBalance ?? a.initialBalance), 0),
                                currency
                            )}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Planejamento / Metas Block */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1C1C1E] px-5 py-6 flex flex-col gap-4 rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5 mx-4 mt-4">
                <div className="flex justify-between items-center cursor-pointer">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Planejamento</h3>
                    <ChevronRight size={20} className="text-slate-400" />
                </div>

                {featuredGoal ? (
                    <div className="flex flex-col gap-3 mt-1">
                        <div className="flex justify-between items-end">
                            <span className="font-semibold text-[15px] text-slate-800 dark:text-slate-200">{featuredGoal.name}</span>
                            <span className="text-[14px] font-bold text-brand-blue dark:text-brand-gold">
                                {formatCurrency(featuredGoal.targetValue - featuredGoal.currentValue, currency)} <span className="text-slate-500 font-normal">restantes</span>
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden my-1">
                            <div
                                className="h-full bg-brand-blue dark:bg-brand-gold rounded-full"
                                style={{ width: `${Math.min(100, (featuredGoal.currentValue / featuredGoal.targetValue) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <p className="text-[15px] text-slate-500 font-medium">Você não tem metas ativas no momento.</p>
                )}
            </motion.div>

            {/* Histórico / Atividades Recentes */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1C1C1E] flex flex-col pt-6 rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5 mx-4 mt-4 mb-32 overflow-hidden">
                <div className="flex justify-between items-center cursor-pointer mb-2 px-5">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Histórico</h3>
                    <ChevronRight size={20} className="text-slate-400" />
                </div>

                <div className="flex flex-col gap-0">
                    {recentTransactions.length > 0 ? recentTransactions.map((t, idx) => (
                        <div key={t.id} className={`flex justify-between items-center p-5 ${idx !== recentTransactions.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''} hover:bg-slate-50 dark:hover:bg-[#2C2C2E] cursor-pointer transition-colors`}>
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-[46px] h-[46px] rounded-full bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 flex justify-center items-center shrink-0">
                                    {getCategoryIcon(t.category)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 truncate">{t.description || t.category}</p>
                                    <p className="text-[13px] text-slate-500 font-medium">
                                        {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[15px] font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                                    {t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount, currency).replace('R$', '').trim()}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <p className="text-[15px] text-slate-500 font-medium px-5 py-5 pb-8">Nenhuma movimentação para este mês.</p>
                    )}
                </div>
            </motion.div>


            {/* Modals */}
            <MonthlyReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                currency={currency}
                currentMonth={filter.month}
                currentYear={filter.year}
                userId={transactions[0]?.userId || ''}
            />

            <ProspectingModal
                isOpen={showProspectingModal}
                onClose={() => setShowProspectingModal(false)}
                currentIncome={kpiData.income}
                recurringExpenses={fixedCostStats.totalFixed}
                currency={currency}
            />
        </motion.div >
    );
};