import React, { useState } from 'react';
import { Rocket, Check, Zap, Copy, MessageCircle } from 'lucide-react';
import { Logo } from './Logo';

interface SubscriptionWallProps {
    userId?: string;
    userEmail?: string;
}

export const SubscriptionWall: React.FC<SubscriptionWallProps> = ({ userId, userEmail }) => {
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');

    const PIX_CODE_BASIC = "00020126580014BR.GOV.BCB.PIX0136ae75855f-8720-45b5-86c3-9d1a2411475f520400005303986540529.905802BR5925Thiago da Silva Nasciment6009SAO PAULO62140510ouz7uLxcyU6304BF59";

    const getWhatsAppLink = () => {
        const message = `Olá, já realizei o pagamento do Plano Básico!\n\nID do Usuário: ${userId || 'N/A'}\nEmail: ${userEmail || 'N/A'}\n\nAguardo a liberação do acesso.`;
        return `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="min-h-screen bg-[#0a192f] text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="max-w-5xl w-full space-y-8">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Rocket className="text-brand-gold" size={32} />
                    <h1 className="text-3xl font-black uppercase tracking-tight">Evolua sua Gestão</h1>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Basic Plan */}
                    <div
                        onClick={() => setSelectedPlan('basic')}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedPlan === 'basic'
                            ? 'border-brand-gold bg-slate-800/50 shadow-2xl shadow-brand-gold/10'
                            : 'border-slate-700 bg-slate-900/50 opacity-60 hover:opacity-100'
                            }`}
                    >
                        {selectedPlan === 'basic' && (
                            <div className="absolute top-4 right-4 text-brand-gold">
                                <Check size={24} strokeWidth={3} />
                            </div>
                        )}

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Entrada</p>
                        <h2 className="text-2xl font-black mb-1">PLANO BÁSICO</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-lg font-bold">R$</span>
                            <span className="text-4xl font-black">29,90</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Vitalício</span>
                        </div>

                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                Dashboard Completo
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                Gestão de Receitas/Despesas
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                Metas Financeiras
                            </li>
                        </ul>
                    </div>

                    {/* Premium Plan */}
                    <div
                        onClick={() => setSelectedPlan('premium')}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${selectedPlan === 'premium'
                            ? 'border-brand-gold bg-slate-800/50 shadow-2xl shadow-brand-gold/10'
                            : 'border-slate-700 bg-slate-900/50 opacity-80 hover:opacity-100'
                            }`}
                    >
                        <div className="absolute top-0 right-0 bg-brand-gold text-brand-blue text-[10px] font-black px-3 py-1 rounded-bl-lg">
                            O MAIS COMPLETO
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Profissional</p>
                        <h2 className="text-2xl font-black mb-1">PLANO PREMIUM</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-lg font-bold">R$</span>
                            <span className="text-4xl font-black">80,00</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Vitalício</span>
                        </div>

                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <Zap size={16} className="text-brand-gold fill-brand-gold" />
                                Insights com Inteligência Artificial
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <Zap size={16} className="text-brand-gold fill-brand-gold" />
                                Simuladores de Bancos (Nubank)
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <Zap size={16} className="text-brand-gold fill-brand-gold" />
                                Cursos da Finance Academy
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Payment Main Area */}
                <div className="bg-slate-950 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start border border-slate-800/50">

                    {/* QR Code Section */}
                    <div className="bg-white p-3 rounded-xl shrink-0">
                        {selectedPlan === 'basic' ? (
                            <img src="/pix-qrcode.jpg" alt="QR Code 29.90" className="w-48 h-48 object-contain" />
                        ) : (
                            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded text-slate-400 text-xs text-center p-4">
                                QR Code do Plano Premium indisponível no momento
                            </div>
                        )}
                    </div>

                    {/* Details & Actions */}
                    <div className="flex-1 w-full space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Plano Selecionado: {selectedPlan === 'basic' ? 'Plano Básico' : 'Plano Premium'}</p>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold text-white">Total a pagar:</h2>
                                <span className="text-3xl font-black text-white">R$ {selectedPlan === 'basic' ? '29.90' : '80.00'}</span>
                            </div>
                        </div>

                        {selectedPlan === 'basic' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(PIX_CODE_BASIC);
                                        alert("Código Pix copiado com sucesso!");
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                                >
                                    <Copy size={18} />
                                    COPIAR PIX
                                </button>

                                <a
                                    href={getWhatsAppLink()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-brand-gold hover:bg-yellow-500 text-brand-blue px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-gold/10"
                                >
                                    <MessageCircle size={18} />
                                    ENVIAR COMPROVANTE
                                </a>
                            </div>
                        )}

                        {selectedPlan === 'premium' && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm">
                                Este plano está temporariamente indisponível para compra automática. Entre em contato com o suporte.
                            </div>
                        )}

                        {selectedPlan === 'basic' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    <strong className="text-emerald-400">Como ativar rápido?</strong> <br />
                                    1. Copie o código Pix e pague no seu banco. <br />
                                    2. Clique em <strong>Enviar Comprovante</strong> acima. <br />
                                    3. Você será redirecionado para o WhatsApp do suporte com seus dados já preenchidos.
                                </p>

                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-left">
                                    <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Pix Copia e Cola</p>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-black/30 p-2 rounded text-[10px] text-slate-300 break-all font-mono border border-slate-800 select-all">
                                            {PIX_CODE_BASIC}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
