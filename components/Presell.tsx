import React, { useState } from 'react';
import {
    CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, DollarSign,
    Lock, XCircle, Activity, Sparkles, Target, Check, Zap,
    HelpCircle, ChevronDown, ChevronUp, Star, Users
} from 'lucide-react';
import { Logo } from './Logo';

export const Presell: React.FC = () => {
    const handleCtaClick = () => {
        window.location.href = 'https://pay.kiwify.com.br/4A8FZ7I';
    };

    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const toggleFaq = (index: number) => setOpenFaq(openFaq === index ? null : index);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            {/* Top Attention Bar */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-center py-2.5 px-4 text-xs md:text-sm font-bold tracking-wide shadow-lg relative z-50">
                <div className="animate-pulse flex items-center justify-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase">Últimas Horas</span>
                    PLANO SEMESTRAL POR R$ 47,90 OU ANUAL POR R$ 80,00
                </div>
            </div>

            {/* Header / Nav */}
            <header className="py-6 px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="bg-brand-blue p-1.5 rounded-lg shadow-sm">
                            <Logo className="w-6 h-6 text-brand-gold" />
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            FINANCE <span className="text-brand-gold">PRO 360</span>
                        </span>
                    </div>
                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hidden md:block px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                    >
                        GARANTIR OFERTA
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 mb-8 animate-fade-in-down">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 13}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-600">+1.200 vidas transformadas</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] mb-8 tracking-tight animate-fade-in-up">
                        O Fim da Sua <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Angústia Financeira.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
                        Não é mais uma planilha chata. É um sistema visual que te mostra <b className="text-slate-900">exatamente</b> onde o dinheiro está vazando e como fazer sobrar.
                    </p>

                    <button
                        onClick={handleCtaClick}
                        className="group relative inline-flex items-center justify-center gap-3 bg-brand-gold hover:bg-yellow-400 text-brand-blue text-lg md:text-2xl font-black py-6 px-12 rounded-2xl shadow-xl shadow-yellow-500/20 transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto animate-bounce-slow"
                    >
                        COMEÇAR AGORA
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </button>

                    <p className="mt-6 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Compra Segura</span>
                        <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" /> Acesso Imediato</span>
                    </p>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-75"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
                </div>
            </section>

            {/* Us vs Them Comparison */}
            <section className="py-24 bg-slate-50 border-y border-slate-200">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">A Diferença é Brutal</h2>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-0">
                        {/* Them */}
                        <div className="bg-white/50 p-8 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none border border-slate-200 opacity-80 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-slate-500 mb-6 flex items-center gap-2">
                                <XCircle className="text-red-400" /> Planilhas Comuns
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-slate-500"><XCircle size={18} className="shrink-0 mt-1" /> Difíceis de preencher no celular</li>
                                <li className="flex gap-3 text-slate-500"><XCircle size={18} className="shrink-0 mt-1" /> Fórmulas que quebram sempre</li>
                                <li className="flex gap-3 text-slate-500"><XCircle size={18} className="shrink-0 mt-1" /> Visual feio e desmotivador</li>
                                <li className="flex gap-3 text-slate-500"><XCircle size={18} className="shrink-0 mt-1" /> Não te dão insights, só dados</li>
                            </ul>
                        </div>

                        {/* Us */}
                        <div className="bg-white p-8 rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none shadow-2xl shadow-blue-900/10 relative z-10 scale-105 border border-slate-100">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">A escolha inteligente</div>
                            <h3 className="text-xl font-black text-brand-blue mb-6 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" /> Finance Pro 360
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-slate-800 font-medium"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1" /> App Rápido (Funciona Offline)</li>
                                <li className="flex gap-3 text-slate-800 font-medium"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1" /> Gráficos Automáticos Lindos</li>
                                <li className="flex gap-3 text-slate-800 font-medium"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1" /> IA que analisa seus gastos</li>
                                <li className="flex gap-3 text-slate-800 font-medium"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1" /> Metas Claras e Alcançáveis</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Staggered */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 space-y-24">

                    {/* Feature 1 */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Target size={24} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-slate-900">Metas que Acontecem</h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Pare de sonhar e comece a realizar. Defina quanto precisa para sua viagem, carro ou reserva. O sistema cria uma barra de progresso viciante que te motiva a guardar cada centavo.
                            </p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-lg -rotate-1 hover:rotate-0 transition-transform duration-500">
                            {/* Abstract UI representation */}
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-slate-700">Viagem Europa</span>
                                        <span className="font-bold text-emerald-600">65%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full w-[65%] bg-emerald-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 opacity-60">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-slate-700">Reserva Emergência</span>
                                        <span className="font-bold text-blue-600">30%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full w-[30%] bg-blue-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 (Reversed) */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-slate-900">Seu Consultor de Bolso (IA)</h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Em dúvida se pode gastar? Pergunte para a IA. Ela analisa seu histórico e diz: "Melhor esperar, sua fatura do cartão já está alta esse mês." É como ter um consultor financeiro 24h.
                            </p>
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl shadow-purple-900/20 rotate-1 hover:rotate-0 transition-transform duration-500 text-white relative">
                            <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">GEMINI AI INTEGRADO</div>
                            <div className="space-y-4 mt-4">
                                <div className="bg-white/10 p-3 rounded-lg rounded-tl-none w-[80%]">
                                    <p className="text-xs text-slate-300">Vale a pena comprar esse tênis agora?</p>
                                </div>
                                <div className="bg-brand-gold/20 p-3 rounded-lg rounded-tr-none w-[90%] ml-auto border border-brand-gold/30">
                                    <p className="text-xs text-brand-gold font-medium">Melhor não. Você já gastou 85% do seu orçamento de lazer. Que tal esperar o mês que vem?</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">O Que Dizem Nossos Membros</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: "Carla Mendes", role: "Designer", text: "Eu nunca consegui usar planilhas. O Finance Pro 360 foi a única coisa que funcionou pra mim pq é visual e simples.", rating: 5 },
                            { name: "Roberto Silva", role: "Engenheiro", text: "A função de importar extrato me economiza umas 2 horas por mês. Sensacional.", rating: 5 },
                            { name: "Ana Paula", role: "Autônoma", text: "Finalmente consegui juntar dinheiro pra minha reserva. Ver a barra de progresso enchendo vicia!", rating: 5 },
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} className="text-yellow-400 fill-current" />)}
                                </div>
                                <p className="text-slate-600 mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`} alt={t.name} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                        <p className="text-xs text-slate-500">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Pricing Section Refined */}
            <section className="py-24 bg-white relative" id="pricing">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <span className="text-brand-blue font-bold tracking-wider text-sm uppercase">Oferta Exclusiva</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2 mb-6">Investimento Único</h2>
                        <p className="text-xl text-slate-600">
                            Sem mensalidades escondidas. Você paga uma vez e organiza sua vida.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-stretch">

                        {/* Option 1 */}
                        <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-slate-300 transition-all flex flex-col">
                            <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-4">Acesso Semestral</h3>
                            <div className="flex items-end gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900">R$ 47,90</span>
                                <span className="text-sm text-slate-400 font-bold mb-1">/ 6 meses</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex gap-3 text-slate-600 text-sm"><Check size={16} className="text-emerald-500" /> Tudo do painel principal</li>
                                <li className="flex gap-3 text-slate-600 text-sm"><Check size={16} className="text-emerald-500" /> Suporte por email</li>
                                <li className="flex gap-3 text-slate-600 text-sm"><Check size={16} className="text-emerald-500" /> Renovação manual</li>
                            </ul>
                            <a href="https://pay.kiwify.com.br/4A8FZ7I" className="w-full block text-center py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition-colors">
                                ESCOLHER SEMESTRAL
                            </a>
                        </div>

                        {/* Option 2 (Featured) */}
                        <div className="bg-slate-900 p-1 rounded-3xl relative shadow-2xl shadow-yellow-500/20 flex flex-col">
                            <div className="bg-slate-900 p-8 rounded-[22px] h-full flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-brand-gold text-brand-blue text-[10px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider z-10">
                                    Mais Vendido
                                </div>

                                <h3 className="text-lg font-bold text-brand-gold uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Star size={18} className="fill-brand-gold" /> Anual Premium
                                </h3>

                                <div className="flex items-end gap-1 mb-2">
                                    <span className="text-5xl font-black text-white">R$ 80,00</span>
                                    <span className="text-sm text-slate-400 font-bold mb-1">/ ano</span>
                                </div>
                                <p className="text-slate-400 text-xs mb-8">Equivalente a R$ 6,60 por mês</p>

                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex gap-3 text-white text-sm"><Check size={16} className="text-brand-gold" /> <b>Todos os recursos liberados</b></li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check size={16} className="text-brand-gold" /> Acesso à IA (Gemini)</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check size={16} className="text-brand-gold" /> Atualizações antecipadas</li>
                                    <li className="flex gap-3 text-slate-300 text-sm"><Check size={16} className="text-brand-gold" /> Prioridade no suporte</li>
                                </ul>

                                <a href="https://pay.kiwify.com.br/PZzs9Up" className="w-full block text-center py-4 rounded-xl bg-brand-gold hover:bg-yellow-400 text-brand-blue font-black transition-colors shadow-lg shadow-brand-gold/20">
                                    QUERO ACESSO TOTAL
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Tenho garantia?", a: "Sim! Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do seu dinheiro." },
                            { q: "Preciso pagar mensalidade?", a: "Não. O pagamento é único pelo período escolhido (6 meses ou 1 ano). Sem surpresas no cartão." },
                            { q: "Funciona no iPhone e Android?", a: "Sim! Funciona em qualquer dispositivo com navegador. Você pode instalar na tela inicial como um aplicativo." },
                            { q: "É seguro colocar meus dados?", a: "Totalmente. Não temos acesso aos seus dados bancários. O pagamento é processado pela Kiwify, uma das maiores plataformas do Brasil." }
                        ].map((item, index) => (
                            <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-800">{item.q}</span>
                                    {openFaq === index ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </button>
                                {openFaq === index && (
                                    <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-50 animate-fade-in-down">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <Logo className="w-6 h-6 text-white" />
                        <span className="font-bold text-white">Finance Pro 360</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 grayscale opacity-50 hover:opacity-100 transition-opacity">
                            <ShieldCheck size={16} /> <span className="text-xs font-bold">Ambiente Seguro</span>
                        </div>
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()}
                    </div>
                </div>
            </footer>
        </div>
    );
};
