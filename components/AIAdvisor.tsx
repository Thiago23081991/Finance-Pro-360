import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Loader2, Minimize2, Maximize2, Lightbulb } from 'lucide-react';
import { DBService } from '../db';
import { supabase } from '../supabaseClient';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

const SUGGESTIONS = [
    "📊 Analise meus gastos recentes",
    "💰 Como posso economizar mais?",
    "📅 Tenho contas vencendo logo?",
    "🎯 Quanto falta para minha meta?",
];

export const AIAdvisor: React.FC<{ userId: string }> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: 'Olá! Sou seu Coach Financeiro 🤖. Posso analisar suas finanças e te dar conselhos personalizados. O que deseja saber?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg = text;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // Fetch fresh context
            const context = await DBService.getFinancialContext(userId);

            const { data, error } = await supabase.functions.invoke('financial-advisor', {
                body: { message: userMsg, context: context }
            });

            if (error) throw error;

            // Safe access to reply
            const reply = data?.reply || "Desculpe, não consegui gerar uma resposta. Tente novamente.";

            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        } catch (error: any) {
            console.error(error);
            let msg = 'Erro ao conectar com a IA. Tente novamente.';
            if (error?.message) msg = error.message;

            // Tenta ler erro do edge function se vier como JSON no body
            if (error?.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    if (body.error) msg = body.error;
                } catch (e) { }
            }

            setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${msg}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform duration-300 group"
                >
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
                            <Sparkles className="text-white w-8 h-8 animate-pulse" />
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                        </span>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[95vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                <Bot size={24} className="text-purple-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    Finance AI <span className="bg-purple-500/50 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
                                </h3>
                                <p className="text-xs text-indigo-200 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Coach Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition-colors bg-white/10 p-1.5 rounded-lg hover:bg-white/20">
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-indigo-200">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                    }`}>
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.text.split('**').map((part, i) =>
                                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex gap-2 items-center">
                                    <Loader2 size={16} className="animate-spin text-purple-600" />
                                    <span className="text-xs text-slate-400 font-medium">Analisando suas finanças...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions Area */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto flex gap-2 no-scrollbar">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(s)}
                                disabled={isLoading}
                                className="whitespace-nowrap px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full text-xs font-bold hover:bg-purple-50 transition-colors disabled:opacity-50"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-200">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pergunte algo..."
                                className="w-full bg-slate-100 border-0 rounded-xl py-3.5 pl-4 pr-12 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 transition-all font-medium text-sm"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-400 text-white p-2 rounded-lg transition-all shadow-md active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-[9px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                            <Lightbulb size={10} className="text-yellow-500" /> Dica: Pergunte "Como sair do vermelho?" ou "Analise meus investimentos"
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
