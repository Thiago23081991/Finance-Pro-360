import React from 'react';
import { Rocket, Check, ShoppingCart, ShieldCheck, Star, Zap, Smartphone, Sparkles, Users } from 'lucide-react';
import { PLANS_CONFIG } from '../constants';

interface SubscriptionWallProps {
    userId?: string;
    userEmail?: string;
    isExpired?: boolean; // true = assinatura expirou, false = trial terminou
}

export const SubscriptionWall: React.FC<SubscriptionWallProps> = ({ userId, userEmail, isExpired = false }) => {

    const handleCheckout = () => {
        const link = PLANS_CONFIG.annual.checkoutUrl;
        const finalLink = `${link}?email=${encodeURIComponent(userEmail || '')}&custom_id=${userId || ''}`;
        window.open(finalLink, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#0a192f] text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="max-w-md w-full space-y-8">

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Rocket className="text-brand-gold" size={42} />
                        <h1 className="text-4xl font-bold uppercase tracking-tight text-white">Finance Pro 360</h1>
                    </div>

                    {isExpired ? (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                            <p className="text-rose-400 font-bold text-sm">⚠️ Sua assinatura expirou</p>
                            <p className="text-slate-400 text-xs mt-1">Renove agora para continuar acessando todos os recursos.</p>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-lg">Seu período de avaliação encerrou. Assine para continuar.</p>
                    )}
                </div>

                {/* Single Plan Card */}
                <div className="relative bg-slate-800/80 border-2 border-brand-gold rounded-2xl p-8 shadow-2xl shadow-brand-gold/10 overflow-hidden">
                    {/* Top accent */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-gold to-yellow-400"></div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-brand-gold text-brand-blue text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Plano Único
                    </div>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Acesso Completo</p>
                    <h2 className="text-2xl font-bold text-white mb-6">Finance Pro 360 Premium</h2>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-lg font-bold text-slate-300">R$</span>
                        <span className="text-6xl font-black text-white tracking-tighter">19</span>
                        <span className="text-2xl font-bold text-slate-400">,90</span>
                        <span className="text-slate-400 font-medium ml-1">/mês</span>
                    </div>
                    <p className="text-xs text-brand-gold font-bold uppercase mb-8 bg-brand-gold/10 inline-block px-3 py-1 rounded">
                        Cobrado mensalmente · Cancele quando quiser
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                        {[
                            { icon: <Zap size={16} className="text-brand-gold fill-brand-gold" />, text: 'Acesso imediato a TUDO' },
                            { icon: <Sparkles size={16} className="text-brand-gold" />, text: 'Consultor Financeiro com I.A.' },
                            { icon: <Smartphone size={16} className="text-brand-gold" />, text: 'App Mobile + Desktop' },
                            { icon: <Check size={16} className="text-emerald-400" />, text: 'Gestão de Metas e Dívidas' },
                            { icon: <Check size={16} className="text-emerald-400" />, text: 'Cursos Finance Academy' },
                            { icon: <Users size={16} className="text-emerald-400" />, text: 'Suporte Prioritário' },
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                {item.icon}
                                <span>{item.text}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-brand-blue text-lg font-black py-5 rounded-xl shadow-lg shadow-brand-gold/20 transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <ShoppingCart className="group-hover:animate-bounce" size={22} />
                        ASSINAR AGORA — R$ 19,90/mês
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Pagamento seguro via Kiwify · Garantia de 7 dias
                    </div>
                </div>

            </div>
        </div>
    );
};
