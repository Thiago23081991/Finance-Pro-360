import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, AppConfig, CreditCard } from '../types';
import { formatCurrency, formatDateRaw, generateId } from '../utils';
import { CreditCard as CardIcon, Calendar, TrendingUp, AlertCircle, ShoppingBag, Plus, Save, X, Trash2, Edit2, Settings, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { DBService } from '../db';

interface CreditCardControlProps {
    transactions: Transaction[];
    onAdd: (transaction: Transaction) => void;
    onAddBatch: (transactions: Transaction[]) => void;
    onDelete: (id: string) => void;
    config: AppConfig; // Need config to save cards
    onUpdateConfig: (newConfig: AppConfig) => void;
    currency?: string;
}

const CARD_COLORS = [
    'from-slate-700 to-slate-900',
    'from-purple-700 to-purple-900',
    'from-blue-700 to-blue-900',
    'from-emerald-700 to-emerald-900',
    'from-rose-700 to-rose-900',
    'from-amber-700 to-amber-900',
];

export const CreditCardControl: React.FC<CreditCardControlProps> = ({ transactions, onAdd, onAddBatch, onDelete, config, onUpdateConfig, currency = 'BRL' }) => {
    // --- MULTI-CARD STATE ---
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [activeCardId, setActiveCardId] = useState<string>('');
    const [showCardModal, setShowCardModal] = useState(false);

    // New Card Form State
    const [newCardName, setNewCardName] = useState('');
    const [newCardDueDay, setNewCardDueDay] = useState(10);
    const [newCardClosingDay, setNewCardClosingDay] = useState(3);
    const [newCardLimit, setNewCardLimit] = useState(5000);
    const [newCardColor, setNewCardColor] = useState(CARD_COLORS[0]);

    // Initialize Cards from Config or Default
    useEffect(() => {
        if (config.creditCards && config.creditCards.length > 0) {
            setCards(config.creditCards);
            if (!activeCardId) setActiveCardId(config.creditCards[0].id);
        } else {
            // Migration / Default: Create a "Default" card
            const defaultCard: CreditCard = {
                id: 'default-card',
                name: localStorage.getItem('finance_pro_credit_card_name') || 'Meu Cartão',
                dueDay: config.creditCardDueDate || 10,
                closingDay: (config.creditCardDueDate || 10) - 7,
                limit: 10000,
                color: CARD_COLORS[1]
            };
            setCards([defaultCard]);
            setActiveCardId(defaultCard.id);
        }
    }, [config]);

    const activeCard = useMemo(() => cards.find(c => c.id === activeCardId) || cards[0], [cards, activeCardId]);

    const handleSaveCard = () => {
        if (!newCardName) return;

        const newCard: CreditCard = {
            id: generateId(),
            name: newCardName,
            dueDay: newCardDueDay,
            closingDay: newCardClosingDay,
            limit: newCardLimit,
            color: newCardColor
        };

        const updatedCards = [...cards, newCard];
        setCards(updatedCards);
        onUpdateConfig({ ...config, creditCards: updatedCards });
        setActiveCardId(newCard.id);
        setShowCardModal(false);
        resetCardForm();
    };

    const handleDeleteCard = (id: string) => {
        if (cards.length <= 1) {
            alert("Você precisa ter pelo menos um cartão.");
            return;
        }
        const updatedCards = cards.filter(c => c.id !== id);
        setCards(updatedCards);
        onUpdateConfig({ ...config, creditCards: updatedCards });
        setActiveCardId(updatedCards[0].id);
    };

    const resetCardForm = () => {
        setNewCardName('');
        setNewCardDueDay(10);
        setNewCardLimit(5000);
        setNewCardColor(CARD_COLORS[0]);
    };

    // --- TRANSACTION LOGIC ---
    const [isAdding, setIsAdding] = useState(false);
    const categories = config.expenseCategories || ['Alimentação', 'Transporte', 'Lazer', 'Serviços', 'Compras'];
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [newCategory, setNewCategory] = useState(categories[0] || '');
    const [newDesc, setNewDesc] = useState('');
    const [installments, setInstallments] = useState(1);

    // Ensure categories update if props change
    useEffect(() => {
        if (categories.length > 0 && !newCategory) {
            setNewCategory(categories[0]);
        }
    }, [categories]);

    // FILTER TRANSACTIONS FOR ACTIVE CARD
    const cardTransactions = useMemo(() => {
        if (!activeCard) return [];
        return transactions.filter(t => {
            // Include if explicitly linked to this card
            if (t.cardId === activeCard.id) return true;
            // LEGACY: If no cardId, but payment is 'Crédito', assume it belongs to the FIRST/DEFAULT card
            // ONLY if this IS the default card (first in list or specific ID)
            if (!t.cardId && (t.paymentMethod === 'Crédito' || t.paymentMethod === 'Cartão de Crédito') && activeCard.id === cards[0]?.id) return true;
            return false;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, activeCard, cards]);

    const stats = useMemo(() => {
        if (!activeCard) return { currentInvoice: 0, totalLimitUsed: 0 };

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let invoiceTotal = 0;
        let totalUsed = 0;

        cardTransactions.forEach(t => {
            if (t.type === 'expense') {
                totalUsed += t.amount;
                const tDate = new Date(t.date + 'T12:00:00');
                if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                    invoiceTotal += t.amount;
                }
            }
        });

        return {
            currentInvoice: invoiceTotal,
            totalLimitUsed: totalUsed
        };
    }, [cardTransactions, activeCard]);

    // Due Date Visual Status
    const dueDateStatus = useMemo(() => {
        if (!activeCard) return null;

        const today = new Date();
        const dueDay = activeCard.dueDay;

        let nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        const todayZero = new Date(today);
        todayZero.setHours(0, 0, 0, 0);

        if (todayZero > nextDueDate) {
            nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
        }

        const diffTime = nextDueDate.getTime() - todayZero.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { label: 'Vence HOJE!', color: 'bg-rose-500 text-white animate-pulse' };
        if (diffDays <= 3) return { label: `Vence em ${diffDays} dias`, color: 'bg-rose-100 text-rose-600 border-rose-200' };
        if (diffDays <= 7) return { label: `Vence em ${diffDays} dias`, color: 'bg-amber-100 text-amber-600 border-amber-200' };

        return { label: `Vence dia ${dueDay}`, color: 'bg-white/20 text-white border-white/20' };
    }, [activeCard]);


    const handleSave = () => {
        if (!amount || !newDesc || !activeCard) return;

        const val = parseFloat(amount.replace(',', '.'));
        const installmentValue = val / installments; // Standard division

        // BATCH PROCESSING
        const newTransactions: Transaction[] = [];

        for (let i = 0; i < installments; i++) {
            // Calculate date for each installment
            const d = new Date(date + 'T12:00:00');
            d.setMonth(d.getMonth() + i);

            // Adjust for end of month overflow
            // If date was 31st, but next month has 30 days, setMonth might skip.
            // Simplified logic usually acceptable for MVP, but can rely on JS Date handling.

            newTransactions.push({
                id: generateId(),
                userId: config.userId || 'anon',
                date: d.toISOString().split('T')[0],
                amount: parseFloat(installmentValue.toFixed(2)),
                category: newCategory,
                description: installments > 1 ? `${newDesc} (${i + 1}/${installments})` : newDesc,
                type: 'expense',
                paymentMethod: 'Crédito', // Legacy support
                cardId: activeCard.id // LINK TO CARD
            });
        }

        onAddBatch(newTransactions);

        setAmount('');
        setNewDesc('');
        setInstallments(1);
        setIsAdding(false);
    };

    if (!activeCard) return <div className="p-10 text-center text-slate-500">Carregando cartões...</div>;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm flex flex-col h-[calc(100vh-140px)] transition-colors animate-fade-in overflow-hidden">

            {/* Header / Dashboard Area */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Visual Card Carousel */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                        {cards.map(card => (
                            <button
                                key={card.id}
                                onClick={() => setActiveCardId(card.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap snap-start ${activeCardId === card.id
                                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-105'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {card.name}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowCardModal(true)}
                            className="shrink-0 px-2 py-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className={`relative h-48 w-full max-w-sm rounded-xl bg-gradient-to-br ${activeCard.color} text-white shadow-xl overflow-hidden mx-auto md:mx-0 transition-transform hover:scale-[1.02] duration-300`}>
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <CardIcon className="text-white/80" size={24} />
                                    <span className="text-xs font-semibold tracking-widest uppercase text-white/60">Finanças Pro</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono text-sm tracking-widest opacity-70">**** {activeCard.id.slice(0, 4)}</span>
                                    {cards.length > 1 && (
                                        <button onClick={() => handleDeleteCard(activeCard.id)} className="mt-1 text-white/40 hover:text-white transition-colors" title="Excluir Cartão">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <p className="text-xs text-white/60 mb-1">Fatura Atual</p>
                                    {dueDateStatus && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${dueDateStatus.color}`}>
                                            {dueDateStatus.label}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">{formatCurrency(stats.currentInvoice, currency)}</h3>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-white/60 uppercase">Titular</p>
                                    <p className="text-sm font-medium tracking-wide">{activeCard.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-white/60 uppercase">Limite Disp.</p>
                                    <p className="text-sm font-medium tracking-wide">{formatCurrency(activeCard.limit - stats.currentInvoice, currency)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats & Quick Actions */}
                <div className="flex flex-col justify-between">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-500 uppercase">Fatura Atual</h4>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Aberta</span>
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">{formatCurrency(stats.currentInvoice, currency)}</h2>
                        <p className="text-xs text-slate-400">Fecha dia {activeCard.closingDay}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Plus size={18} /> Novo Gasto
                        </button>
                        <button className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-3 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all">
                            Pagar Fatura
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {cardTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <ShoppingBag size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma compra neste cartão.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cardTransactions.map(t => (
                            <div key={t.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{formatDateRaw(t.date)}</span>
                                            <span>•</span>
                                            <span>{t.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 relative">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 block text-right">
                                        {formatCurrency(t.amount, currency)}
                                    </span>
                                    <button
                                        onClick={() => onDelete(t.id)}
                                        className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Transaction Overlay */}
            {isAdding && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-xl p-6 shadow-md animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus className="text-indigo-500" /> Nova Compra - {activeCard.name}
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                                <input
                                    type="text"
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="Ex: Almoço, Uber, iFood..."
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Valor</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
                                    <select
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Parcelas</label>
                                    <select
                                        value={installments}
                                        onChange={e => setInstallments(Number(e.target.value))}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map(n => (
                                            <option key={n} value={n}>{n}x {n > 1 ? 'sem juros' : 'à vista'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!amount || !newDesc}
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Compra
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Card Modal */}
            {showCardModal && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white">Adicionar Novo Cartão</h3>
                            <button onClick={() => setShowCardModal(false)}><X size={20} className="text-slate-400" /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Nome do Cartão (Apelido)</label>
                                <input
                                    type="text"
                                    value={newCardName}
                                    onChange={e => setNewCardName(e.target.value)}
                                    placeholder="Ex: Nubank, Visa Black..."
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Dia Venc.</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={newCardDueDay}
                                        onChange={e => setNewCardDueDay(Number(e.target.value))}
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Fechamento</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={newCardClosingDay}
                                        onChange={e => setNewCardClosingDay(Number(e.target.value))}
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg mt-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Limite</label>
                                <input
                                    type="number"
                                    value={newCardLimit}
                                    onChange={e => setNewCardLimit(Number(e.target.value))}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Cor (Estilo)</label>
                                <div className="flex gap-2 flex-wrap">
                                    {CARD_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewCardColor(color)}
                                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} ${newCardColor === color ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleSaveCard}
                                className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg mt-2 hover:bg-indigo-700"
                            >
                                Criar Cartão
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
