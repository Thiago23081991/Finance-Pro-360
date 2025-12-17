
import React, { useState, useEffect, useMemo } from 'react';
import { AppConfig, Debt } from '../types';
import { Lock, Crown, CheckCircle, Plus, Trash2, TrendingUp, AlertOctagon, Info, ArrowRight, Scale, Calculator, Loader2, ArrowUp, ArrowDown, List, Sparkles, Snowflake, Flame } from 'lucide-react';
import { formatCurrency, generateId } from '../utils';

interface DebtsProps {
    config: AppConfig;
    debts: Debt[];
    onAddDebt: (d: Debt) => Promise<void>;
    onDeleteDebt: (id: string) => void;
    onNavigateToSettings: () => void;
}

export const Debts: React.FC<DebtsProps> = ({ config, debts, onAddDebt, onDeleteDebt, onNavigateToSettings }) => {
    const isPremium = config.licenseStatus === 'active';
    const currency = config.currency || 'BRL';
    
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Sort Mode State
    const [sortMode, setSortMode] = useState<'smart' | 'manual'>('smart');
    // Strategy State: 'avalanche' (Interest Rate) or 'snowball' (Lowest Balance)
    const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
    
    // Local state to force re-render when local storage updates
    const [manualOrderTrigger, setManualOrderTrigger] = useState(0); 
    
    // Form States
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState<Debt['category']>('outro');

    // --- PRIORITIZATION LOGIC (SMART) ---
    const smartList = useMemo(() => {
        const sorted = [...debts];
        if (strategy === 'avalanche') {
            // Avalanche: Sort by Interest Rate (Desc), then Amount
            return sorted.sort((a, b) => {
                if (b.interestRate !== a.interestRate) return b.interestRate - a.interestRate;
                return a.totalAmount - b.totalAmount;
            });
        } else {
            // Snowball: Sort by Total Amount (Asc) - Ignore interest rate
            return sorted.sort((a, b) => a.totalAmount - b.totalAmount);
        }
    }, [debts, strategy]);

    // --- MANUAL SORT LOGIC ---
    const manualList = useMemo(() => {
        const savedOrderKey = `fp360_debt_order_${config.userId}`;
        const savedOrderStr = localStorage.getItem(savedOrderKey);
        const savedOrder: string[] = savedOrderStr ? JSON.parse(savedOrderStr) : [];

        if (savedOrder.length === 0) return [...debts]; // Default to insertion order if no save

        return [...debts].sort((a, b) => {
            const idxA = savedOrder.indexOf(a.id);
            const idxB = savedOrder.indexOf(b.id);
            
            // If both exist in saved order, use that
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            // If one exists, it goes first
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            // If neither (new items), go to bottom
            return 0; 
        });
    }, [debts, config.userId, manualOrderTrigger]);

    // Determine which list to show
    const displayList = sortMode === 'smart' ? smartList : manualList;
    const topPriority = smartList.length > 0 ? smartList[0] : null;

    const handleMove = (id: string, direction: 'up' | 'down') => {
        const currentList = [...manualList];
        const index = currentList.findIndex(d => d.id === id);
        if (index === -1) return;

        const newList = [...currentList];
        if (direction === 'up' && index > 0) {
            [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
        } else if (direction === 'down' && index < newList.length - 1) {
            [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        }

        // Save new order IDs to local storage
        const newOrderIds = newList.map(d => d.id);
        localStorage.setItem(`fp360_debt_order_${config.userId}`, JSON.stringify(newOrderIds));
        setManualOrderTrigger(prev => prev + 1); // Trigger re-render
    };

    const handleSave = async () => {
        if (!name || !amount || !rate) {
            alert("Por favor, preencha todos os campos obrigatórios (Nome, Valor e Juros).");
            return;
        }

        setIsSaving(true);
        try {
            const cleanAmount = parseFloat(amount.replace(',', '.'));
            const cleanRate = parseFloat(rate.replace(',', '.'));

            if (isNaN(cleanAmount) || isNaN(cleanRate)) {
                alert("Valores inválidos. Use apenas números.");
                return;
            }

            const newDebt: Debt = {
                id: generateId(),
                userId: config.userId || '',
                name,
                totalAmount: cleanAmount,
                interestRate: cleanRate,
                dueDate,
                category
            };
            
            await onAddDebt(newDebt);
            
            setIsAdding(false);
            setName('');
            setAmount('');
            setRate('');
            setDueDate('');
            setCategory('outro');
        } catch (error: any) {
            console.error("Erro ao salvar dívida:", error);
            alert("Erro ao salvar: " + (error.message || "Tente novamente."));
        } finally {
            setIsSaving(false);
        }
    };

    // --- PREMIUM LOCK SCREEN ---
    if (!isPremium) {
        return (
            <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600"></div>
                <div className="text-center max-w-lg z-10 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-rose-600 dark:text-rose-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-center gap-2">
                        Gestão de Dívidas <Crown size={24} className="text-amber-500" />
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Recurso exclusivo Premium para ajudar você a sair do vermelho e limpar seu nome no Serasa.
                    </p>
                    <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Calculadora de Prioridade:</strong> A IA analisa suas dívidas e diz qual pagar primeiro para economizar juros.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Controle de Negativação:</strong> Organize pendências do Serasa, Bancos e Cartões.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Plano de Quitação:</strong> Estratégia matemática para liberdade financeira.</span>
                        </li>
                    </ul>
                    <button 
                        onClick={onNavigateToSettings}
                        className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-500/30 transition-all transform hover:scale-105"
                    >
                        Quero Organizar Minhas Dívidas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Scale className="text-rose-600" /> Gestão de Passivos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Cadastre suas pendências (Serasa, Bancos, etc) e receba um plano de ação.
                    </p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Nova Dívida
                    </button>
                )}
            </div>

            {/* Controls Bar: Sort Mode & Strategy */}
            {debts.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setSortMode('smart')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${
                                sortMode === 'smart' 
                                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <Sparkles size={14} />
                            IA
                        </button>
                        <button
                            onClick={() => setSortMode('manual')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${
                                sortMode === 'manual' 
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <List size={14} />
                            Manual
                        </button>
                    </div>

                    {sortMode === 'smart' && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Método:</span>
                            <select
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value as any)}
                                className="text-xs font-medium bg-transparent text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                            >
                                <option value="avalanche">Avalanche (Matemático)</option>
                                <option value="snowball">Bola de Neve (Psicológico)</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* THE "NORTH" - AI RECOMMENDATION (Visible in Smart Mode) */}
            {debts.length > 0 && topPriority && sortMode === 'smart' && (
                <div className={`rounded-xl p-6 text-white shadow-xl border relative overflow-hidden animate-fade-in ${
                    strategy === 'avalanche' 
                    ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700' 
                    : 'bg-gradient-to-r from-blue-800 to-indigo-900 border-blue-700'
                }`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-full shrink-0 animate-pulse">
                            {strategy === 'avalanche' ? <Calculator size={32} className="text-amber-400" /> : <Snowflake size={32} className="text-cyan-300" />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`${strategy === 'avalanche' ? 'text-amber-400' : 'text-cyan-300'} font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2`}>
                                <TrendingUp size={14} /> Recomendação Inteligente (O Norte)
                            </h3>
                            <h4 className="text-xl font-bold mb-2">
                                Foque em quitar: <span className="text-white border-b-2 border-white/30">{topPriority.name}</span>
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {strategy === 'avalanche' 
                                    ? <span>Esta dívida possui a maior taxa de juros (<strong>{topPriority.interestRate}% a.m.</strong>). Matematicamente, eliminá-la primeiro fará você economizar mais dinheiro (Método Avalanche).</span>
                                    : <span>Esta é a sua dívida de <strong>menor valor</strong>. Quitá-la rapidamente vai liberar seu fluxo de caixa e criar um efeito psicológico de vitória imediata (Método Bola de Neve).</span>
                                }
                            </p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg text-center min-w-[120px]">
                            <p className="text-xs text-slate-400 uppercase">Valor Atual</p>
                            <p className="text-lg font-mono font-bold">{formatCurrency(topPriority.totalAmount, currency)}</p>
                        </div>
                    </div>
                    {/* Decorative */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none ${strategy === 'avalanche' ? 'bg-rose-500/20' : 'bg-cyan-500/20'}`}></div>
                </div>
            )}

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertOctagon className="text-rose-500" size={18} /> Cadastrar Nova Dívida
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Credor / Descrição *</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: Negativação Serasa - Banco X"
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:border-rose-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor Total ({currency}) *</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:border-rose-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Juros Mensal (%) *</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    placeholder="Ex: 12.5"
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:border-rose-500 outline-none"
                                />
                                <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Categoria</label>
                             <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:border-rose-500 outline-none"
                             >
                                <option value="banco">Empréstimo Bancário</option>
                                <option value="cartao">Cartão de Crédito</option>
                                <option value="servico">Contas (Luz/Água/Tel)</option>
                                <option value="emprestimo">Agiota / Pessoal</option>
                                <option value="outro">Outros (Serasa)</option>
                             </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-sm font-bold transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded text-sm font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                            {isSaving ? 'Salvando...' : 'Salvar Dívida'}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        {sortMode === 'smart' 
                            ? (strategy === 'avalanche' ? <><Flame size={16} className="text-orange-500"/> Plano Avalanche</> : <><Snowflake size={16} className="text-cyan-500"/> Plano Bola de Neve</>)
                            : 'Sua Lista Personalizada'
                        }
                    </h3>
                    <span className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded font-bold">
                        Total: {formatCurrency(debts.reduce((acc, curr) => acc + curr.totalAmount, 0), currency)}
                    </span>
                </div>
                
                {displayList.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 dark:text-slate-500">
                        <CheckCircle size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhuma dívida cadastrada. Parabéns!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {displayList.map((debt, index) => (
                            <div key={debt.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between group relative animate-fade-in">
                                {sortMode === 'smart' && index === 0 && (
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${strategy === 'avalanche' ? 'bg-amber-400' : 'bg-cyan-400'}`}></div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                        sortMode === 'smart' && index === 0 
                                        ? (strategy === 'avalanche' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-cyan-100 text-cyan-700 ring-2 ring-cyan-400')
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {index + 1}º
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            {debt.name}
                                            {sortMode === 'smart' && index === 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                strategy === 'avalanche' 
                                                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                                : 'bg-cyan-100 text-cyan-700 border-cyan-200'
                                            }`}>
                                                {strategy === 'avalanche' ? 'Prioridade Máxima' : 'Vitória Rápida'}
                                            </span>}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                                <TrendingUp size={12} /> Juros: {debt.interestRate}% a.m.
                                            </span>
                                            <span>•</span>
                                            <span className="capitalize">{debt.category}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-6">
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                        {formatCurrency(debt.totalAmount, currency)}
                                    </span>
                                    
                                    {/* Manual Sort Controls */}
                                    {sortMode === 'manual' && (
                                        <div className="flex flex-col gap-1 mr-2">
                                            <button 
                                                onClick={() => handleMove(debt.id, 'up')}
                                                disabled={index === 0}
                                                className="p-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ArrowUp size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleMove(debt.id, 'down')}
                                                disabled={index === displayList.length - 1}
                                                className="p-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ArrowDown size={12} />
                                            </button>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => onDeleteDebt(debt.id)}
                                        className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                                        title="Excluir (Pago)"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {debts.length > 0 && sortMode === 'smart' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-3">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <p>
                        <strong>Dica:</strong> Você pode alternar entre <strong>Avalanche</strong> (Matemática) e <strong>Bola de Neve</strong> (Psicologia) usando o seletor acima para ver qual plano se adapta melhor à sua realidade.
                    </p>
                </div>
            )}
        </div>
    );
};
