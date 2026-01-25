import React, { useState, useEffect } from 'react';
import { X, Printer, Sparkles, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Transaction, Goal, AppConfig } from '../types';
import { formatCurrency, exportToCSV } from '../utils';
import { DBService } from '../db';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface MonthlyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonth: number;
    currentYear: number;
    userId: string;
    currency?: string;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
    isOpen, onClose, currentMonth, currentYear, userId, currency = 'BRL'
}) => {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<string>('');
    const [reportData, setReportData] = useState<{
        income: number;
        expense: number;
        balance: number;
        topCategories: { name: string, value: number }[];
        totals: { fixed: number; variable: number; };
    } | null>(null);
    const [exportTransactions, setExportTransactions] = useState<Transaction[]>([]);

    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long' });

    useEffect(() => {
        if (isOpen && userId) {
            generateReport();
        }
    }, [isOpen, userId, currentMonth, currentYear]);

    const generateReport = async () => {
        setLoading(true);
        try {
            // 1. Gather Data specifically for the report month
            const context = await DBService.getFinancialContext(userId);
            // Note: getFinancialContext gets recent data. We might want to filter strictly for this month 
            // but for the AI analysis, context is good.
            // Let's filter manually for the numeric report data to be precise.

            const investments = await DBService.getInvestments(userId);
            const allTransactions = await DBService.getTransactions(userId);

            const monthTransactions = allTransactions.filter(t => {
                const d = new Date(t.date + 'T12:00:00');
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            setExportTransactions(monthTransactions);

            const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            // Top Categories
            const catMap: Record<string, number> = {};
            monthTransactions.filter(t => t.type === 'expense').forEach(t => {
                catMap[t.category] = (catMap[t.category] || 0) + t.amount;
            });
            const topCategories = Object.entries(catMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            setReportData({
                income,
                expense,
                balance: income - expense,
                topCategories,
                totals: { fixed: 0, variable: 0 } // Placeholder if needed
            });

            // 2. Call AI
            const { data, error } = await supabase.functions.invoke('financial-advisor', {
                body: {
                    message: `Generate a detailed financial report for ${monthName}/${currentYear} in Brazilian Portuguese (Markdown).
                        
                        Data:
                        - Income: ${income}
                        - Expenses: ${expense}
                        - Balance: ${income - expense}
                        - Top Expenses: ${JSON.stringify(topCategories)}
                        - Investments Total: ${investments.reduce((sum, i) => sum + (i.currentValue || i.amount), 0)}
                        
                        Structure:
                        1. **Resumo Executivo**: 2-3 lines summary.
                        2. **Destaques Positivos**: What went well?
                        3. **Pontos de Atenção**: Where to save?
                        4. **Recomendação**: 1 actionable tip.
                        
                        Keep it professional, encouraging, and concise.`,
                    context: context // Pass context for broader awareness if needed
                }
            });

            if (error) throw error;
            setAnalysis(data.reply);

        } catch (err) {
            console.error('Error generating report:', err);
            setAnalysis('Não foi possível gerar a análise automática neste momento. Por favor, tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">

            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:w-full print:max-w-none">

                {/* Header (No Print) */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <FileText className="text-blue-600" size={20} /> Relatório Mensal
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">
                            <Printer size={16} /> Imprimir / PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Sub-Header Actions (CSV) */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-end print:hidden">
                    <button
                        onClick={() => exportToCSV(exportTransactions)}
                        disabled={loading || exportTransactions.length === 0}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                        <FileText size={14} /> Baixar dados em CSV (Excel)
                    </button>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible custom-scrollbar print:text-black">

                    {/* Report Header */}
                    <div className="text-center mb-10 border-b-2 border-slate-800 pb-6 print:border-black">
                        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-800 dark:text-white print:text-black mb-2">Relatório Financeiro</h1>
                        <p className="text-lg text-slate-500 print:text-gray-600 font-bold">{monthName} de {currentYear}</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <p className="text-slate-500 animate-pulse font-medium">Analisando suas finanças com IA...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* Key Metrics Row */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 rounded-xl border border-slate-100 print:border-gray-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Receitas</p>
                                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(reportData?.income || 0, currency)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 rounded-xl border border-slate-100 print:border-gray-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Despesas</p>
                                    <p className="text-2xl font-black text-rose-600">{formatCurrency(reportData?.expense || 0, currency)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 rounded-xl border border-slate-100 print:border-gray-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Saldo</p>
                                    <p className={`text-2xl font-black ${(reportData?.balance || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                        {formatCurrency(reportData?.balance || 0, currency)}
                                    </p>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:grid-cols-2">
                                {/* Top Expenses Table */}
                                <div>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 print:text-black mb-4 border-l-4 border-blue-500 pl-3">Maiores Gastos</h3>
                                    <div className="space-y-3">
                                        {reportData?.topCategories.map((cat, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 print:bg-white border-b border-gray-100 print:border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-slate-200 text-slate-600 w-5 h-5 flex items-center justify-center rounded-full">{i + 1}</span>
                                                    <span className="text-sm font-medium text-slate-700 print:text-black">{cat.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 print:text-black">{formatCurrency(cat.value, currency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Allocation Chart (Simple visual for print) */}
                                <div>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 print:text-black mb-4 border-l-4 border-rose-500 pl-3">Distribuição</h3>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={reportData?.topCategories}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={60}
                                                    fill="#8884d8"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {reportData?.topCategories.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* AI Analysis Analysis */}
                            <div className="mt-8">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 print:text-black mb-4 flex items-center gap-2">
                                    <Sparkles className="text-amber-500" size={18} /> Análise Inteligente
                                </h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/30 print:bg-white p-6 rounded-xl border border-slate-100 dark:border-slate-800 print:border-none print:p-0">
                                    {analysis.split('\n').map((line, i) => (
                                        <p key={i} className={`mb-2 text-slate-600 dark:text-slate-300 print:text-black ${line.startsWith('#') ? 'font-black text-lg mt-4 text-slate-800 dark:text-white print:text-black' : ''} ${line.startsWith('*') ? 'pl-4' : ''}`}>
                                            {line.replace(/\*\*/g, '').replace(/#/g, '')}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-200 print:flex flex-col items-center justify-center hidden">
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Finance Pro 360</p>
                                <p className="text-xs text-slate-400">Gerado automaticamente em {new Date().toLocaleDateString()}</p>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <style type="text/css" media="print">{`
                @page { size: A4; margin: 20mm; }
                body { visibility: hidden; }
                .fixed { position: static; overflow: visible; }
                .bg-black\\/60 { background: none; }
                .print\\:hidden { display: none !important; }
                .print\\:block { display: block !important; }
                .print\\:p-0 { padding: 0 !important; }
                .print\\:bg-white { background-color: white !important; }
                .print\\:shadow-none { box-shadow: none !important; }
                .print\\:border-none { border: none !important; }
                .print\\:text-black { color: black !important; }
                .print\\:static { position: static !important; }
                .print\\:max-h-none { max-height: none !important; }
                .print\\:w-full { width: 100% !important; }
                .print\\:max-w-none { max-width: none !important; }
                .print\\:border-gray-200 { border-color: #e2e8f0 !important; }
                /* Show only the modal content 
                   Note: The strategy is to hide body and show specific element, 
                   but since component is in a portal or overlay, we rely on standard print media queries 
                   inside the component classes */
                
                /* Force background graphics for charts */
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            `}</style>
        </div>
    );
};
