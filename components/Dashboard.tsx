
import React, { useMemo } from 'react';
import { Transaction, Goal, FilterState } from '../types';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, History, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, AlertTriangle, Lightbulb, Siren, Target, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  goals: Goal[];
  filter: FilterState;
  currency?: string;
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

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter, currency = 'BRL' }) => {
  
  const filteredTransactions = useMemo(() => {
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

  // --- LÓGICA DE ALERTAS INTELIGENTES ---
  const smartAlerts = useMemo(() => {
      const alerts: { type: 'warning' | 'critical', message: string, detail: string }[] = [];
      
      // 1. Médias Históricas (Exclui o mês atual para base comparativa)
      const historySums: Record<string, number> = {};
      const historyCounts: Record<string, Set<string>> = {};

      transactions.forEach(t => {
          if (t.type !== 'expense') return;
          const d = new Date(t.date + 'T12:00:00');
          if (d.getMonth() !== filter.month || d.getFullYear() !== filter.year) {
              const monthKey = `${d.getMonth()}-${d.getFullYear()}`;
              historySums[t.category] = (historySums[t.category] || 0) + t.amount;
              if (!historyCounts[t.category]) historyCounts[t.category] = new Set();
              historyCounts[t.category].add(monthKey);
          }
      });

      // 2. Gastos do Mês Atual
      const currentExpenses: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
          currentExpenses[t.category] = (currentExpenses[t.category] || 0) + t.amount;
      });

      // 3. Comparação: Atual vs Média
      Object.entries(currentExpenses).forEach(([cat, amount]) => {
          const monthsCount = historyCounts[cat]?.size || 0;
          if (monthsCount >= 1) {
              const avg = historySums[cat] / monthsCount;
              if (amount > avg * 1.25) { // 25% acima da média
                  alerts.push({
                      type: 'warning',
                      message: `Gasto Elevado em ${cat}`,
                      detail: `Você gastou ${Math.round(((amount/avg)-1)*100)}% a mais que sua média histórica (${formatCurrency(avg, currency)}).`
                  });
              }
          }
      });

      // 4. Regra dos 40% (Concentração de Receita)
      if (kpiData.income > 0) {
          Object.entries(currentExpenses).forEach(([cat, amount]) => {
              const ratio = (amount / kpiData.income) * 100;
              if (ratio > 40) {
                  alerts.push({
                      type: 'critical',
                      message: `Alerta de Concentração: ${cat}`,
                      detail: `Esta categoria consumiu ${ratio.toFixed(1)}% da sua renda mensal. Tente reduzir para evitar dependência.`
                  });
              }
          });
      }

      return alerts;
  }, [transactions, filteredTransactions, filter, kpiData.income, currency]);

  const barData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const timelineData = useMemo(() => {
    const daysInMonth = new Date(filter.year, filter.month + 1, 0).getDate();
    const data = [];
    for(let i = 1; i <= daysInMonth; i++) {
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

  const recentTransactions = useMemo(() => {
      return [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receitas</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(kpiData.income, currency)}</h3>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={20} />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Despesas</p>
                    <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(kpiData.expense, currency)}</h3>
                </div>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                    <TrendingDown size={20} />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo</p>
                    <h3 className={`text-2xl font-black mt-1 ${kpiData.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(kpiData.balance, currency)}
                    </h3>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <DollarSign size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* SEÇÃO: ALERTAS INTELIGENTES */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Lightbulb className="text-amber-500" size={18} /> Alertas Inteligentes
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análise de Dados IA</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smartAlerts.length === 0 ? (
                  <div className="col-span-full py-4 px-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium">Sua saúde financeira está excelente! Nenhum desvio detectado este mês.</p>
                  </div>
              ) : (
                  smartAlerts.map((alert, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex gap-3 transition-transform hover:scale-[1.02] ${
                          alert.type === 'critical' 
                          ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' 
                          : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                      }`}>
                          <div className={`p-2 rounded-lg shrink-0 ${alert.type === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                              {alert.type === 'critical' ? <Siren size={18} /> : <AlertTriangle size={18} />}
                          </div>
                          <div className="overflow-hidden">
                              <h4 className={`text-sm font-bold truncate ${alert.type === 'critical' ? 'text-rose-900 dark:text-rose-300' : 'text-amber-900 dark:text-amber-300'}`}>
                                  {alert.message}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                  {alert.detail}
                              </p>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6">Evolução Diária</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                         <defs>
                            <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{backgroundColor: 'var(--tooltip-bg, #fff)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                            formatter={(v: number) => formatCurrency(v, currency)}
                        />
                        <Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                        <Area type="monotone" dataKey="Despesa" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <History size={16} /> Últimas Atividades
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {recentTransactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} dark:bg-opacity-20`}>
                                {getCategoryIcon(t.category)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{t.description || t.category}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <span className={`text-xs font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6">Gastos por Categoria</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.1}/>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                        <Tooltip 
                            formatter={(v: number) => formatCurrency(v, currency)}
                            cursor={{fill: 'rgba(148, 163, 184, 0.1)', radius: 4}}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <Target size={18}/> Radar de Metas
            </h4>
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {goals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                        <Target size={32} className="opacity-20 mb-2" />
                        Nenhuma meta cadastrada.
                    </div>
                ) : (
                    goals.map(goal => {
                        const pct = Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
                        return (
                            <div key={goal.id}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{goal.name}</span>
                                    <span className="text-[10px] font-black text-slate-500">{Math.round(pct)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-gold'}`} 
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
                                    <span>{formatCurrency(goal.currentValue, currency)}</span>
                                    <span>{formatCurrency(goal.targetValue, currency)}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
          </div>
      </div>
    </div>
  );
};
