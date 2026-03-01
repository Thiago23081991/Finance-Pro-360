import React, { useState } from 'react';
import {
    CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, DollarSign,
    Lock, XCircle, Activity, Sparkles, Target, Check, Zap,
    HelpCircle, ChevronDown, ChevronUp, Star, Users, Trophy, Wallet, Smartphone
} from 'lucide-react';
import { Logo } from './Logo';

export const Presell: React.FC = () => {
    const handleCtaClick = () => {
        // Link direto para o checkout do plano anual (melhor oferta)
        window.location.href = 'https://pay.kiwify.com.br/PZzs9Up';
    };

    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const toggleFaq = (index: number) => setOpenFaq(openFaq === index ? null : index);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            {/* Top Attention Bar - Urgency */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-3 px-4 text-xs md:text-sm font-bold tracking-wide shadow-md relative z-50">
                <div className="animate-pulse flex items-center justify-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-black">OFERTA RELÂMPAGO</span>
                    <span>LIBERE SEU ACESSO VITALÍCIO POR MENOS DE UMA PIZZA 🍕</span>
                </div>
            </div>

            {/* Header / Nav */}
            <header className="py-6 px-4 md:px-8 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="bg-brand-blue p-1.5 rounded-lg shadow-sm">
                            <Logo className="w-6 h-6 text-brand-gold" />
                        </div>
                        <span className="text-xl font-black tracking-tight hidden md:block">
                            FINANCE <span className="text-brand-gold">PRO 360</span>
                        </span>
                    </div>
                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-6 py-2.5 bg-brand-blue text-white font-bold rounded-full hover:bg-slate-800 transition-all text-sm shadow-md hover:shadow-md transform hover:-translate-y-0.5"
                    >
                        Quero Organizar Minha Vida
                    </button>
                </div>
            </header>

            {/* Hero Section - High Impact */}
            <section className="pt-16 pb-24 px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
                <div className="max-w-5xl mx-auto text-center relative z-10">

                    {/* Social Proof Tag */}
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200 mb-8 animate-fade-in-down">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 45}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-yellow-400 fill-yellow-400" />)}
                            </div>
                            <span className="text-xs font-bold text-slate-600">+1.500 alunos</span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tight animate-fade-in-up">
                        Assuma o Controle Total<br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-500">Da Sua Vida Financeira.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
                        Chega de planilhas quebradas e apps complicados. Tenha um <b className="text-slate-900">CFO Pessoal com Inteligência Artificial</b> que te diz exatamente o que fazer com seu dinheiro.
                    </p>

                    <div className="flex flex-col items-center gap-4 animate-bounce-slow">
                        <button
                            onClick={handleCtaClick}
                            className="group relative inline-flex items-center justify-center gap-3 bg-brand-gold hover:bg-yellow-400 text-brand-blue text-lg md:text-2xl font-black py-6 px-12 rounded-xl shadow-xl shadow-yellow-500/20 transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto"
                        >
                            <span className="relative z-10">COMEÇAR AGORA</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={3} />
                            <div className="absolute inset-0 rounded-xl bg-white/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>

                        <div className="flex items-center gap-6 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">
                            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-500" /> Compra Segura</span>
                            <span className="flex items-center gap-1.5"><Trophy size={16} className="text-brand-gold" /> Garantia de 7 Dias</span>
                        </div>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-xl animate-pulse delay-75"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold/10 rounded-full blur-xl animate-pulse"></div>
                </div>
            </section>

            {/* UI Preview Section (Mockup) */}
            <section className="-mt-12 md:-mt-20 relative z-20 px-4 mb-24">
                <div className="max-w-5xl mx-auto bg-slate-900 rounded-xl p-2 md:p-3 shadow-md shadow-blue-900/20 border border-slate-800 transform rotate-1 hover:rotate-0 transition-transform duration-700">
                    <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                        {/* Placeholder for App Screenshot - Using CSS Art for now */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-4 mb-4 opacity-50">
                                <Activity size={48} className="text-blue-500" />
                                <Sparkles size={48} className="text-brand-gold" />
                                <Wallet size={48} className="text-emerald-500" />
                            </div>
                            <p className="text-slate-400 font-medium">Painel Financeiro Inteligente v2.0</p>
                            <p className="text-xs text-slate-600 mt-2 uppercase tracking-widest">Dashboard em Tempo Real</p>
                        </div>

                        {/* Status Bar Mockup */}
                        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points vs Solution */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-brand-blue font-bold tracking-wider text-sm uppercase bg-blue-50 px-3 py-1 rounded-full">O Jogo Virou</span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-4">Pare de Tentar Controlar Suas Finanças do Jeito Errado</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                        {/* Old Way */}
                        <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-400 mb-6 flex items-center gap-2">
                                <XCircle className="text-red-400 fill-red-50" /> O Jeito Antigo
                            </h3>
                            <ul className="space-y-5">
                                <li className="flex gap-3 text-slate-500 items-start"><span className="text-xl mt-[-3px]">😫</span> Planilhas que travam no celular</li>
                                <li className="flex gap-3 text-slate-500 items-start"><span className="text-xl mt-[-3px]">📉</span> Só sabe pra onde o dinheiro foi (passado)</li>
                                <li className="flex gap-3 text-slate-500 items-start"><span className="text-xl mt-[-3px]">🚫</span> Sem metas claras, sem motivação</li>
                                <li className="flex gap-3 text-slate-500 items-start"><span className="text-xl mt-[-3px]">😵‍💫</span> Fórmulas complicadas que dão erro</li>
                            </ul>
                        </div>

                        {/* New Way */}
                        <div className="bg-white p-8 rounded-xl shadow-xl shadow-emerald-900/10 border-2 border-emerald-500/20 relative">
                            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md rotate-3 uppercase">Método Aprovado</div>
                            <h3 className="text-xl font-black text-brand-blue mb-6 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500 fill-emerald-50" /> O Jeito Finance Pro
                            </h3>
                            <ul className="space-y-5">
                                <li className="flex gap-3 text-slate-800 font-bold items-start"><span className="text-xl mt-[-3px]">🚀</span> Funciona em qualquer celular ou PC</li>
                                <li className="flex gap-3 text-slate-800 font-bold items-start"><span className="text-xl mt-[-3px]">🤖</span> I.A. que planeja seu futuro (CRM)</li>
                                <li className="flex gap-3 text-slate-800 font-bold items-start"><span className="text-xl mt-[-3px]">🎯</span> Barras de progresso viciantes</li>
                                <li className="flex gap-3 text-slate-800 font-bold items-start"><span className="text-xl mt-[-3px]">✨</span> Tudo visual, sem tocar em fórmulas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>



            {/* Pricing Section - OPTIMIZED FOR CONVERSION */}
            <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative scroll-mt-20" id="pricing">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <span className="bg-brand-gold text-brand-blue font-black tracking-wider text-xs uppercase px-3 py-1 rounded">Oportunidade Única</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 mb-6">Investimento Inteligente</h2>
                        <p className="text-lg text-slate-600">
                            Escolha o plano que vai mudar sua relação com dinheiro. <b className="text-slate-900">Sem mensalidades recorrentes.</b>
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl mx-auto">

                        {/* ANCHOR OPTION (Less Value) */}
                        <div className="order-2 md:order-1 bg-white p-8 rounded-xl border border-slate-200 opacity-80 hover:opacity-100 transition-opacity flex flex-col items-center text-center">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Acesso Semestral</h3>

                            <div className="mb-6">
                                <span className="text-3xl font-bold text-slate-900">R$ 47,90</span>
                                <p className="text-xs text-slate-400 mt-1">Acesso por 6 meses</p>
                            </div>

                            <ul className="space-y-3 mb-8 w-full">
                                <li className="flex items-center gap-2 text-sm text-slate-600 w-full justify-center"><Check size={14} className="text-emerald-500" /> Dashboard Básico</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 w-full justify-center"><Check size={14} className="text-emerald-500" /> Controle de Gastos</li>
                            </ul>

                            <a href="https://pay.kiwify.com.br/4A8FZ7I" className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm">
                                Escolher Semestral
                            </a>
                        </div>

                        {/* HERO OPTION (Best Value) */}
                        <div className="order-1 md:order-2 bg-slate-900 p-1 rounded-[32px] relative shadow-md shadow-blue-900/30 transform scale-105 md:scale-110 z-10">
                            <div className="absolute -top-5 left-0 right-0 mx-auto w-fit bg-gradient-to-r from-brand-gold to-yellow-400 text-brand-blue font-black px-4 py-1.5 rounded-full shadow-md text-xs uppercase tracking-wide flex items-center gap-2">
                                <Star size={12} className="fill-brand-blue" />
                                Escolha da Maioria
                            </div>

                            <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 rounded-[28px] h-full flex flex-col relative overflow-hidden text-center">

                                <h3 className="text-brand-gold font-black uppercase tracking-widest text-sm mb-2">Acesso Anual Premium</h3>
                                <p className="text-slate-400 text-xs mb-6">O melhor custo-benefício do mercado</p>

                                <div className="mb-8 relative">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs text-slate-400 line-through">R$ 197,00</span>
                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">-60% OFF</span>
                                    </div>
                                    <div className="flex items-baseline justify-center gap-1 mt-1">
                                        <span className="text-lg text-slate-300 font-medium">12x de</span>
                                        <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">R$ 6,60</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium mt-2">ou R$ 80,00 à vista</p>
                                </div>

                                <div className="space-y-4 mb-8 text-left bg-white/5 p-6 rounded-xl border border-white/10">
                                    <li className="flex gap-3 text-white text-sm font-medium"><div className="bg-brand-gold/20 p-1 rounded text-brand-gold"><Zap size={14} /></div> Acesso Imediato a TUDO</li>
                                    <li className="flex gap-3 text-white text-sm font-medium"><div className="bg-brand-gold/20 p-1 rounded text-brand-gold"><Smartphone size={14} /></div> App Mobile + Desktop</li>
                                    <li className="flex gap-3 text-white text-sm font-medium"><div className="bg-brand-gold/20 p-1 rounded text-brand-gold"><Sparkles size={14} /></div> Consultor Financeiro I.A.</li>
                                    <li className="flex gap-3 text-white text-sm font-medium"><div className="bg-brand-gold/20 p-1 rounded text-brand-gold"><Users size={14} /></div> Suporte Prioritário</li>
                                </div>

                                <a href="https://pay.kiwify.com.br/PZzs9Up" className="group w-full py-5 rounded-xl bg-gradient-to-r from-brand-gold to-yellow-400 text-brand-blue font-black hover:brightness-110 transition-all shadow-md shadow-brand-gold/20 text-lg flex items-center justify-center gap-2">
                                    QUERO MEU ACESSO
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </a>

                                <div className="flex justify-center items-center gap-2 mt-4 text-[10px] text-slate-400 font-medium">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    Garantia de 7 dias ou seu dinheiro de volta
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Quem usa, recomenda</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: "Carla Mendes", role: "Designer", text: "Eu nunca consegui usar planilhas. O Finance Pro 360 foi a única coisa que funcionou pra mim pq é visual e simples. A IA é assustadoramente útil!", rating: 5 },
                            { name: "Roberto Silva", role: "Engenheiro", text: "A função de importar extrato me economiza umas 2 horas por mês de digitação. Pelo preço de um lanche, vale demais.", rating: 5 },
                            { name: "Ana Paula", role: "Autônoma", text: "Finalmente consegui juntar dinheiro pra minha reserva de emergência. Ver a barra de progresso enchendo vicia muito!", rating: 5 },
                        ].map((t, i) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="text-yellow-400 fill-current" />)}
                                </div>
                                <p className="text-slate-700 mb-6 text-sm leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
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

            {/* FAQ */}
            <section className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 text-balance">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Tenho garantia se eu não gostar?", a: "Sim! Você tem 7 dias de garantia incondicional. Se por qualquer motivo achar que não é pra você, devolvemos 100% do seu dinheiro sem perguntas." },
                            { q: "Preciso pagar mensalidade todo mês?", a: "Não! O pagamento é único pelo período escolhido (anual ou semestral). Sem pegadinhas ou cobranças surpresa no seu cartão." },
                            { q: "Funciona no iPhone e Android?", a: "Sim! O sistema roda direto no navegador e pode ser instalado na tela inicial como um aplicativo (PWA). Leve e rápido." },
                            { q: "Meus dados estão seguros?", a: "Totalmente. Utilizamos criptografia de ponta e não temos acesso aos seus dados bancários (senhas, etc). O pagamento é processado pela Kiwify, líder em segurança." }
                        ].map((item, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-800 text-sm md:text-base">{item.q}</span>
                                    {openFaq === index ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </button>
                                {openFaq === index && (
                                    <div className="p-6 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-50 animate-fade-in-down bg-slate-50/50">
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
                        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-help" title="Site protegido com SSL">
                            <ShieldCheck size={16} /> <span className="text-xs font-bold">Ambiente Seguro</span>
                        </div>
                    </div>
                    <div className="text-sm opacity-50">
                        &copy; {new Date().getFullYear()} Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
