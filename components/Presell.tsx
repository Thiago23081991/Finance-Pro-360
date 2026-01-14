import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, DollarSign, Lock, XCircle, Activity, Sparkles, Target } from 'lucide-react';
import { Logo } from './Logo';

export const Presell: React.FC = () => {
    const handleCtaClick = () => {
        window.location.href = 'https://pay.kiwify.com.br/4A8FZ7I';
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            {/* Top Attention Bar */}
            <div className="bg-orange-600 text-white text-center py-2 px-4 text-sm font-bold tracking-wide shadow-md relative z-20 animate-pulse">
                🔥 OFERTA POR TEMPO LIMITADO: DE R$ 97,00 POR APENAS R$ 47,90
            </div>

            {/* Header / Nav */}
            <header className="py-6 px-4 md:px-8 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-brand-blue p-1.5 rounded-lg">
                            <TrendingUp className="text-brand-gold w-6 h-6" />
                        </div>
                        <span className="text-xl font-black text-brand-blue tracking-tight">
                            FINANCE <span className="text-brand-gold">PRO 360</span>
                        </span>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-16 md:py-24 px-4 relative overflow-hidden bg-white">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-red-100 uppercase tracking-wider">
                        🛑 PARE DE VIVER NO "PILOTO AUTOMÁTICO"
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                        Você Trabalha o Mês Inteiro e o Dinheiro <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">Simplesmente Desaparece?</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
                        A culpa não é do seu salário. É da falta de um <span className="text-slate-900 font-bold bg-yellow-100 px-1">sistema inteligente</span>.
                        O Finance Pro 360 organiza sua vida em minutos e te mostra exatamente como sobrar dinheiro.
                    </p>

                    <button
                        onClick={handleCtaClick}
                        className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-lg md:text-2xl font-black py-6 px-12 rounded-2xl shadow-[0_20px_50px_-12px_rgba(16,185,129,0.5)] transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto border-b-4 border-emerald-800 hover:border-emerald-700"
                    >
                        SIM! QUERO MUDAR MINHA VIDA FINANCEIRA
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </button>

                    <p className="mt-4 text-slate-500 text-sm flex items-center justify-center gap-1 font-medium">
                        <Lock size={14} className="text-emerald-600" /> Acesso Imediato • Garantia de 7 Dias • Compra Segura
                    </p>
                </div>

                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
            </section>

            {/* Pain Points / Agitation */}
            <section className="py-20 bg-slate-50 border-y border-slate-200">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">
                        Se você se identifica com algum dos pontos abaixo, <br />o <span className="text-blue-600">Finance Pro 360</span> é obrigatório para você:
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:border-red-200 transition-colors">
                            <XCircle className="text-red-500 w-10 h-10 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Ansiedade no Final do Mês</h3>
                            <p className="text-slate-600">Aquele frio na barriga de abrir o app do banco e não saber se vai dar para pagar tudo.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:border-red-200 transition-colors">
                            <XCircle className="text-red-500 w-10 h-10 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Cartão de Crédito Fora de Controle</h3>
                            <p className="text-slate-600">Você paga a fatura e já fica sem limite de novo, vivendo num ciclo eterno de dívidas.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:border-red-200 transition-colors">
                            <XCircle className="text-red-500 w-10 h-10 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Sonhos Sempre Adiados</h3>
                            <p className="text-slate-600">A viagem, o carro novo ou a casa própria parecem impossíveis porque "nunca sobra nada".</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features / Solution */}
            <section className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Não É Mágica. É Método.</h2>
                        <p className="text-xl text-slate-600">
                            Desenvolvemos uma ferramenta visual, intuitiva e poderosa. Veja o que você vai ter nas mãos:
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 rotate-3">
                                <Activity size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">Raio-X Completo</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                Visualize todo o seu dinheiro em um único lugar. Contas bancárias, cartões, dívidas e investimentos. Clareza total em 5 minutos.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-brand-gold to-yellow-300 text-slate-900 text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-wider z-20">
                                Exclusivo
                            </div>
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-brand-gold rotate-3 group-hover:scale-110 transition-transform">
                                <Sparkles size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white">Inteligência Artificial</h3>
                            <p className="text-slate-300 leading-relaxed font-medium">
                                Não sabe onde cortar? Nossa IA analisa seus gastos e diz: "Você gastou R$ 400 em iFood. Se reduzir para R$ 150, você viaja em 6 meses."
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600 rotate-3">
                                <Target size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">Metas Automáticas</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                Defina um sonho (Ex: R$ 10.000 para emergência) e o sistema calcula quanto guardar por dia. É como um GPS para a riqueza.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Strip */}
            <section className="py-20 bg-brand-blue relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
                        Quanto Vale a Sua Paz Financeira?
                    </h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-10">
                        <div className="text-blue-300 line-through text-2xl font-bold">De R$ 97,00</div>
                        <div className="text-white text-4xl md:text-6xl font-black">Por R$ 47,90</div>
                    </div>

                    <button
                        onClick={handleCtaClick}
                        className="inline-flex items-center justify-center gap-3 bg-brand-gold hover:bg-yellow-400 text-brand-blue text-xl md:text-2xl font-black py-5 px-16 rounded-full shadow-[0_0_40px_rgba(255,215,0,0.4)] transition-all transform hover:scale-105 active:scale-95 border-b-4 border-yellow-600"
                    >
                        GARANTIR MEU ACESSO AGORA
                        <ArrowRight strokeWidth={4} />
                    </button>
                    <p className="mt-8 text-blue-200 text-sm font-medium">
                        Oferta única. Pagamento Único. Acesso Vitalício (Por enquanto).
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <Logo className="w-6 h-6" textClassName="text-white" />
                        <span className="font-bold text-white">Finance Pro 360</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()} Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
