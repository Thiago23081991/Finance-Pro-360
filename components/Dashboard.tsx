
import React, { useMemo } from 'react';
import { Transaction, Goal, FilterState } from '../types';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, AlertCircle, CalendarRange, PiggyBank, History, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  goals: Goal[];
  filter: FilterState;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Helper to get Icon based on category name
const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('aliment')) return <Utensils size={16} />;
    if (lower.includes('transporte') || lower.includes('carro') || lower.includes('combust')) return <Car size={16} />;
    if (lower.includes('moradia') || lower.includes('casa') || lower.includes('aluguel')) return <Home size={16} />;
    if (lower.includes('saúde') || lower.includes('medico') || lower.includes('farmacia')) return <HeartPulse size={16} />;
    if (lower.includes('lazer') || lower.includes('viagem') || lower.includes('restaurante')) return <PartyPopper size={16} />;
    if (lower.includes('educa') || lower.includes('curso') || lower.includes('escola')) return <GraduationCap size={16} />;
    if (lower.includes('salário') || lower.includes('renda')) return <Banknote size={16} />;
    if (lower.includes('invest')) return <TrendingUp size={16} />;
    if (lower.includes('mercado') || lower.includes('compras')) return <ShoppingBag size={16} />;
    if (lower.includes('luz') || lower.includes('agua') || lower.includes('internet')) return <Zap size={16} />;
    return <CircleDollarSign size={16} />;
};

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter }) => {
  
  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00'); // Force time to avoid timezone issues
      const matchMonth = d.getMonth() === filter.month;
      const matchYear = d.getFullYear() === filter.year;
      const matchCategory = filter.category === 'Todas' || t.category === filter.category;
      const matchPayment = filter.paymentMethod === 'Todas' || t.paymentMethod === filter.paymentMethod || t.type === 'income'; 

      return matchMonth && matchYear && matchCategory && matchPayment;
    });
  }, [transactions, filter]);

  // Recent Transactions (Global - not filtered by date, just last 5)
  const recentTransactions = useMemo(() => {
      return [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
  }, [transactions]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    
    // Savings Rate (Taxa de Poupança)
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Most expensive category
    const expensesByCategory: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });
    let maxCat = "N/A";
    let maxVal = 0;
    Object.entries(expensesByCategory).forEach(([cat, val]) => {
        if(val > maxVal) {
            maxVal = val;
            maxCat = cat;
        }
    });

    return { income, expense, balance, savingsRate, mostExpensiveCategory: maxCat, mostExpensiveValue: maxVal };
  }, [filteredTransactions]);

  // Chart Data Preparation
  const barData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const timelineData = useMemo(() => {
    // Ensure we show the whole month
    const daysInMonth = new Date(filter.year, filter.month + 1, 0).getDate();
    const data = [];
    
    for(let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${i.toString().padStart(2, '0')}/${(filter.month + 1).toString().padStart(2, '0')}`;
        let income = 0;
        let expense = 0;

        filteredTransactions.forEach(t => {
            const d = new Date(t.date + 'T12:00:00');
            if (d.getDate() === i) {
                if (t.type === 'income') income += t.amount;
                else expense += t.amount;
            }
        });
        data.push({ name: dateStr, Receita: income, Despesa: expense });
    }
    return data;
  }, [filteredTransactions, filter]);

  // --- QUARTERLY ANALYSIS LOGIC ---
  const quarterData = useMemo(() => {
    const qIndex = Math.floor(filter.month / 3); 
    const startMonth = qIndex * 3;
    const endMonth = startMonth + 2;

    const quarterTxs = transactions.filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return t.type === 'expense' &&
               d.getFullYear() === filter.year &&
               d.getMonth() >= startMonth &&
               d.getMonth() <= endMonth;
    });

    const totalQuarterExpense = quarterTxs.reduce((sum, t) => sum + t.amount, 0);
    const agg: Record<string, number> = {};

    quarterTxs.forEach(t => {
        agg[t.category] = (agg[t.category] || 0) + t.amount;
    });

    const sortedCats = Object.entries(agg)
        .map(([name, value]) => ({ 
            name, 
            value,
            percent: totalQuarterExpense > 0 ? (value / totalQuarterExpense) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);

    return {
        quarterName: `${qIndex + 1}º Trimestre`,
        total: totalQuarterExpense,
        categories: sortedCats
    };
  }, [transactions, filter]);

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receitas</p>
                    <h3 className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(kpiData.income)}</h3>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Despesas</p>
                    <h3 className="text-xl lg:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(kpiData.expense)}</h3>
                </div>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                    <TrendingDown size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo Final</p>
                    <h3 className={`text-xl lg:text-2xl font-bold mt-1 ${kpiData.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(kpiData.balance)}
                    </h3>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <DollarSign size={20} />
                </div>
            </div>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taxa de Poupança</p>
                    <h3 className={`text-xl lg:text-2xl font-bold mt-1 ${kpiData.savingsRate >= 20 ? 'text-emerald-600' : kpiData.savingsRate > 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                        {kpiData.savingsRate.toFixed(1)}%
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Ideal: {">"} 20%</p>
                </div>
                <div className={`p-2 rounded-lg ${kpiData.savingsRate >= 20 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'} dark:bg-slate-700 dark:text-slate-300`}>
                    <PiggyBank size={20} />
                </div>
            </div>
        </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
                <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maior Gasto</p>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={kpiData.mostExpensiveCategory}>
                        {kpiData.mostExpensiveCategory}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(kpiData.mostExpensiveValue)}</p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                    <AlertCircle size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Evolução Mensal (Receita vs Despesa)</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                        <Tooltip 
                            contentStyle={{backgroundColor: 'var(--tooltip-bg, #fff)', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Despesa" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Transactions List (NEW) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors flex flex-col">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <History size={16} /> Últimas Movimentações
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 max-h-64 lg:max-h-full">
                {recentTransactions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Nenhuma transação recente.</p>
                ) : (
                    recentTransactions.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} dark:bg-opacity-20`}>
                                    {getCategoryIcon(t.category)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={t.description}>
                                        {t.description || t.category}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Gastos por Categoria</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.2}/>
                        <XAxis type="number" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`}/>
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'transparent'}} contentStyle={{color: '#333'}} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Goals Thermometers */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar max-h-80 transition-colors">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <PieIcon size={16}/>
                Metas Financeiras
            </h4>
            <div className="space-y-5">
                {goals.length === 0 && <p className="text-sm text-slate-400">Nenhuma meta cadastrada.</p>}
                {goals.map(goal => {
                    const percentage = Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
                    return (
                        <div key={goal.id}>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{goal.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-slate-400">
                                <span>{formatCurrency(goal.currentValue)}</span>
                                <span>{formatCurrency(goal.targetValue)}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
          </div>
      </div>

      {/* NEW SECTION: Quarterly Analysis */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <CalendarRange size={18} className="text-indigo-500" />
                Resumo do {quarterData.quarterName}
            </h4>
            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                Total: {formatCurrency(quarterData.total)}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quarterData.categories.length === 0 ? (
                <p className="col-span-full text-center text-sm text-slate-400 py-4">
                    Nenhuma despesa registrada neste trimestre.
                </p>
            ) : (
                quarterData.categories.map((cat, idx) => (
                    <div key={idx} className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                ></div>
                                <span className="text-xs font-semibold inline-block text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                    {getCategoryIcon(cat.name)} {cat.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-slate-600 dark:text-slate-300">
                                    {formatCurrency(cat.value)}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100 dark:bg-slate-700">
                            <div 
                                style={{ width: `${cat.percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} 
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500"
                            ></div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right -mt-3">{cat.percent.toFixed(1)}% do total</p>
                    </div>
                ))
            )}
        </div>
      </div>

    </div>
  );
};
