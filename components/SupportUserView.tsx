import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketMessage } from '../types';
import { DBService } from '../db';
import { generateId } from '../utils';
import { MessageCircle, Plus, Send, X, Clock, HelpCircle } from 'lucide-react';

interface SupportUserViewProps {
    userId: string;
    userEmail: string;
    userName: string;
}

export const SupportUserView: React.FC<SupportUserViewProps> = ({ userId, userEmail, userName }) => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [reply, setReply] = useState('');

    const loadTickets = async () => {
        if (!userId) return;
        const data = await DBService.getSupportTickets(userId);
        setTickets(data);
    };

    useEffect(() => {
        loadTickets();
    }, [userId]);

    const handleCreateTicket = async () => {
        if (!subject.trim() || !message.trim()) return;

        const newMsg: TicketMessage = {
            id: generateId(),
            senderId: userId,
            senderName: userName || 'Usuário',
            content: message,
            timestamp: new Date().toISOString()
        };

        const newTicket: SupportTicket = {
            id: generateId(),
            userId,
            userEmail,
            userName: userName || 'Usuário',
            subject,
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [newMsg],
            unreadAdmin: true,
            unreadUser: false
        };

        await DBService.saveSupportTicket(newTicket);
        setSubject('');
        setMessage('');
        setIsCreating(false);
        await loadTickets();
    };

    const handleReply = async () => {
        if (!reply.trim() || !selectedTicket) return;

        const newMsg: TicketMessage = {
            id: generateId(),
            senderId: userId,
            senderName: userName || 'Usuário',
            content: reply,
            timestamp: new Date().toISOString()
        };

        const updatedTicket: SupportTicket = {
            ...selectedTicket,
            messages: [...selectedTicket.messages, newMsg],
            updatedAt: new Date().toISOString(),
            unreadAdmin: true
        };

        await DBService.saveSupportTicket(updatedTicket);
        setReply('');
        setSelectedTicket(updatedTicket);
        await loadTickets();
    };

    const handleSelectTicket = async (t: SupportTicket) => {
        // If selecting and it has unread user messages, clear flag
        if (t.unreadUser) {
            const updated = { ...t, unreadUser: false };
            await DBService.saveSupportTicket(updated);
            setSelectedTicket(updated);
            await loadTickets();
        } else {
            setSelectedTicket(t);
        }
    };

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
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col h-[600px]">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedTicket(null)} className="text-sm font-bold text-indigo-600 hover:underline">← Voltar</button>
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {selectedTicket.subject}
                        </h3>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${statusColors[selectedTicket.status]}`}>
                        {statusLabels[selectedTicket.status]}
                    </span>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
                    {selectedTicket.messages.map((msg) => {
                        const isMe = msg.senderId === userId;
                        return (
                            <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                                    {isMe ? 'Você' : 'Suporte Finance Pro'} • {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className={`p-3 rounded-2xl shadow-sm border ${isMe ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
                    {selectedTicket.status === 'resolved' ? (
                        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-800/50">
                            Este chamado foi marcado como resolvido. Abra um novo chamado se precisar de mais ajuda.
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Digite sua resposta..."
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
                    )}
                </div>
            </div>
        );
    }

    if (isCreating) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <HelpCircle className="text-indigo-500" /> Novo Chamado
                    </h3>
                    <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Assunto</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Problema com pagamento" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Mensagem</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Descreva como podemos ajudar..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[150px] resize-y" />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                        <button onClick={handleCreateTicket} disabled={!subject.trim() || !message.trim()} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50">Enviar Chamado</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageCircle size={16} /> Central de Ajuda
                </h4>
                <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1">
                    <Plus size={14} /> NOVO
                </button>
            </div>

            <div className="p-4">
                {tickets.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 dark:text-white font-bold mb-2">Como podemos ajudar?</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Precisa de ajuda com alguma configuração, pagamento ou encontrou um erro? Abra um chamado.
                        </p>
                        <button onClick={() => setIsCreating(true)} className="mt-6 text-indigo-600 font-bold text-sm tracking-wide hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg inline-flex">Abrir meu primeiro chamado</button>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {tickets.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleSelectTicket(t)}
                                className="w-full text-left p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-slate-800 relative group"
                            >
                                {t.unreadUser && (
                                    <div className="absolute top-4 left-0 w-1 h-8 bg-indigo-500 rounded-r-md"></div>
                                )}
                                <div className="flex-1 min-w-0 px-2">
                                    <h4 className={`text-sm truncate mb-1 ${t.unreadUser ? 'font-black text-indigo-700 dark:text-indigo-400' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                                        {t.subject}
                                    </h4>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> Atualizado {new Date(t.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border shrink-0 ${statusColors[t.status]}`}>
                                    {statusLabels[t.status]}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
