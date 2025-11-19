import React, { useMemo } from 'react';
import { Transaction, Goal, FilterState } from '../types';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, AlertCircle } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  goals: Goal[];
  filter: FilterState;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, filter }) => {
  
  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const matchMonth = d.getMonth() === filter.month;
      const matchYear = d.getFullYear() === filter.year;
      const matchCategory = filter.category === 'Todas' || t.category === filter.category;
      const matchPayment = filter.paymentMethod === 'Todas' || t.paymentMethod === filter.paymentMethod || t.type === 'income'; // Income doesn't strict check payment method for this simplified view

      return matchMonth && matchYear && matchCategory && matchPayment;
    });
  }, [transactions, filter]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

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

    return { income, expense, balance, mostExpensiveCategory: maxCat, mostExpensiveValue: maxVal };
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
    // Ensure we show the whole month or year trend depending on data
    // For simplicity, showing daily evolution within the selected month
    const daysInMonth = new Date(filter.year, filter.month + 1, 0).getDate();
    const data = [];
    
    for(let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${i.toString().padStart(2, '0')}/${(filter.month + 1).toString().padStart(2, '0')}`;
        let income = 0;
        let expense = 0;

        filteredTransactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getDate() === i) {
                if (t.type === 'income') income += t.amount;
                else expense += t.amount;
            }
        });
        data.push({ name: dateStr, Receita: income, Despesa: expense });
    }
    return data;
  }, [filteredTransactions, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Receitas</p>
                    <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(kpiData.income)}</h3>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <TrendingUp size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Despesas</p>
                    <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(kpiData.expense)}</h3>
                </div>
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <TrendingDown size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Final</p>
                    <h3 className={`text-2xl font-bold mt-1 ${kpiData.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                        {formatCurrency(kpiData.balance)}
                    </h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <DollarSign size={20} />
                </div>
            </div>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria Mais Cara</p>
                    <h3 className="text-lg font-bold text-slate-800 mt-1 truncate" title={kpiData.mostExpensiveCategory}>
                        {kpiData.mostExpensiveCategory}
                    </h3>
                    <p className="text-sm text-slate-500">{formatCurrency(kpiData.mostExpensiveValue)}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <AlertCircle size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Evolução Mensal (Receita vs Despesa)</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Despesa" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Proporção de Despesas</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={barData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Gastos por Categoria</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0"/>
                        <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`}/>
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Goals Thermometers */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto custom-scrollbar max-h-80">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
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
                                <span className="text-sm font-medium text-slate-700">{goal.name}</span>
                                <span className="text-xs text-slate-500">{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
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

    </div>
  );
};