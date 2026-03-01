import React from 'react';
import { ForecastItem } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils';

interface CashFlowChartProps {
    data: { date: string, balance: number }[];
    predictedItems: ForecastItem[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, predictedItems }) => {

    // Find critical points
    const minBalance = Math.min(...data.map(d => d.balance));
    const finalBalance = data.length > 0 ? data[data.length - 1].balance : 0;
    const isNegativeRisk = minBalance < 0;

    const riskItems = predictedItems.filter(i => i.status === 'predicted' && i.amount > 500); // Highlight big predicted bills

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {isNegativeRisk ? <TrendingDown className="text-rose-500" /> : <TrendingUp className="text-emerald-500" />}
                        Previsão de Fluxo (90 dias)
                    </h3>
                    <p className="text-sm text-slate-500">
                        {isNegativeRisk
                            ? "Atenção: Risco de saldo negativo detectado."
                            : "Sua saúde financeira parece estável para os próximos meses."}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isNegativeRisk ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isNegativeRisk ? 'ALERTA' : 'ESTÁVEL'}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isNegativeRisk ? "#f43f5e" : "#10b981"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={isNegativeRisk ? "#f43f5e" : "#10b981"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                            formatter={(val: number) => formatCurrency(val)}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', backgroundColor: 'var(--color-surface, #ffffff)' }}
                        />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke={isNegativeRisk ? "#f43f5e" : "#10b981"}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Smart Alerts */}
            {riskItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas de Contas Futuras</h4>
                    {riskItems.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <AlertTriangle size={14} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Provável {item.description}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    Previsto para {new Date(item.date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                                ~{formatCurrency(item.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
