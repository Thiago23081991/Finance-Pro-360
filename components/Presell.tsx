import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, DollarSign } from 'lucide-react';
import { Logo } from './Logo';

export const Presell: React.FC = () => {
    const handleCtaClick = () => {
        window.location.href = 'https://pay.kiwify.com.br/4A8FZ7I';
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            {/* Top Attention Bar */}
            <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm font-bold tracking-wide shadow-md relative z-20">
                ⚡ ATENÇÃO: Método revelado para quem busca clareza financeira em 2025
            </div>

            {/* Header / Nav */}
            <header className="py-6 px-4 md:px-8 border-b border-slate-100 bg-white sticky top-0 z-10">
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
            <section className="py-16 md:py-24 px-4 relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full text-sm font-bold mb-8 items-center gap-2 border border-blue-100">
                        <span className="w-2 h-2 bg-blue-600 rounded-full inline-block mr-2 animate-pulse"></span>
                        Gestão Financeira de Alta Performance
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                        Por Que Você Continua <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">"Sem Dinheiro"</span> no Final do Mês?
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto">
                        (E Não, a Culpa Não é do Seu Cafezinho Diário)
                    </p>

                    <button
                        onClick={handleCtaClick}
                        className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-lg md:text-xl font-bold py-5 px-10 rounded-xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto"
                    >
                        QUERO DOMINAR MINHAS FINANÇAS
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </button>

                    <p className="mt-4 text-slate-400 text-sm flex items-center justify-center gap-1">
                        <ShieldCheck size={14} /> Ambiente 100% Seguro
                    </p>
                </div>

                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">O Que O Método Finance Pro 360 Faz Por Você</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-red-600">
                                <TrendingUp className="rotate-180" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Estanca Hemorragias</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Identifique exatamente onde seu dinheiro está vazando. A maioria perde 20% da renda em "gastos invisíveis" que nossa ferramenta detecta.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-brand-gold text-brand-blue text-[10px] font-bold px-2 py-1 rounded-bl-lg">PREMIUM</div>
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                                <DollarSign size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Multiplicação de Renda</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Transforme seu dinheiro inativo em renda passiva. Aprenda a separar categorias de investimento de forma simples e visual.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Planejamento Sem Dor</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Chega de planilhas complexas que ninguém entende. Tenha um dashboard visual que te diz exatamente o que fazer.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Strip */}
            <section className="py-24 bg-brand-blue relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pattern-grid-lg"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-8">
                        Pronto Para Assumir o Controle?
                    </h2>
                    <button
                        onClick={handleCtaClick}
                        className="inline-flex items-center justify-center gap-3 bg-brand-gold hover:bg-yellow-400 text-brand-blue text-xl font-black py-4 px-12 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
                    >
                        ACESSAR O SISTEMA AGORA
                        <ArrowRight strokeWidth={3} />
                    </button>
                    <p className="mt-6 text-blue-200 text-sm">
                        Milhares de usuários já estão economizando todos os dias.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 grayscale opacity-50 hover:opacity-100 transition-opacity">
                        <Logo className="w-6 h-6" textClassName="text-white" />
                        <span className="font-bold text-white">Finance Pro 360</span>
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()} Finance Pro 360. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
