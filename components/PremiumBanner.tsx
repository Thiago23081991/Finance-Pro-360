import React from 'react';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLANS_CONFIG } from '../constants';

export const PremiumBanner: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-blue to-slate-900 p-6 shadow-xl border border-brand-gold/30 group"
        >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl group-hover:bg-brand-gold/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/30 text-brand-gold text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Crown size={12} /> Oferta Limitada
                        </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                        Desbloqueie o <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200">Finance Pro Premium</span>
                    </h3>
                    <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
                        Tenha acesso ilimitado à <strong>IA Financeira</strong>, gestão avançada de metas, e suporte prioritário. Acelere sua liberdade financeira hoje.
                    </p>
                </div>

                <div className="shrink-0">
                    <a
                        href={PLANS_CONFIG.annual.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-brand-gold text-brand-blue font-black px-8 py-4 rounded-xl shadow-lg shadow-brand-gold/20 transform hover:-translate-y-1 transition-all duration-300 group/btn"
                    >
                        <Sparkles size={20} className="animate-pulse" />
                        <span>QUERO SER PREMIUM</span>
                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                    <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                        Apenas {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(PLANS_CONFIG.annual.value)}/ano
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
