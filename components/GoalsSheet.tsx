
import React, { useState, useMemo } from 'react';
import { Goal } from '../types';
import { formatCurrency, formatPercent, generateId, getStatusColor } from '../utils';
import { Plus, Trash2, Save, X, Target, Trophy, TrendingUp, PieChart as PieIcon, ArrowRight, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface GoalsSheetProps {
    goals: Goal[];
    onAdd: (g: Goal) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, val: number) => void;
    currency?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const GoalsSheet: React.FC<GoalsSheetProps> = ({ goals, onAdd, onDelete, onUpdate, currency = 'BRL' }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');

    const handleSave = () => {
        if (!name || !target) return;
        const targetVal = parseFloat(target);
        const currentVal = parseFloat(current) || 0;

        const newGoal: Goal = {
            id: generateId(),
            userId: 'temp',
            name,
            targetValue: targetVal,
            currentValue: currentVal,
            status: currentVal >= targetVal ? 'Concluída' : 'Em andamento'
        };
        onAdd(newGoal);
        setName('');
        setTarget('');
        setCurrent('');
        setIsAdding(false);
    };

    // --- STATISTICS & DATA PREP ---
    const stats = useMemo(() => {
        const totalTarget = goals.reduce((acc, g) => acc + g.targetValue, 0);
        const totalSaved = goals.reduce((acc, g) => acc + g.currentValue, 0);
        const remaining = Math.max(0, totalTarget - totalSaved);
        const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
        const completedCount = goals.filter(g => g.currentValue >= g.targetValue).length;

        return { totalTarget, totalSaved, remaining, progress, completedCount };
    }, [goals]);

    const chartData = useMemo(() => {
        return goals.map(g => ({
            name: g.name,
            Atual: g.currentValue,
            Falta: Math.max(0, g.targetValue - g.currentValue),
            fullTotal: g.targetValue  // Helper for sorting or tooltip
        })).sort((a, b) => b.fullTotal - a.fullTotal); // Sort by biggest goal
    }, [goals]);

    const distributionData = useMemo(() => {
        return goals.filter(g => g.currentValue > 0).map((g, index) => ({
            name: g.name,
            value: g.currentValue,
            color: COLORS[index % COLORS.length]
        }));
    }, [goals]);


    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-full flex flex-col h-[calc(100vh-100px)] overflow-hidden">

            {/* Header / Stats Section */}
            <div className="flex-shrink-0 p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Target className="text-blue-600" /> Metas Financeiras
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Torne seus sonhos realidade</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 transition-all transform hover:scale-105"
                    >
                        <Plus size={16} />
                        Nova Meta
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Total Acumulado */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Acumulado</p>
                                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(stats.totalSaved, currency)}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                <Wallet size={18} />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(stats.progress, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Falta Acumular */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Falta Acumular</p>
                                <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mt-1">{formatCurrency(stats.remaining, currency)}</h3>
                            </div>
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                                <Target size={18} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Continue focado!</p>
                    </div>

                    {/* Progresso Geral */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl shadow-md text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Conclusão Geral</p>
                                <h3 className="text-2xl font-black mt-1">{stats.progress.toFixed(1)}%</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg text-white">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <p className="text-[10px] text-white/70 mt-2">{stats.completedCount} de {goals.length} metas alcançadas</p>
                    </div>

                    {/* Insights Mini Chart */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center">
                        {distributionData.length > 0 ? (
                            <div className="h-16 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={30} paddingAngle={2}>
                                            {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400">Sem dados</p>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">Distribuição</p>
                    </div>
                </div>

                {/* Main Progress Chart */}
                {goals.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-48">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Visão Geral das Metas</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={12}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', fontSize: '12px' }} formatter={(val: number) => formatCurrency(val, currency)} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="Atual" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Falta" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Add Local Form Overlay */}
            {isAdding && (
                <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md w-full max-w-md border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Criar Nova Meta</h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Objetivo</label>
                                <input autoFocus type="text" placeholder="Ex: Viagem Japão" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Alvo</label>
                                    <input type="number" placeholder="0,00" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Já Tenho</label>
                                    <input type="number" placeholder="0,00" value={current} onChange={e => setCurrent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-500/30 transition-all mt-2">
                                Salvar Meta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scrollable Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar px-4 pb-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Objetivo</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Progresso</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-right">Saldo Atual</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-center">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {goals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                                        Nenhuma meta cadastrada ainda.
                                    </td>
                                </tr>
                            ) : (
                                goals.map(g => {
                                    const percent = (g.currentValue / g.targetValue) * 100;
                                    const status = percent >= 100 ? 'Concluída' : 'Em andamento';
                                    return (
                                        <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="py-4 px-6">
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{g.name}</p>
                                                <p className="text-[10px] text-slate-400">Meta: {formatCurrency(g.targetValue, currency)}</p>
                                            </td>
                                            <td className="py-4 px-6 align-middle w-1/3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 w-10 text-right">{percent.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="relative inline-block group/edit">
                                                    <input
                                                        type="number"
                                                        className="bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-500 focus:border-blue-500 focus:outline-none w-28 text-right font-mono text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors"
                                                        value={g.currentValue}
                                                        onChange={(e) => onUpdate(g.id, parseFloat(e.target.value))}
                                                    />
                                                    <span className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/edit:opacity-100 text-slate-300 text-[10px]">✎</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status === 'Concluída' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30'}`}>
                                                    {status}
                                                </span>
                                                {status === 'Concluída' && <Trophy size={14} className="inline ml-1 text-emerald-500" />}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => onDelete(g.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


