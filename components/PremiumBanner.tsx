import React from 'react';
import { Crown, Sparkles, ArrowRight, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLANS_CONFIG } from '../constants';

export const PremiumBanner: React.FC = () => {
    // Calculate approx 12x installment with standard interest (usually ~20% total over 1 year for small values or just standard simplified calc if unsure.
    // User requested "valor parcelado em 12x". Typically 80 + interest. 
    // If we assume straight division: 80/12 = 6.67. 
    // If we assume standard checkout interest (approx 2.99%/mo): 80 -> ~100 -> ~8,03.
    // PRODUCER TIP: Usually "12x de 8,03" is a common pattern for R$ 80 base (19% rate).
    // Let's use R$ 8,03 as a safe "interest included" estimative distinct from cash price, or stick to logical division if no interest.
    // Given the "No de um ano coloque o valor parcelado em 12x" instruction, I will use a visually distinct display.
    // I will use 8,03 to be safe with standard Kiwify rates, or generic text. 
    // Actually, R$ 80 is very cheap. Let's list "12x de R$ 8,03" (approx) or simply "12x" generic.
    // Better strategy: Simple division to make it look attractive: R$ 6,67.

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 shadow-md border border-slate-800"
        >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10 p-6 md:p-8 flex flex-col items-center text-center">

                {/* Header Section */}
                <div className="mb-8">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/30 text-brand-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Crown size={12} /> Oferta Especial
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                        Desbloqueie todo o potencial do <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200">Finance Pro 360</span>
                    </h2>
                    <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                        Acesso ilimitado à <strong>Inteligência Artificial</strong>, gráficos avançados, gestão de dívidas e suporte prioritário.
                    </p>
                </div>

                {/* Pricing Card - Single Plan */}
                <div className="flex justify-center w-full max-w-md mx-auto">

                    {/* Single Plan */}
                    <div className="w-full bg-gradient-to-b from-brand-blue/30 to-slate-900/80 backdrop-blur-sm rounded-xl p-5 border-2 border-brand-gold/50 flex flex-col items-center overflow-hidden shadow-xl shadow-brand-gold/10 relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-brand-gold"></div>

                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            Plano Único <span className="text-[10px] bg-brand-gold text-brand-blue px-2 py-0.5 rounded-full font-bold">ACESSO COMPLETO</span>
                        </h3>

                        {/* Pricing Display */}
                        <div className="flex flex-col items-center mb-1">
                            <span className="text-xs text-brand-gold font-bold uppercase tracking-wider mb-1">Apenas</span>
                            <div className="text-4xl font-bold text-white flex items-baseline gap-1">
                                <span className="text-lg font-medium">R$</span>
                                19,90
                                <span className="text-sm font-normal text-slate-400">/mês</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 mb-4 font-medium uppercase tracking-wide">Tudo incluso, sem surpresas</p>

                        <a
                            href={PLANS_CONFIG.annual.checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-brand-gold text-brand-blue font-bold transition-all shadow-md flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                        >
                            <Sparkles size={18} />
                            <span>QUERO MEU ACESSO</span>
                        </a>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};
