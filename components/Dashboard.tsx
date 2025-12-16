
import React, { useMemo } from 'react';
import { Transaction, Goal, FilterState } from '../types';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, AlertCircle, CalendarRange, PiggyBank, History, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, AlertTriangle, ArrowUpRight, Lightbulb, Siren } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  goals: Goal[];
  filter: FilterState;
  currency?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const LINE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

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

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter, currency = 'BRL' }) => {
  
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

    // --- HEALTH SCORE CALCULATION (1-5) ---
    // 1: Critical (Expense > Income)
    // 2: Risk (Expense > 85% of Income)
    // 3: Attention (Expense > 70% of Income)
    // 4: Balanced (Expense > 50% of Income)
    // 5: Elite (Expense <= 50% of Income)
    let healthScore = 0;
    let healthLabel = "";
    let healthColor = "";

    if (income === 0) {
        healthScore = 1;
        healthLabel = "Sem Renda";
        healthColor = "text-slate-400";
    } else {
        const expenseRatio = (expense / income) * 100;
        
        if (expenseRatio > 100) {
            healthScore = 1;
            healthLabel = "Crítico";
            healthColor = "text-rose-600";
        } else if (expenseRatio > 85) {
            healthScore = 2;
            healthLabel = "Risco";
            healthColor = "text-orange-500";
        } else if (expenseRatio > 70) {
            healthScore = 3;
            healthLabel = "Atenção";
            healthColor = "text-yellow-500";
        } else if (expenseRatio > 50) {
            healthScore = 4;
            healthLabel = "Equilibrado";
            healthColor = "text-blue-500";
        } else {
            healthScore = 5;
            healthLabel = "Elite";
            healthColor = "text-emerald-500";
        }
    }

    return { income, expense, balance, savingsRate, mostExpensiveCategory: maxCat, mostExpensiveValue: maxVal, healthScore, healthLabel, healthColor };
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

  // --- ALERTS SYSTEM LOGIC ---
  const alertsData = useMemo(() => {
      const alerts: { type: 'warning' | 'critical', message: string, detail: string }[] = [];
      
      // 1. Calculate Average Spending per Category (Historical)
      // We look at all transactions NOT in the current month/year filter to build history
      const monthlyAgg: Record<string, Set<string>> = {}; // Cat -> Set("0-2023", "1-2023") - Track months with activity
      const monthlySum: Record<string, number> = {};

      transactions.filter(t => t.type === 'expense').forEach(t => {
          const d = new Date(t.date + 'T12:00:00');
          const isCurrentView = d.getMonth() === filter.month && d.getFullYear() === filter.year;
          
          if (!isCurrentView) {
             const mKey = `${d.getMonth()}-${d.getFullYear()}`;
             if(!monthlyAgg[t.category]) monthlyAgg[t.category] = new Set();
             monthlyAgg[t.category].add(mKey);
             monthlySum[t.category] = (monthlySum[t.category] || 0) + t.amount;
          }
      });

      // Calculate Current Month Totals
      const currentMonthExpenses: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
          currentMonthExpenses[t.category] = (currentMonthExpenses[t.category] || 0) + t.amount;
      });

      // 2. Check for Spikes (> 20% above average)
      Object.entries(currentMonthExpenses).forEach(([cat, amount]) => {
          const monthsActive = monthlyAgg[cat]?.size || 0;
          
          if (monthsActive > 0) {
              const historicalTotal = monthlySum[cat] || 0;
              const historicalAvg = historicalTotal / monthsActive;

              // Only trigger if amount is significant (> 100) and avg is established
              if (amount > 100 && amount > historicalAvg * 1.2) {
                  const percentDiff = ((amount - historicalAvg) / historicalAvg) * 100;
                  alerts.push({
                      type: 'warning',
                      message: `Gasto acima da média: ${cat}`,
                      detail: `Você gastou ${Math.round(percentDiff)}% a mais que sua média histórica (${formatCurrency(historicalAvg, currency)}).`
                  });
              }
          }
      });

      // 3. Check for Budget Concentration (> 40% of Income)
      if (kpiData.income > 0) {
          Object.entries(currentMonthExpenses).forEach(([cat, amount]) => {
              if (amount > kpiData.income * 0.4) {
                  alerts.push({
                      type: 'critical',
                      message: `Alto Impacto: ${cat}`,
                      detail: `Atenção! ${cat} está consumindo ${((amount / kpiData.income) * 100).toFixed(0)}% de toda sua receita mensal.`
                  });
              }
          });
      }

      // 4. Savings Alert
      if (kpiData.income > 0 && kpiData.savingsRate < 5) {
           alerts.push({
              type: 'critical',
              message: 'Taxa de Poupança Baixa',
              detail: 'Cuidado, você está poupando menos de 5% da sua renda este mês.'
          });
      }

      return alerts;
  }, [transactions, filteredTransactions, filter, kpiData.income, kpiData.savingsRate, currency]);


  // --- CATEGORY TREND CHART LOGIC ---
  const trendData = useMemo(() => {
      // 1. Find Top 5 Categories (by total spend in current year)
      const categoryTotals: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === filter.year).forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });
      
      const topCategories = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(entry => entry[0]);

      // 2. Build Month-by-Month Data for these categories
      const monthsData = [];
      for (let i = 0; i <= 11; i++) {
          const monthName = new Date(filter.year, i, 1).toLocaleDateString('pt-BR', { month: 'short' });
          const row: any = { name: monthName };
          
          topCategories.forEach(cat => {
              row[cat] = 0;
          });

          transactions.filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === filter.year && new Date(t.date + 'T12:00').getMonth() === i).forEach(t => {
              if (topCategories.includes(t.category)) {
                  row[t.category] += t.amount;
              }
          });
          monthsData.push(row);
      }
      return { data: monthsData, categories: topCategories };
  }, [transactions, filter.year]);


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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        
        {/* Row 1, Col 1: Receitas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receitas</p>
                    <h3 className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(kpiData.income, currency)}</h3>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={20} />
                </div>
            </div>
        </div>

        {/* Row 1, Col 2: Despesas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Despesas</p>
                    <h3 className="text-xl lg:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(kpiData.expense, currency)}</h3>
                </div>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                    <TrendingDown size={20} />
                </div>
            </div>
        </div>

        {/* Row 1, Col 3: Saldo Final */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo Final</p>
                    <h3 className={`text-xl lg:text-2xl font-bold mt-1 ${kpiData.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(kpiData.balance, currency)}
                    </h3>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <DollarSign size={20} />
                </div>
            </div>
        </div>

        {/* Row 2, Col 1: Taxa de Poupança */}
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

        {/* Row 2, Col 2: Maior Gasto */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maior Gasto</p>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={kpiData.mostExpensiveCategory}>
                        {kpiData.mostExpensiveCategory}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(kpiData.mostExpensiveValue, currency)}</p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                    <AlertCircle size={20} />
                </div>
            </div>
        </div>

        {/* Row 2, Col 3: HEALTH SCORE (NEW) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start">
                <div className="w-full">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Saúde Financeira</p>
                    <div className="flex items-end justify-between mt-1">
                        <h3 className={`text-2xl font-black ${kpiData.healthColor}`}>
                            {kpiData.healthScore}<span className="text-sm text-slate-400 font-normal">/5</span>
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-opacity-10 border ${
                            kpiData.healthScore === 5 ? 'bg-emerald-500 border-emerald-500 text-emerald-600' :
                            kpiData.healthScore === 4 ? 'bg-blue-500 border-blue-500 text-blue-600' :
                            kpiData.healthScore === 3 ? 'bg-yellow-500 border-yellow-500 text-yellow-600' :
                            kpiData.healthScore === 2 ? 'bg-orange-500 border-orange-500 text-orange-600' :
                            'bg-rose-500 border-rose-500 text-rose-600'
                        } dark:bg-opacity-20`}>
                            {kpiData.healthLabel}
                        </span>
                    </div>
                    {/* Progress Bar for Score */}
                    <div className="flex gap-1 mt-3 h-2">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div 
                                key={step} 
                                className={`flex-1 rounded-sm transition-all duration-500 ${
                                    step <= kpiData.healthScore 
                                    ? (kpiData.healthScore === 5 ? 'bg-emerald-500' : 
                                       kpiData.healthScore === 4 ? 'bg-blue-500' :
                                       kpiData.healthScore === 3 ? 'bg-yellow-400' :
                                       kpiData.healthScore === 2 ? 'bg-orange-500' : 'bg-rose-500') 
                                    : 'bg-slate-100 dark:bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* ALERTAS INTELIGENTES */}
      {alertsData.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/50 overflow-hidden transition-colors">
              <div className="p-4 border-b border-amber-100 dark:border-amber-800/50 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
                    <Lightbulb size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Alertas Inteligentes</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alertsData.map((alert, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 shadow-sm ${
                          alert.type === 'critical' 
                          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' 
                          : 'bg-white dark:bg-slate-800 border-amber-100 dark:border-amber-900/50'
                      }`}>
                          <div className={`p-2 rounded-full shrink-0 ${
                              alert.type === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
                          }`}>
                              {alert.type === 'critical' ? <Siren size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div>
                              <p className={`text-sm font-bold ${
                                  alert.type === 'critical' ? 'text-rose-800 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'
                              }`}>{alert.message}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{alert.detail}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Evolução Mensal (Receita vs Despesa)</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                         <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => currency === 'BRL' ? `R$${val}` : `${val}`} />
                        <Tooltip 
                            contentStyle={{backgroundColor: 'var(--tooltip-bg, #fff)', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                            formatter={(value: number) => formatCurrency(value, currency)}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Despesa" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                    </AreaChart>
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
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* CHART: CONSUMPTION TRENDS BY CATEGORY (NEW) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ArrowUpRight size={18} className="text-purple-500" />
                  Tendência de Consumo (Top 5 Categorias - {filter.year})
              </h4>
          </div>
          <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => currency === 'BRL' ? `R$${val}` : `${val}`}/>
                      <Tooltip 
                          contentStyle={{backgroundColor: 'var(--tooltip-bg, #fff)', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                          formatter={(value: number) => formatCurrency(value, currency)}
                      />
                      <Legend />
                      {trendData.categories.map((cat, index) => (
                          <Line 
                              key={cat} 
                              type="monotone" 
                              dataKey={cat} 
                              stroke={LINE_COLORS[index % LINE_COLORS.length]} 
                              strokeWidth={2} 
                              dot={{r: 3}}
                              activeDot={{r: 6}}
                          />
                      ))}
                  </LineChart>
              </ResponsiveContainer>
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
                        <XAxis type="number" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => currency === 'BRL' ? `R$${val}` : `${val}`}/>
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} cursor={{fill: 'transparent'}} contentStyle={{color: '#333'}} />
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
                                <span>{formatCurrency(goal.currentValue, currency)}</span>
                                <span>{formatCurrency(goal.targetValue, currency)}</span>
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
                Total: {formatCurrency(quarterData.total, currency)}
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
                                    {formatCurrency(cat.value, currency)}
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
