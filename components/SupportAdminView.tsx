import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketMessage } from '../types';
import { DBService } from '../db';
import { MessageCircle, Search, Filter, Clock, Send, X, Inbox } from 'lucide-react';

export const SupportAdminView: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [reply, setReply] = useState('');
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [search, setSearch] = useState('');

    const loadTickets = async () => {
        const data = await DBService.getSupportTickets();
        setTickets(data);
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const handleSelectTicket = async (t: SupportTicket) => {
        if (t.unreadAdmin) {
            const updated = { ...t, unreadAdmin: false };
            await DBService.saveSupportTicket(updated);
            setSelectedTicket(updated);
            await loadTickets();
        } else {
            setSelectedTicket(t);
        }
    };

    const handleReply = async () => {
        if (!reply.trim() || !selectedTicket) return;

        const newMsg: TicketMessage = {
            id: Date.now().toString(), // Simple ID generator
            senderId: 'Admin',
            senderName: 'Suporte Finance Pro',
            content: reply,
            timestamp: new Date().toISOString()
        };

        const updatedTicket: SupportTicket = {
            ...selectedTicket,
            messages: [...selectedTicket.messages, newMsg],
            updatedAt: new Date().toISOString(),
            unreadUser: true, // User needs to read this
            status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status
        };

        await DBService.saveSupportTicket(updatedTicket);
        setReply('');
        setSelectedTicket(updatedTicket);
        await loadTickets();
    };

    const handleUpdateStatus = async (newStatus: SupportTicket['status']) => {
        if (!selectedTicket) return;
        const updatedTicket = { ...selectedTicket, status: newStatus, updatedAt: new Date().toISOString() };
        await DBService.saveSupportTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
        await loadTickets();
    };

    const filteredTickets = tickets.filter(t => {
        const matchStatus = filter === 'all' || t.status === filter;
        const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
            t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
            t.userName.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const statusColors = {
        open: 'bg-amber-100 text-amber-700 border-amber-200',
        in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
        resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };

    const statusLabels = {
        open: 'Aberto',
        in_progress: 'Em Análise',
        resolved: 'Resolvido'
    };

    if (selectedTicket) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col h-[600px] animate-fade-in">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedTicket(null)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            ← Voltar
                        </button>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {selectedTicket.subject}
                            </h3>
                            <p className="text-xs text-slate-500">De: {selectedTicket.userName} ({selectedTicket.userEmail})</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={selectedTicket.status}
                            onChange={(e) => handleUpdateStatus(e.target.value as any)}
                            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 outline-none"
                        >
                            <option value="open">Status: Aberto</option>
                            <option value="in_progress">Status: Em Análise</option>
                            <option value="resolved">Status: Resolvido</option>
                        </select>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
                    {selectedTicket.messages.map((msg) => {
                        const isAdmin = msg.senderId === 'Admin';
                        return (
                            <div key={msg.id} className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                                    {isAdmin ? 'Você (Admin)' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className={`p-3 rounded-2xl shadow-sm border ${isAdmin ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
                    <div className="flex gap-2">
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Escreva sua resposta para o cliente..."
                            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none h-12 custom-scrollbar"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReply();
                                }
                            }}
                        />
                        <button
                            onClick={handleReply}
                            disabled={!reply.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center h-12 w-12 shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, email ou assunto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                    <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
                    <button onClick={() => setFilter('open')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50'}`}>Abertos</button>
                    <button onClick={() => setFilter('resolved')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'}`}>Resolvidos</button>
                </div>
            </div>

            {/* Ticket List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Assunto</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Atualização</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        <Inbox size={32} className="mx-auto mb-2 opacity-30" />
                                        Nenhum chamado encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map(t => (
                                    <tr
                                        key={t.id}
                                        onClick={() => handleSelectTicket(t)}
                                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {t.unreadAdmin && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${t.unreadAdmin ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{t.userName}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{t.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className={`text-sm truncate max-w-xs ${t.unreadAdmin ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {t.subject}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${statusColors[t.status]}`}>
                                                {statusLabels[t.status]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-xs text-slate-500">
                                                {new Date(t.updatedAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
