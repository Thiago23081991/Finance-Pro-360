import React, { useState, useMemo } from 'react';
import { Transaction, Goal, AppConfig, Investment, FilterState } from '../types';
import { formatCurrency, getBudgetCategoryType } from '../utils';
import { MONTH_NAMES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, History, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, AlertTriangle, Lightbulb, Siren, Target, CheckCircle2, BarChart4, PieChart, LineChart as LineChartIcon, ArrowRightLeft, Lock, Landmark, FileText, Printer, Calculator, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { DBService } from '../db';
import { MonthlyReportModal } from './MonthlyReportModal';
import { ProspectingModal } from './ProspectingModal';
import { PremiumBanner } from './PremiumBanner';
import { AIAdvisor } from './AIAdvisor';
import { ForecastingService } from '../services/ForecastingService';

import { ForecastItem } from '../types';

interface DashboardProps {
    transactions: Transaction[];
    goals: Goal[];
    filter: FilterState;
    currency?: string;
    isPremium?: boolean;
    config?: AppConfig;
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

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter, currency = 'BRL', isPremium = false, config }) => {
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
            const bucket = getBudgetCategoryType(t.category);
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
            className="space-y-6 pb-20 md:pb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            {/* Premium Banner (Show only for free users) */}
            {!isPremium && <PremiumBanner />}

            {/* AI Advisor (CFO) */}
            < AIAdvisor transactions={transactions} goals={goals} isPremium={isPremium} />

            {/* Action Bar / Header */}
            <motion.div variants={itemVariants} className="flex justify-between items-center bg-gradient-to-r from-surfaceHighlight to-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
                        Dashboard <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{MONTH_NAMES[filter.month]} {filter.year}</span>
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowProspectingModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all"
                    >
                        <Calculator size={16} />
                        <span className="hidden sm:inline">Simular Gastos</span>
                    </button>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-textMain font-bold text-sm rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm transition-all"
                    >
                        <FileText size={16} className="text-blue-600" />
                        <span className="hidden sm:inline">Relatório Mensal</span>
                    </button>
                </div>
            </motion.div>

            {/* KPI Cards & Highlights */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Coluna 1: KPIs Principais (Receita, Despesa, Saldo) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 content-start">
                    {/* Receita */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={14} className="text-emerald-500" />
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receitas</p>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{formatCurrency(kpiData.income, currency)}</h3>
                        <div className="flex items-center gap-1 mt-2">
                            <span className={`text-[10px] font-bold ${momComparison.incomePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {momComparison.incomePct >= 0 ? '+' : ''}{momComparison.incomePct.toFixed(1)}%
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">vs. mês anterior</span>
                        </div>
                    </div>

                    {/* Despesa */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown size={14} className="text-rose-500" />
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Despesas</p>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{formatCurrency(kpiData.expense, currency)}</h3>
                        <div className="flex items-center gap-1 mt-2">
                            <span className={`text-[10px] font-bold ${momComparison.expensePct <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {momComparison.expensePct > 0 ? '+' : ''}{momComparison.expensePct.toFixed(1)}%
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">vs. mês anterior</span>
                        </div>
                    </div>

                    {/* Saldo */}
                    <div className="bg-slate-950 dark:bg-black p-4 rounded-xl border border-slate-800 flex flex-col gap-1 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={14} className="text-slate-300" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Líquido</p>
                        </div>
                        <h3 className={`text-2xl font-bold tracking-tight leading-none ${kpiData.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                            {formatCurrency(kpiData.balance, currency)}
                        </h3>
                        <p className="text-[10px] font-semibold text-slate-500 mt-2">
                            {kpiData.balance >= 0 ? '🟢 Positivo' : '🔴 Atenção'}
                        </p>
                    </div>
                </div>

                {/* Coluna 2: Destaques & Gamificação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 content-start">
                    {/* Score de Saúde Financeira */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saúde Financeira</h4>
                            <Target size={14} className="text-slate-400" />
                        </div>
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{financialHealthScore}</span>
                            <span className="text-[10px] font-bold text-slate-400 mb-0.5">/ 100</span>
                        </div>
                        <p className={`text-[10px] font-bold mt-1 ${financialHealthScore >= 80 ? 'text-emerald-500' : financialHealthScore >= 50 ? 'text-blue-500' : 'text-rose-500'}`}>
                            {financialHealthScore >= 80 ? 'Excelente' : financialHealthScore >= 50 ? 'Estável' : 'Requer Atenção'}
                        </p>
                    </div>



                    {/* Resumo de Investimentos (NOVO) */}
                    {totalInvested > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patrimônio</h4>
                                <Landmark size={14} className="text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{formatCurrency(totalInvested, currency)}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">Investido</p>
                            </div>
                        </div>
                    )}

                    {/* Resumo de Renda Livre (Custos Fixos) */}
                    <div className="bg-surface p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest">Comprometimento</h4>
                                <p className="text-xs text-slate-400">Renda vs. Custos Fixos</p>
                            </div>
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                                <Lock size={18} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Custo Fixo Total</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(fixedCostStats.totalFixed, currency)}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${fixedCostStats.commitedPct > 50 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(fixedCostStats.commitedPct, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 text-right">{fixedCostStats.commitedPct.toFixed(0)}% da renda comprometida</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Renda Livre Estimada</p>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(fixedCostStats.freeIncome, currency)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna 3: Meta em Destaque e Atalhos */}
                <div className="grid grid-cols-1 gap-3 content-start">
                    {/* Meta Principal */}
                    <div className="bg-surface p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[160px] flex flex-col">
                        <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Target size={14} /> Foco Principal
                        </h4>

                        {featuredGoal ? (
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-bold text-textMain truncate max-w-[150px]">{featuredGoal.name}</span>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                        {Math.min(100, Math.round((featuredGoal.currentValue / featuredGoal.targetValue) * 100))}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (featuredGoal.currentValue / featuredGoal.targetValue) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[11px] text-textMuted">
                                    <span>{formatCurrency(featuredGoal.currentValue, currency)}</span>
                                    <span>{formatCurrency(featuredGoal.targetValue, currency)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg">
                                <p className="text-xs text-slate-400 mb-2">Nenhuma meta ativa</p>
                                <span className="text-[10px] font-bold text-blue-500">Defina um objetivo!</span>
                            </div>
                        )}
                    </div>

                    {/* 50/30/20 Rule Widget (Moved) */}
                    <div className="bg-surface p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest">Regra 50/30/20</h4>
                                <p className="text-xs text-slate-400">Distribuição Ideal</p>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                <PieChart size={18} />
                            </div>
                        </div>

                        {/* Needs */}
                        <div
                            className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 -mx-1.5 rounded transition-colors group"
                            onClick={() => setSelectedRuleCategory('needs')}
                        >
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Necessidades (50%)</span>
                                <span className={`${rule503020Stats.needs.pct > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{rule503020Stats.needs.pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${rule503020Stats.needs.pct > 50 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(rule503020Stats.needs.pct, 100)}%` }}></div>
                            </div>
                            <p className="text-[9px] text-slate-400 text-right">{formatCurrency(rule503020Stats.needs.val, currency)}</p>
                        </div>

                        {/* Wants */}
                        <div
                            className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 -mx-1.5 rounded transition-colors group"
                            onClick={() => setSelectedRuleCategory('wants')}
                        >
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Desejos (30%)</span>
                                <span className={`${rule503020Stats.wants.pct > 30 ? 'text-rose-500' : 'text-emerald-500'}`}>{rule503020Stats.wants.pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${rule503020Stats.wants.pct > 30 ? 'bg-rose-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(rule503020Stats.wants.pct, 100)}%` }}></div>
                            </div>
                            <p className="text-[9px] text-slate-400 text-right">{formatCurrency(rule503020Stats.wants.val, currency)}</p>
                        </div>

                        {/* Savings */}
                        <div
                            className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 -mx-1.5 rounded transition-colors group"
                            onClick={() => setSelectedRuleCategory('savings')}
                        >
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Objetivos (20%)</span>
                                <span className={`${rule503020Stats.savings.pct < 20 ? 'text-amber-500' : 'text-emerald-500'}`}>{rule503020Stats.savings.pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${rule503020Stats.savings.pct < 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(rule503020Stats.savings.pct, 100)}%` }}></div>
                            </div>
                            <p className="text-[9px] text-slate-400 text-right">{formatCurrency(rule503020Stats.savings.val, currency)}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Alertas Inteligentes */}
            {smartAlerts.length > 0 && (
                <motion.div variants={itemVariants} className="bg-surface p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-textMain flex items-center gap-2 mb-4">
                        <Lightbulb className="text-amber-500" size={18} /> Insights do seu Comportamento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {smartAlerts.map((alert, i) => (
                            <div key={i} className={`p-4 rounded-xl border flex gap-3 transition-colors ${alert.type === 'critical' ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                                }`}>
                                <div className={`p-2 rounded-lg shrink-0 h-fit ${alert.type === 'critical' ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/40' : 'text-amber-600 bg-amber-100 dark:bg-amber-900/40'}`}>
                                    {alert.type === 'critical' ? <Siren size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{alert.message}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{alert.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Evolução e Histórico */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 bg-surface p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-textMain mb-6 flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-500" /> Fluxo de Caixa Diário ({MONTH_NAMES[filter.month]})
                    </h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                                <Area type="monotone" dataKey="Despesa" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h4 className="text-sm font-bold text-textMain mb-6 flex items-center gap-2">
                        <History size={16} className="text-slate-400" /> Atividades Recentes
                    </h4>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {recentTransactions.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} dark:bg-opacity-20 shrink-0`}>
                                        {getCategoryIcon(t.category)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-textMain truncate">{t.description || t.category}</p>
                                        <p className="text-[10px] text-textMuted uppercase font-medium">{t.category}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold shrink-0 ml-2 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(t.amount, currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Tendências Longo Prazo */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-surface p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-textMain mb-6 flex items-center gap-2">
                        <LineChartIcon size={18} className="text-indigo-500" /> Tendência de Fluxo Mensal (12 Meses)
                    </h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '12px' }} formatter={(v: number) => formatCurrency(v, currency)} />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                        <h4 className="text-sm font-bold text-textMain flex items-center gap-2">
                            <ArrowRightLeft size={18} className="text-blue-500" /> Tendência por Categoria
                        </h4>
                        <select
                            value={selectedTrendCategory}
                            onChange={(e) => setSelectedTrendCategory(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase py-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-3 h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={categoryTrendData.chartData}>
                                    <defs>
                                        <linearGradient id="colorCatTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px' }} formatter={(v: number) => formatCurrency(v, currency)} />
                                    <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCatTrend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col justify-center items-center sm:items-start p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Média Mensal</p>
                            <p className="text-lg font-bold text-textMain leading-tight">{formatCurrency(categoryTrendData.average, currency)}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Projeção Futura */}
            <div className="bg-surface p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in">
                <h4 className="text-sm font-bold text-textMain mb-6 flex items-center gap-2">
                    <Target size={18} className="text-purple-500" /> Projeção de Saldo (Próximos 6 Meses)
                </h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData}>
                            <defs>
                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '12px' }} formatter={(v: number) => formatCurrency(v, currency)} />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="saldo" name="Saldo Projetado" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {projectionData.map((d, i) => (
                        <div key={i} className="min-w-[140px] p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1 mb-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">{d.name}</span>
                                <span className={`text-[10px] font-bold ${d.saldo >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{formatCurrency(d.saldo, currency)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400">Entr.</span>
                                <span className="text-[10px] font-bold text-emerald-600">{formatCurrency(d.receita, currency)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400">Saída</span>
                                <span className="text-[10px] font-bold text-rose-500">{formatCurrency(d.despesa, currency)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rule Detail Modal */}
            {
                selectedRuleCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedRuleCategory(null)}>
                        <div className="bg-surface w-full max-w-md rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                            <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center ${selectedRuleCategory === 'needs' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                selectedRuleCategory === 'wants' ? 'bg-purple-50 dark:bg-purple-900/20' :
                                    'bg-emerald-50 dark:bg-emerald-900/20'
                                }`}>
                                <h3 className="font-bold text-textMain flex items-center gap-2">
                                    {selectedRuleCategory === 'needs' && <Home size={18} className="text-blue-600" />}
                                    {selectedRuleCategory === 'wants' && <PartyPopper size={18} className="text-purple-600" />}
                                    {selectedRuleCategory === 'savings' && <TrendingUp size={18} className="text-emerald-600" />}

                                    {selectedRuleCategory === 'needs' ? 'Necessidades (Detalhes)' :
                                        selectedRuleCategory === 'wants' ? 'Desejos (Detalhes)' :
                                            'Objetivos e Investimentos'}
                                </h3>
                                <button onClick={() => setSelectedRuleCategory(null)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                {(() => {
                                    // Filter Logic similar to rule503020Stats
                                    let items: Transaction[] = [];

                                    if (selectedRuleCategory === 'savings') {
                                        // Logic for Savings: Expenses categorized as 'investments' or similar bucket
                                        items = filteredTransactions.filter(t => t.type === 'expense' && getBudgetCategoryType(t.category) === 'savings');
                                    } else {
                                        items = filteredTransactions.filter(t => t.type === 'expense' && getBudgetCategoryType(t.category) === selectedRuleCategory);
                                    }

                                    items.sort((a, b) => b.amount - a.amount);

                                    if (items.length === 0) {
                                        return (
                                            <div className="p-8 text-center text-slate-400">
                                                <p className="text-sm">Nenhum lançamento encontrado nesta categoria.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {items.map(t => (
                                                <div key={t.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500`}>
                                                            {getCategoryIcon(t.category)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-textMain">{t.description || t.category}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono font-bold text-textMain">
                                                        {formatCurrency(t.amount, currency)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-xs text-slate-400">
                                    Total: <strong className="text-textMain">
                                        {formatCurrency(
                                            filteredTransactions
                                                .filter(t => t.type === 'expense' && getBudgetCategoryType(t.category) === selectedRuleCategory)
                                                .reduce((sum, t) => sum + t.amount, 0)
                                            , currency)}
                                    </strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

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