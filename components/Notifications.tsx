import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { Transaction, Goal, Debt, AppConfig } from '../types';
import { formatCurrency } from '../utils';

interface Notification {
    id: string;
    type: 'warning' | 'success' | 'info';
    title: string;
    message: string;
    date: Date;
    read: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

interface NotificationsProps {
    transactions: Transaction[];
    goals: Goal[];
    debts: Debt[];
    config: AppConfig;
    onNavigate: (tab: any) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ transactions, goals, debts, config, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // GERAR NOTIFICAÇÕES
    useEffect(() => {
        const newNotifications: Notification[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. DÍVIDAS E CONTAS A PAGAR PRÓXIMAS (3 DIAS)
        debts.forEach(debt => {
            if (debt.dueDate) { // Assumindo que dueDate é string YYYY-MM-DD
                const due = new Date(debt.dueDate + 'T12:00:00');
                const diffTime = due.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 3) {
                    newNotifications.push({
                        id: `debt-${debt.id}`,
                        type: 'warning',
                        title: diffDays === 0 ? 'Vence Hoje!' : 'Vence em Breve',
                        message: `A conta "${debt.name}" no valor de ${formatCurrency(debt.totalAmount, config.currency)} vence ${diffDays === 0 ? 'hoje' : `em ${diffDays} dias`}.`,
                        date: new Date(),
                        read: false,
                        actionLabel: 'Ver Dívidas',
                        onAction: () => onNavigate('dividas')
                    });
                }
            }
        });

        // 2. CONTA DE CARTÃO (SE CONFIGURADA)
        if (config.creditCardDueDate) {
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const dueDay = config.creditCardDueDate;
            let nextDueDate = new Date(currentYear, currentMonth, dueDay);

            if (today > nextDueDate) {
                nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
            }

            const diffTime = nextDueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 3) {
                newNotifications.push({
                    id: `cc-due-${currentMonth}`,
                    type: 'warning',
                    title: 'Fatura do Cartão',
                    message: `Sua fatura vence ${diffDays === 0 ? 'hoje' : `em ${diffDays} dias`}. Verifique seus gastos.`,
                    date: new Date(),
                    read: false,
                    actionLabel: 'Ver Extrato',
                    onAction: () => onNavigate('despesas')
                });
            }
        }

        // 3. METAS ATINGIDAS
        goals.forEach(goal => {
            if (goal.status === 'Em andamento' && goal.currentValue >= goal.targetValue) {
                newNotifications.push({
                    id: `goal-${goal.id}`,
                    type: 'success',
                    title: 'Meta Atingida! 🎉',
                    message: `Parabéns! Você alcançou o objetivo "${goal.name}".`,
                    date: new Date(),
                    read: false,
                    actionLabel: 'Ver Metas',
                    onAction: () => onNavigate('metas')
                });
            }
        });

        setNotifications(newNotifications);
        setUnreadCount(newNotifications.length);

    }, [debts, goals, config, transactions]);

    const handleToggle = () => setIsOpen(!isOpen);

    const markAsRead = (id: string) => {
        // Logica visual apenas por enquanto
        // Idealmente chamaria DBService para persistir
    };

    if (notifications.length === 0) {
        return (
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors relative opacity-50 cursor-not-allowed">
                <Bell size={20} />
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={`p-2 rounded-full transition-colors relative ${isOpen ? 'bg-slate-100 dark:bg-slate-800 text-brand-blue dark:text-brand-gold' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-bounce-slow' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-fade-in-down">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white">Notificações</h3>
                        <span className="text-xs text-slate-400">{notifications.length} novos</span>
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {notifications.map((notif, i) => (
                            <div key={i} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-3 relative group">
                                <div className={`mt-1 p-1.5 rounded-full shrink-0 h-fit ${notif.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                        notif.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            'bg-blue-100 text-blue-600'
                                    }`}>
                                    {notif.type === 'warning' ? <AlertTriangle size={14} /> :
                                        notif.type === 'success' ? <CheckCircle2 size={14} /> :
                                            <TrendingUp size={14} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{notif.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>

                                    {notif.actionLabel && (
                                        <button
                                            onClick={() => { notif.onAction?.(); setIsOpen(false); }}
                                            className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wide"
                                        >
                                            {notif.actionLabel} →
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
