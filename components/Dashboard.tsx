
import React, { useMemo, useState } from 'react';
import { Transaction, Goal, FilterState } from '../types';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, History, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, AlertTriangle, Lightbulb, Siren, Target, CheckCircle2, BarChart4, PieChart, LineChart as LineChartIcon, ArrowRightLeft } from 'lucide-react';

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

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter, currency = 'BRL' }) => {
  const [selectedTrendCategory, setSelectedTrendCategory] = useState<string>('Alimentação');
  
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

  const availableCategories = useMemo(() => {
      const cats = new Set<string>();
      transactions.forEach(t => { if(t.type === 'expense') cats.add(t.category); });
      return Array.from(cats);
  }, [transactions]);

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

  // --- LÓGICA DE TENDÊNCIA MENSAL GERAL (12 MESES) - AGORA COM RECEITA E DESPESA ---
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

  const quarterlyData = useMemo(() => {
      const quarters = [
          { name: '1º Trim', income: 0, expense: 0 },
          { name: '2º Trim', income: 0, expense: 0 },
          { name: '3º Trim', income: 0, expense: 0 },
          { name: '4º Trim', income: 0, expense: 0 },
      ];
      transactions.forEach(t => {
          const d = new Date(t.date + 'T12:00:00');
          if (d.getFullYear() === filter.year) {
              const qIdx = Math.floor(d.getMonth() / 3);
              if (t.type === 'income') quarters[qIdx].income += t.amount;
              else quarters[qIdx].expense += t.amount;
          }
      });
      return quarters;
  }, [transactions, filter.year]);

  const barData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.keys(data)
        .map(key => ({ name: key, value: data[key] }))
        .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const smartAlerts = useMemo(() => {
      const alerts: { type: 'warning' | 'critical', message: string, detail: string }[] = [];
      const currentExpenses: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
          currentExpenses[t.category] = (currentExpenses[t.category] || 0) + t.amount;
      });
      if (kpiData.income > 0) {
          Object.entries(currentExpenses).forEach(([cat, amount]) => {
              const ratio = (amount / kpiData.income) * 100;
              if (ratio > 40) {
                  alerts.push({
                      type: 'critical',
                      message: `Alerta de Concentração: ${cat}`,
                      detail: `Esta categoria consumiu ${ratio.toFixed(1)}% da sua renda mensal.`
                  });
              }
          });
      }
      return alerts;
  }, [filteredTransactions, kpiData.income]);

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
            <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receitas</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(kpiData.income, currency)}</h3>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 self-end -mt-8">
                <TrendingUp size={20} />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-all hover:shadow-md">
            <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Despesas</p>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(kpiData.expense, currency)}</h3>
            </div>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 self-end -mt-8">
                <TrendingDown size={20} />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-all hover:shadow-md">
            <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo</p>
                <h3 className={`text-2xl font-black mt-1 ${kpiData.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(kpiData.balance, currency)}
                </h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 self-end -mt-8">
                <DollarSign size={20} />
            </div>
        </div>
      </div>

      {/* Alertas */}
      {smartAlerts.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <Lightbulb className="text-amber-500" size={18} /> Alertas Inteligentes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {smartAlerts.map((alert, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex gap-3 ${
                        alert.type === 'critical' ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                    }`}>
                        <div className={`p-2 rounded-lg shrink-0 ${alert.type === 'critical' ? <Siren size={18} /> : <AlertTriangle size={18} />}`}>
                            {alert.type === 'critical' ? <Siren size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{alert.message}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{alert.detail}</p>
                        </div>
                    </div>
                ))}
              </div>
          </div>
      )}

      {/* Linha 1: Evolução Diária + Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" /> Evolução Diária (Mês Atual)
            </h4>
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
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px'}} />
                        <Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                        <Area type="monotone" dataKey="Despesa" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <History size={16} className="text-slate-400" /> Atividades Recentes
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {recentTransactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} dark:bg-opacity-20`}>
                                {getCategoryIcon(t.category)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{t.description || t.category}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <span className={`text-xs font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(t.amount, currency)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Linha 2: Tendência Mensal (LineChart) + Tendência por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GRÁFICO DE LINHA: TENDÊNCIA FINANCEIRA 12 MESES */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <LineChartIcon size={18} className="text-indigo-500" /> Tendência de Fluxo Mensal (12 Meses)
              </h4>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                          <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                            formatter={(v: number) => formatCurrency(v, currency)}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                          <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} animationDuration={1500} />
                          <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} animationDuration={1500} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <ArrowRightLeft size={18} className="text-blue-500" /> Tendência por Categoria
                  </h4>
                  <div className="flex items-center gap-2">
                      <select 
                        value={selectedTrendCategory}
                        onChange={(e) => setSelectedTrendCategory(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase py-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 dark:text-slate-300"
                      >
                          {availableCategories.length === 0 ? <option>Nenhuma despesa</option> : availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3 h-52">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={categoryTrendData.chartData}>
                              <defs>
                                  <linearGradient id="colorCatTrend" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.05} />
                              <XAxis dataKey="name" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                              <YAxis hide />
                              <Tooltip 
                                contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px'}} 
                                formatter={(v: number) => formatCurrency(v, currency)}
                              />
                              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCatTrend)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center items-center sm:items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Média Mensal</p>
                      <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{formatCurrency(categoryTrendData.average, currency)}</p>
                      <div className="mt-3 flex items-center gap-1.5">
                          <div className={`p-1 rounded-full ${categoryTrendData.chartData[11].valor > categoryTrendData.average ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              <TrendingUp size={12} className={categoryTrendData.chartData[11].valor <= categoryTrendData.average ? 'rotate-180' : ''} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">vs Média</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Linha 3: Balanço Trimestral + Gastos por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <BarChart4 size={18} className="text-indigo-500" /> Balanço por Trimestre ({filter.year})
                  </h4>
                  <div className="flex gap-3">
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Receita</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Despesa</span></div>
                  </div>
              </div>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                          <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: 'rgba(148, 163, 184, 0.05)'}} contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px'}} />
                          <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                          <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <PieChart size={18} className="text-blue-500" /> Gastos por Categoria ({MONTH_NAMES[filter.month]})
            </h4>
            <div className="h-64">
                {barData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                        <CircleDollarSign size={32} className="opacity-20 mb-2" />
                        Nenhum gasto registrado este mês.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" border-slate-200 horizontal={false} stroke="#94a3b8" strokeOpacity={0.1}/>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                            <Tooltip 
                                formatter={(v: number) => formatCurrency(v, currency)}
                                contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px'}}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                                {barData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
          </div>
      </div>

      {/* Linha 4: Radar de Metas */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
            <Target size={18} className="text-rose-500" /> Radar de Metas em Andamento
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goals.length === 0 ? (
                <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                    <Target size={32} className="opacity-20 mb-2" />
                    Nenhuma meta cadastrada.
                </div>
            ) : (
                goals.map(goal => {
                    const pct = Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
                    return (
                        <div key={goal.id} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{goal.name}</span>
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{Math.round(pct)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-gold'}`} 
                                    style={{ width: `${pct}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2.5 text-[10px] text-slate-400 font-mono">
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
  );
};
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
