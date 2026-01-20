
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

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // Fetch fresh context
            const context = await DBService.getFinancialContext(userId);

            const { data, error } = await supabase.functions.invoke('financial-advisor', {
                body: { message: userMsg, context: context }
            });

            setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } catch (error: any) {
            console.error(error);
            let msg = 'Erro desconhecido.';
            if (typeof error === 'string') msg = error;
            else if (error?.message) msg = error.message;
            else msg = JSON.stringify(error);

            // Tenta ler o corpo da resposta se for um erro de função do Supabase
            if (error?.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    if (body.error) msg = body.error;
                    if (body.details) msg += ` (${body.details})`;
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
                        <img
                            src="/ai-avatar.png"
                            alt="IA Advisor"
                            className="w-16 h-16 rounded-full border-4 border-white shadow-2xl object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></span>
                        <span className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full animate-ping opacity-75"></span>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    src="/ai-avatar.png"
                                    alt="IA"
                                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                                />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-slate-900 rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Finance AI</h3>
                                <p className="text-xs text-indigo-200 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online agora
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <Minimize2 size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-indigo-200">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-2 items-center">
                                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                                    <span className="text-xs text-slate-400">Digitando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pergunte sobre seus gastos..."
                                className="w-full bg-slate-100 border-0 rounded-xl py-4 pl-4 pr-12 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-slate-400 mt-2">
                            A IA pode cometer erros. Verifique informações importantes.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
