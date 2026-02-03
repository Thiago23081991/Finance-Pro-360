
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { GeminiService } from '../services/GeminiService';
import { Transaction, Goal } from '../types';

interface AIAdvisorProps {
    transactions: Transaction[];
    goals: Goal[];
    userName?: string;
    isPremium?: boolean;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions, goals, userName, isPremium = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Olá! Sou seu Coach Financeiro 🤖. Posso analisar suas finanças e te dar conselhos personalizados. O que deseja saber?`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await GeminiService.sendMessage(inputText, { transactions, goals });

            const newAiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newAiMsg]);
        } catch (error) {
            console.error("Chat error", error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/40 text-white flex items-center justify-center group"
                >
                    <Bot size={28} className="animate-pulse" />
                    <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Falar com IA Coach
                    </span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[380px] h-[500px] max-h-[80vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden font-inter"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        Finance AI <span className="text-[9px] bg-white/20 px-1.5 rounded font-mono">BETA</span>
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] opacity-80">Coach Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-700 text-sm">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl ${msg.sender === 'user'
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        <p className="leading-relaxed">{msg.text}</p>
                                        <span className="text-[9px] opacity-50 mt-1 block text-right">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions Quick Chips */}
                        {messages.length === 1 && (
                            <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                                {['Analise meus gastos', 'Como economizar?', 'Investimentos'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setInputText(s); handleSendMessage(); }}
                                        className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-500/50 transition-colors"
                                    >
                                        ✨ {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Pergunte algo..."
                                    className="w-full bg-slate-950 text-slate-200 pl-4 pr-10 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-600"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isTyping}
                                    className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            {!isPremium && (
                                <p className="text-[10px] text-center text-slate-600 mt-2">
                                    Limite de mensagens gratuito. <a href="#" className="text-indigo-400 hover:underline">Seja Premium</a>
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
