import React from 'react';
import { Crown, Check, ShieldCheck, Star, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

export const SubscriptionWall: React.FC = () => {
    const features = [
        "Acesso ilimitado a todas as ferramentas",
        "Gestão completa de Investimentos e Metas",
        "Controle avançado de Dívidas",
        "Suporte prioritário e atualizações vitalícias"
    ];

    return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://images.unsplash.com/photo-1639322537228-ad71c4295843?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-gold/20 rounded-full blur-3xl"></div>

            <div className="max-w-4xl w-full bg-slate-900/80 backdrop-blur-xl border border-brand-gold/20 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row">

                {/* Left Side - Visual */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-brand-gold to-yellow-700 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Crown size={200} />
                    </div>

                    <div className="z-10">
                        <Logo className="w-12 h-12 mb-6" textClassName="text-white" showText={false} />
                        <h2 className="text-3xl font-black leading-tight mb-2">DESBLOQUEIE SEU POTENCIAL</h2>
                        <p className="text-yellow-100 font-medium">Não deixe que sua gestão financeira pare por aqui.</p>
                    </div>

                    <div className="z-10 mt-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="text-white fill-white" size={16} />
                            <Star className="text-white fill-white" size={16} />
                            <Star className="text-white fill-white" size={16} />
                            <Star className="text-white fill-white" size={16} />
                            <Star className="text-white fill-white" size={16} />
                        </div>
                        <p className="text-xs text-yellow-100 italic">"A melhor ferramenta de gestão que já usei. Simplesmente transformou minhas finanças."</p>
                        <p className="text-xs font-bold mt-2">- Roberto S., Empreendedor</p>
                    </div>
                </div>

                {/* Right Side - Copy & Action */}
                <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-gold/30 text-brand-gold animate-pulse">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Seu período de teste expirou</h1>
                        <p className="text-slate-400 text-sm">Para continuar evoluindo suas finanças, adquira o acesso vitalício do Finance Pro 360.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-6 rounded-xl border border-slate-700 text-center mb-6 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 bg-brand-gold text-brand-blue font-bold px-8 py-1 rotate-45 text-xs shadow-lg">OFERTA</div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Acesso Vitalício</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl text-slate-500 line-through">R$ 97</span>
                            <span className="text-4xl font-black text-white">R$ 29,90</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 mb-4">Pagamento único. Sem mensalidades.</p>

                        <div className="bg-white p-2 rounded-lg inline-block mb-2">
                            <img src="/pix-qrcode.jpg" alt="QR Code Pix" className="w-48 h-48 object-contain" />
                        </div>
                        <p className="text-xs text-brand-gold font-bold mb-4">Escaneie o QR Code para pagar via Pix</p>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6 text-left">
                            <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Pix Copia e Cola</p>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-black/30 p-2 rounded text-[10px] text-slate-300 break-all font-mono border border-slate-800">
                                    00020126580014BR.GOV.BCB.PIX0136ae75855f-8720-45b5-86c3-9d1a2411475f520400005303986540529.905802BR5925Thiago da Silva Nasciment6009SAO PAULO62140510ouz7uLxcyU6304BF59
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136ae75855f-8720-45b5-86c3-9d1a2411475f520400005303986540529.905802BR5925Thiago da Silva Nasciment6009SAO PAULO62140510ouz7uLxcyU6304BF59");
                                        alert("Código Pix copiado!");
                                    }}
                                    className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded flex items-center justify-center transition-colors"
                                    title="Copiar código"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button className="w-full bg-brand-gold hover:bg-yellow-500 text-brand-blue font-bold py-4 rounded-xl shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <span>ENVIAR COMPROVANTE</span>
                        <ArrowRight size={18} />
                    </button>
                    <p className="text-center mt-4 text-[10px] text-slate-500">
                        Garantia de 7 dias ou seu dinheiro de volta. Compra segura.
                    </p>
                </div>
            </div>
        </div>
    );
};
