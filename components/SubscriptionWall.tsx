import React, { useState } from 'react';
import { Rocket, Check, Zap, ShoppingCart, Lock } from 'lucide-react';

interface SubscriptionWallProps {
    userId?: string;
    userEmail?: string;
}

export const SubscriptionWall: React.FC<SubscriptionWallProps> = ({ userId, userEmail }) => {
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
    const [activating, setActivating] = useState(false);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');

    // LINKS DE CHECKOUT (Substitua pelos seus links reais da Kiwify/Hotmart)
    const CHECKOUT_BASIC = "https://pay.kiwify.com.br/4A8FZ7I";
    const CHECKOUT_PREMIUM = "https://pay.kiwify.com.br/PZzs9Up";

    const handleCheckout = () => {
        const link = selectedPlan === 'basic' ? CHECKOUT_BASIC : CHECKOUT_PREMIUM;
        // Adicionar email e ID na URL para rastreamento (UTM ou parâmetros personalizados se a plataforma suportar)
        const finalLink = `${link}?email=${userEmail || ''}&custom_id=${userId || ''}`;
        window.open(finalLink, '_blank');
    };

    const handleActivateKey = async () => {
        if (!licenseKey || !userId) return;
        setActivating(true);
        try {
            const { DBService } = await import('../db');
            const success = await DBService.activateLicenseKey(userId, licenseKey);
            if (success) {
                alert("Licença ativada com sucesso! Bem-vindo ao Pro.");
                window.location.reload();
            } else {
                alert("Chave inválida. Verifique seu email de compra.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao validar chave.");
        } finally {
            setActivating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a192f] text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="max-w-5xl w-full space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Rocket className="text-brand-gold" size={42} />
                        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Evolua sua Gestão</h1>
                    </div>
                    <p className="text-slate-400 text-lg">Desbloqueie todo o potêncial do Finance Pro 360 e assuma o controle.</p>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                    {/* Basic Plan */}
                    <div
                        onClick={() => setSelectedPlan('basic')}
                        className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${selectedPlan === 'basic'
                            ? 'border-brand-gold bg-slate-800/80 shadow-2xl shadow-brand-gold/10 scale-105 z-10'
                            : 'border-slate-700 bg-slate-900/40 opacity-70 hover:opacity-100 hover:scale-[1.02]'
                            }`}
                    >
                        {selectedPlan === 'basic' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-blue text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                                Selecionado
                            </div>
                        )}

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Iniciante</p>
                        <h2 className="text-3xl font-black mb-4">Essencial</h2>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-lg font-bold text-slate-300">R$</span>
                            <span className="text-5xl font-black text-white">47</span>
                            <span className="text-xl font-bold text-slate-500">,00</span>
                        </div>
                        <p className="text-xs text-brand-gold font-bold uppercase mb-8 bg-brand-gold/10 inline-block px-3 py-1 rounded">Pagamento Único (Vitalício)</p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Check size={18} className="text-emerald-400 shrink-0" />
                                <span>Dashboard Completo</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Check size={18} className="text-emerald-400 shrink-0" />
                                <span>Controle de Receitas/Despesas</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Check size={18} className="text-emerald-400 shrink-0" />
                                <span>Gerenciador de Metas</span>
                            </li>
                        </ul>
                    </div>

                    {/* Premium Plan */}
                    <div
                        onClick={() => setSelectedPlan('premium')}
                        className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${selectedPlan === 'premium'
                            ? 'border-brand-gold bg-slate-800/80 shadow-2xl shadow-brand-gold/10 scale-105 z-10'
                            : 'border-slate-700 bg-slate-900/40 opacity-70 hover:opacity-100 hover:scale-[1.02]'
                            }`}
                    >
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-brand-gold to-yellow-400 text-brand-blue text-[10px] font-black px-4 py-1.5 rounded-bl-xl shadow-lg">
                            RECOMENDADO
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Profissional</p>
                        <h2 className="text-3xl font-black mb-4">Premium AI</h2>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-lg font-bold text-slate-300">R$</span>
                            <span className="text-5xl font-black text-white">97</span>
                            <span className="text-xl font-bold text-slate-500">,00</span>
                        </div>
                        <p className="text-xs text-brand-gold font-bold uppercase mb-8 bg-brand-gold/10 inline-block px-3 py-1 rounded">Pagamento Único (Vitalício)</p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Zap size={18} className="text-brand-gold shrink-0 fill-brand-gold" />
                                <span className="font-bold text-white">Todas as funções do Essencial</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Zap size={18} className="text-brand-gold shrink-0 fill-brand-gold" />
                                <span>Insights com Inteligência Artificial</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Zap size={18} className="text-brand-gold shrink-0 fill-brand-gold" />
                                <span>Acesso aos Cursos Academy</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <Zap size={18} className="text-brand-gold shrink-0 fill-brand-gold" />
                                <span>Prioridade no Suporte</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="max-w-md mx-auto mt-8 space-y-4">
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-brand-blue text-lg font-black py-5 rounded-2xl shadow-lg shadow-brand-gold/20 transform transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <ShoppingCart className="group-hover:animate-bounce" />
                        DESBLOQUEAR ACESSO AGORA
                    </button>

                    <p className="text-center text-xs text-slate-500 leading-relaxed">
                        Pagamento processado de forma segura pela Kiwify. <br />
                        Seu acesso é liberado automaticamente após a confirmação.
                    </p>

                    {/* Manual Activation Toggle */}
                    <div className="pt-6 border-t border-slate-800/50 text-center">
                        <button
                            onClick={() => setShowKeyInput(!showKeyInput)}
                            className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                            <Lock size={12} />
                            {showKeyInput ? 'Fechar ativação manual' : 'Já comprei e tenho uma chave'}
                        </button>

                        {showKeyInput && (
                            <div className="mt-4 animate-fade-in bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto shadow-xl">
                                <input
                                    type="text"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                    placeholder="XXXX-XXXX"
                                    className="flex-1 bg-black/40 border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center text-sm placeholder-slate-600 focus:ring-2 focus:ring-brand-gold/50 outline-none"
                                />
                                <button
                                    onClick={handleActivateKey}
                                    disabled={activating || !licenseKey}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                    {activating ? '...' : 'Validar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
