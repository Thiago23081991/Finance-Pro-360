import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Calculator, ArrowRight, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Transaction } from '../types';

interface ProspectingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentIncome: number;
    recurringExpenses: number; // Pre-calculated fixed costs from Dashboard
    currency?: string;
}

interface SimulatedDebt {
    id: string;
    name: string;
    totalValue: number;
    installments: number;
}

export const ProspectingModal: React.FC<ProspectingModalProps> = ({
    isOpen,
    onClose,
    currentIncome,
    recurringExpenses,
    currency = 'BRL'
}) => {
    const [simulatedIncome, setSimulatedIncome] = useState<number>(currentIncome);
    const [debts, setDebts] = useState<SimulatedDebt[]>([]);

    // New Debt Form State
    const [newName, setNewName] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newInstallments, setNewInstallments] = useState('12');

    useEffect(() => {
        if (isOpen) {
            setSimulatedIncome(currentIncome);
            setDebts([]);
            setNewName('');
            setNewValue('');
            setNewInstallments('12');
        }
    }, [isOpen, currentIncome]);

    const handleAddDebt = () => {
        if (!newName || !newValue || !newInstallments) return;

        const val = parseFloat(newValue.replace(',', '.'));
        const inst = parseInt(newInstallments);

        if (isNaN(val) || isNaN(inst) || inst <= 0) return;

        const newDebt: SimulatedDebt = {
            id: Math.random().toString(36).substr(2, 9),
            name: newName,
            totalValue: val,
            installments: inst
        };

        setDebts([...debts, newDebt]);
        setNewName('');
        setNewValue('');
        setNewInstallments('12');
    };

    const removeDebt = (id: string) => {
        setDebts(debts.filter(d => d.id !== id));
    };

    const simulationResults = useMemo(() => {
        const newMonthlyDebts = debts.reduce((acc, debt) => {
            return acc + (debt.totalValue / debt.installments);
        }, 0);

        const projectedBalance = simulatedIncome - recurringExpenses - newMonthlyDebts;
        const totalCompromised = recurringExpenses + newMonthlyDebts;
        const compromisedPct = simulatedIncome > 0 ? (totalCompromised / simulatedIncome) * 100 : 0;

        return {
            newMonthlyDebts,
            projectedBalance,
            totalCompromised,
            compromisedPct
        };
    }, [simulatedIncome, recurringExpenses, debts]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
                            Simulador de Cenários
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Projete como novas compras impactam seu futuro.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* 1. Income Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">1</span>
                            Sua Renda Esperada
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Renda Mensal Líquida</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                    <input
                                        type="number"
                                        value={simulatedIncome}
                                        onChange={(e) => setSimulatedIncome(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 mb-1">Custos Fixos Atuais</p>
                                <p className="text-lg font-bold text-rose-500">-{formatCurrency(recurringExpenses, currency)}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Add Simulations */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                            Simular Novas Dívidas
                        </h3>

                        <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 w-full">
                                <label className="text-xs font-medium text-slate-500 ml-1">Descrição</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Novo iPhone, Viagem..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="w-full sm:w-32">
                                <label className="text-xs font-medium text-slate-500 ml-1">Valor Total</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="w-full sm:w-24">
                                <label className="text-xs font-medium text-slate-500 ml-1">Parcelas</label>
                                <input
                                    type="number"
                                    placeholder="12"
                                    value={newInstallments}
                                    onChange={(e) => setNewInstallments(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={handleAddDebt}
                                disabled={!newName || !newValue || !newInstallments}
                                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={18} /> <span className="sm:hidden">Adicionar</span>
                            </button>
                        </div>

                        {debts.length > 0 && (
                            <div className="space-y-2">
                                {debts.map(debt => (
                                    <div key={debt.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg animate-fade-in-up">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                                <TrendingDown size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">{debt.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    Total: {formatCurrency(debt.totalValue, currency)} em {debt.installments}x
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-rose-500 text-sm">
                                                    -{formatCurrency(debt.totalValue / debt.installments, currency)}/mês
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeDebt(debt.id)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer with Results */}
                <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">Impacto das Simulações</p>
                            <p className="text-lg font-bold text-rose-500">
                                -{formatCurrency(simulationResults.newMonthlyDebts, currency)}
                                <span className="text-xs font-normal text-slate-400 ml-1">/mês a mais</span>
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl border flex flex-col justify-center ${simulationResults.projectedBalance >= 0
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
                                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30'
                            }`}>
                            <p className="text-xs font-bold uppercase opacity-60 mb-1 tracking-wider">
                                Saldo Previsto (Sobra)
                            </p>
                            <p className={`text-xl font-black ${simulationResults.projectedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                {formatCurrency(simulationResults.projectedBalance, currency)}
                            </p>
                        </div>
                    </div>

                    {simulationResults.compromisedPct > 70 && (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                            <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                <strong>Cuidado:</strong> Com essas novas dívidas e seus custos fixos, você comprometerá
                                <strong> {simulationResults.compromisedPct.toFixed(0)}%</strong> da sua renda. O recomendado é manter abaixo de 60-70%.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
