
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppConfig, Investment, InvestmentType } from '../types';
import { Lock, Crown, CheckCircle, TrendingUp, BarChart4, PieChart as PieChartIcon, Calculator, Landmark, ArrowRight, AlertTriangle, AlertCircle, Calendar, RefreshCw, Sparkles, BrainCircuit, Wallet, ArrowUpRight, PiggyBank, Info, ChevronRight, Plus, Trash2, X, Target, Zap, Coffee, Flame } from 'lucide-react';
import { formatCurrency, generateId } from '../utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Cell, BarChart, Bar, Pie, PieChart, Legend } from 'recharts';
import { DBService } from '../db';


interface InvestmentsProps {
    config: AppConfig;
    onNavigateToSettings: () => void;
}

type SubTab = 'portfolio' | 'suitability' | 'opportunities' | 'projection' | 'nubank' | 'passiveIncome';
type ProfileType = 'Conservador' | 'Moderado' | 'Arrojado' | null;

interface Opportunity {
    type: string;
    title: string;
    rate: string;
    min: number;
    risk: 'Baixo' | 'Médio' | 'Alto';
    profile: string[];
    change?: number;
    why: string;
}

export const Investments: React.FC<InvestmentsProps> = ({ config, onNavigateToSettings }) => {
    const [subTab, setSubTab] = useState<SubTab>('portfolio');
    const [categoryTab, setCategoryTab] = useState<'all' | 'fixa' | 'variavel' | 'fundos'>('all');

    // Portfolio States
    const [myInvestments, setMyInvestments] = useState<Investment[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInv, setNewInv] = useState<Partial<Investment>>({ type: 'fixed', date: new Date().toISOString().split('T')[0] });

    const [profile, setProfile] = useState<ProfileType>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showQuiz, setShowQuiz] = useState(false);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [lastUpdateDate, setLastUpdateDate] = useState('');
    const [aiInsight, setAiInsight] = useState<string>('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    // Projection States
    const [projInitial, setProjInitial] = useState(1000);
    const [projMonthly, setProjMonthly] = useState(500);
    const [projYears, setProjYears] = useState(10);
    const [projRate, setProjRate] = useState(10);
    const [projResult, setProjResult] = useState<{ data: any[], totalInvested: number, totalInterest: number, totalAmount: number } | null>(null);

    // Nubank Simulator States
    const [nuInitial, setNuInitial] = useState(1000);
    const [nuMonthly, setNuMonthly] = useState(200);
    const [nuMonths, setNuMonths] = useState(12);
    const [nuCDI, setNuCDI] = useState(10.75); // Benchmark CDI atual

    // Passive Income States (Fogo Financeiro)
    const [piGoal, setPiGoal] = useState<number>(5000); // R$ 5k a month
    const [piRate, setPiRate] = useState<number>(0.8); // 0.8% a.m average yield

    const isPremium = config.licenseStatus === 'active';
    const currency = config.currency || 'BRL';

    useEffect(() => {
        const savedProfile = localStorage.getItem(`fp360_investor_profile_${config.userId}`);
        if (savedProfile) setProfile(savedProfile as ProfileType);
        generateDailyOpportunities();
        loadInvestments();
    }, [config.userId]);

    const loadInvestments = async () => {
        if (!config.userId) return;
        const data = await DBService.getInvestments(config.userId);
        setMyInvestments(data);
        if (data.length === 0) {
            // setSubTab('opportunities'); // Removido para permitir ver o estado vazio da carteira
        }
    };

    const handleAddInvestment = async () => {
        if (!newInv.name || !newInv.amount || !config.userId) return;

        const investment: Investment = {
            id: generateId(),
            userId: config.userId,
            name: newInv.name,
            type: newInv.type as InvestmentType,
            amount: Number(newInv.amount),
            currentValue: Number(newInv.currentValue || newInv.amount),
            date: newInv.date || new Date().toISOString(),
            rate: newInv.rate
        };

        try {
            await DBService.saveInvestment(investment);
            setMyInvestments(prev => [investment, ...prev]);
            setShowAddModal(false);
            setNewInv({ type: 'fixed', date: new Date().toISOString().split('T')[0], name: '', amount: 0, currentValue: 0, rate: '' });
        } catch (error) {
            alert('Erro ao salvar investimento');
        }
    };

    const handleDeleteInvestment = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este investimento?')) {
            await DBService.deleteInvestment(id);
            setMyInvestments(prev => prev.filter(i => i.id !== id));
        }
    };

    const portfolioStats = useMemo(() => {
        const totalInvested = myInvestments.reduce((sum, i) => sum + i.amount, 0);
        const totalCurrent = myInvestments.reduce((sum, i) => sum + (i.currentValue || i.amount), 0);
        const profit = totalCurrent - totalInvested;
        const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

        const allocation = [
            { name: 'Renda Fixa', value: myInvestments.filter(i => i.type === 'fixed').reduce((s, i) => s + (i.currentValue || i.amount), 0), color: '#3b82f6' },
            { name: 'Renda Variável', value: myInvestments.filter(i => i.type === 'variable').reduce((s, i) => s + (i.currentValue || i.amount), 0), color: '#8b5cf6' },
            { name: 'Fundos', value: myInvestments.filter(i => i.type === 'fund').reduce((s, i) => s + (i.currentValue || i.amount), 0), color: '#10b981' },
            { name: 'Cripto', value: myInvestments.filter(i => i.type === 'crypto').reduce((s, i) => s + (i.currentValue || i.amount), 0), color: '#f59e0b' },
            { name: 'Outros', value: myInvestments.filter(i => i.type === 'other').reduce((s, i) => s + (i.currentValue || i.amount), 0), color: '#64748b' },
        ].filter(i => i.value > 0);

        // Estima dividendos mensais base: 0.8% sobre total investido menos cripto (simplificação)
        const totalYielding = myInvestments.filter(i => i.type !== 'crypto').reduce((s, i) => s + (i.currentValue || i.amount), 0);
        const estimatedDividends = totalYielding * (0.8 / 100);

        return { totalInvested, totalCurrent, profit, profitPct, allocation, estimatedDividends };
    }, [myInvestments]);

    const generateDailyOpportunities = (forceRefresh = false) => {
        const today = new Date();
        setLastUpdateDate(today.toLocaleDateString('pt-BR'));

        // Se for refresh manual (forceRefresh), usa um número aleatório. Se não, usa a data do dia.
        const baseSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const seedText = forceRefresh ? Math.random() * 10000 : baseSeed;

        const seededRandom = (modifier: number) => {
            const x = Math.sin(seedText + modifier) * 10000;
            return x - Math.floor(x);
        };

        const banks = ['Banco Master', 'Banco Pine', 'Sofisa Direto', 'C6 Bank', 'BTG Pactual', 'Daycoval', 'Inter', 'Banco Bari', 'Digio', 'PagBank'];
        const fiis = ['MXRF11', 'HGLG11', 'XPML11', 'BTLG11', 'VISC11', 'KNCR11', 'VGHF11', 'TRXF11', 'HGRU11', 'CPTS11', 'RECR11'];
        const stocks = ['VALE3', 'PETR4', 'WEGE3', 'ITUB4', 'BBAS3', 'PRIO3', 'RADL3', 'RENT3', 'B3SA3', 'RAIL3', 'CSAN3'];
        const etfs = ['IVVB11', 'WRLD11', 'NASD11', 'HASH11', 'SMAL11', 'BOVA11'];
        const bdrs = ['AAPL34', 'MSFT34', 'GOGL34', 'AMZO34', 'TSLA34', 'NFLX34'];
        const funds = ['Alaska Black', 'Verde AM', 'Dynamo Cougar', 'Occam Retorno', 'Kinea Chronos', 'Legacy Capital'];

        const dailyOps: Opportunity[] = [
            // --- RENDA FIXA ---
            { type: 'Poupança', title: 'Poupança (Regra Nova)', rate: '6.17% a.a. + TR', min: 0, risk: 'Baixo', profile: ['Conservador'], why: 'Liquidez imediata e isenção de IR, mas com rendimento baixo.' },
            { type: 'Tesouro Direto', title: `Tesouro IPCA+ ${2029 + Math.floor(seededRandom(5) * 16)}`, rate: `IPCA + ${(6.0 + seededRandom(6) * 0.6).toFixed(2)}%`, min: 35, risk: 'Baixo', profile: ['Conservador', 'Moderado'], why: 'Segurança do governo com proteção contra inflação.' },
            { type: 'CDB', title: `CDB ${banks[Math.floor(seededRandom(1) * banks.length)]}`, rate: `${(110 + Math.floor(seededRandom(2) * 20))}% CDI`, min: 1000, risk: 'Baixo', profile: ['Conservador', 'Moderado'], why: 'Rentabilidade acima da poupança com garantia do FGC.' },
            { type: 'LCI', title: `LCI IPCA+ ${banks[Math.floor(seededRandom(3) * banks.length)]}`, rate: `IPCA + ${(4.5 + seededRandom(4) * 2.5).toFixed(1)}%`, min: 5000, risk: 'Baixo', profile: ['Conservador', 'Moderado'], why: 'Isento de IR para pessoa física e garantia do FGC.' },
            { type: 'LCA', title: `LCA ${banks[Math.floor(seededRandom(22) * banks.length)]}`, rate: `${(90 + Math.floor(seededRandom(23) * 10))}% CDI`, min: 1000, risk: 'Baixo', profile: ['Conservador', 'Moderado'], why: 'Invista no agronegócio com isenção de imposto de renda.' },
            { type: 'CRI', title: 'CRI Pulverizado', rate: `IPCA + ${(7.0 + seededRandom(24) * 2).toFixed(1)}%`, min: 1000, risk: 'Médio', profile: ['Moderado', 'Arrojado'], why: 'Isento de IR, lastro em créditos imobiliários. Sem FGC.' },
            { type: 'CRA', title: 'CRA Corporativo', rate: `CDI + ${(3.0 + seededRandom(25) * 2).toFixed(1)}%`, min: 1000, risk: 'Médio', profile: ['Moderado', 'Arrojado'], why: 'Isento de IR, lastro no agronegócio. Sem FGC.' },
            { type: 'LC', title: `LC ${banks[Math.floor(seededRandom(26) * banks.length)]}`, rate: `${(118 + Math.floor(seededRandom(27) * 10))}% CDI`, min: 5000, risk: 'Baixo', profile: ['Moderado'], why: 'Similar ao CDB, emitido por financeiras. Garantia FGC.' },
            { type: 'Debêntures', title: 'Debênture Incentivada Vale', rate: `IPCA + ${(6.5 + seededRandom(28) * 1.5).toFixed(1)}%`, min: 1000, risk: 'Médio', profile: ['Moderado', 'Arrojado'], why: 'Isento de IR, dívida de grandes empresas. Sem FGC.' },
            { type: 'LF', title: `LF ${banks[Math.floor(seededRandom(29) * banks.length)]}`, rate: `${(112 + Math.floor(seededRandom(30) * 5))}% CDI`, min: 50000, risk: 'Baixo', profile: ['Conservador', 'Moderado'], why: 'Letra Financeira, prazo mais longo (min 2 anos), menor alíquota de IR.' },

            // --- RENDA VARIÁVEL ---
            { type: 'Ações', title: stocks[Math.floor(seededRandom(10) * stocks.length)], rate: `Potencial +${(15 + Math.floor(seededRandom(11) * 25))}%`, min: 20, risk: 'Alto', profile: ['Arrojado'], change: (seededRandom(12) - 0.5) * 5, why: 'Torne-se sócio de grandes empresas listadas na bolsa.' },
            { type: 'BDRs', title: bdrs[Math.floor(seededRandom(31) * bdrs.length)], rate: 'Dolarizado', min: 50, risk: 'Alto', profile: ['Arrojado'], change: (seededRandom(32) - 0.5) * 4, why: 'Invista em empresas americanas diretamente pela B3.' },
            { type: 'FIIs', title: fiis[Math.floor(seededRandom(7) * fiis.length)], rate: `DY ${(10.5 + seededRandom(8) * 3.5).toFixed(2)}% a.a.`, min: 10, risk: 'Médio', profile: ['Moderado', 'Arrojado'], change: (seededRandom(9) - 0.4) * 1.8, why: 'Renda mensal isenta de IR com imóveis.' },
            { type: 'ETFs', title: etfs[Math.floor(seededRandom(17) * etfs.length)], rate: 'Variação do Índice', min: 100, risk: 'Alto', profile: ['Arrojado', 'Moderado'], change: (seededRandom(18) - 0.45) * 3, why: 'Diversificação instantânea em uma cesta de ativos.' },

            // --- FUNDOS ---
            { type: 'Fundo Invest', title: funds[Math.floor(seededRandom(33) * funds.length)], rate: 'Hist. 140% CDI', min: 500, risk: 'Médio', profile: ['Moderado', 'Arrojado'], change: (seededRandom(34) - 0.2) * 2, why: 'Gestão profissional para alocar seu patrimônio.' },
            { type: 'Fundo Imobiliário', title: fiis[Math.floor(seededRandom(35) * fiis.length)], rate: `DY ${(9.5 + seededRandom(36) * 3.0).toFixed(2)}% a.a.`, min: 10, risk: 'Médio', profile: ['Moderado', 'Arrojado'], change: (seededRandom(37) - 0.4) * 1.8, why: 'Receba aluguéis mensais.' }
        ];

        setOpportunities(dailyOps);
    };

    const fetchAiInsight = async () => {
        setIsLoadingAi(true);
        // Fallback estático seguro enquanto migramos para o backend via Edge Function
        setTimeout(() => {
            setAiInsight("O mercado segue em volatilidade, priorize ativos de renda fixa pós-fixados para capturar a taxa Selic alta.");
            setIsLoadingAi(false);
        }, 1000);
    };

    useEffect(() => {
        if (isPremium && profile && !aiInsight) fetchAiInsight();
    }, [isPremium, profile]);

    const calculateProfile = () => {
        let total = 0;
        Object.values(answers).forEach((p: any) => { total += Number(p); });
        let res: ProfileType = 'Conservador';
        if (total >= 5 && total <= 7) res = 'Moderado';
        if (total > 7) res = 'Arrojado';
        setProfile(res);
        setShowQuiz(false);
        localStorage.setItem(`fp360_investor_profile_${config.userId}`, res);
    };

    // Função de cálculo pura para ser reutilizada
    const performProjectionCalculation = (initial: number, monthly: number, years: number, rate: number) => {
        const months = years * 12;
        const monthlyRate = Math.pow(1 + (rate / 100), 1 / 12) - 1;
        let current = initial;
        let totalInv = initial;
        const data = [];
        for (let i = 1; i <= months; i++) {
            current = current * (1 + monthlyRate) + monthly;
            totalInv += monthly;
            data.push({ name: `${i}º Mês`, Investido: Math.round(totalInv), Total: Math.round(current) });
        }
        setProjResult({ data, totalInvested: totalInv, totalInterest: current - totalInv, totalAmount: current });
    };

    const calculateProjection = () => {
        performProjectionCalculation(projInitial, projMonthly, projYears, projRate);
    };

    // --- LÓGICA DE SIMULAÇÃO DE OPORTUNIDADE ---
    const handleSimulateOpportunity = (opt: Opportunity) => {
        // 1. Converter a string de taxa (ex: "115% CDI") para um número anual
        let estimatedRate = 10; // default
        const rateStr = opt.rate.toUpperCase();

        if (rateStr.includes('% CDI')) {
            const pct = parseFloat(rateStr.replace('% CDI', ''));
            estimatedRate = (nuCDI * pct) / 100;
        } else if (rateStr.includes('IPCA +')) {
            const bonus = parseFloat(rateStr.replace('IPCA +', '').replace('%', ''));
            estimatedRate = 4.5 + bonus; // Estimativa IPCA 4.5% + taxa do ativo
        } else if (rateStr.includes('DY')) {
            estimatedRate = parseFloat(rateStr.replace('DY', '').replace('% A.A.', ''));
        } else if (rateStr.includes('POTENCIAL +')) {
            estimatedRate = parseFloat(rateStr.replace('POTENCIAL +', '').replace('%', ''));
        }

        // 2. Atualizar os estados do simulador
        setProjInitial(opt.min);
        setProjRate(Number(estimatedRate.toFixed(2)));

        // 3. Mudar de aba
        setSubTab('projection');

        // 4. Executar o cálculo imediatamente com os novos valores
        // (Como o estado do React é assíncrono, passamos os valores diretos aqui)
        performProjectionCalculation(opt.min, projMonthly, projYears, estimatedRate);

        // Scroll para o topo para o usuário ver a mudança
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- LÓGICA DO SIMULADOR NUBANK ---
    const nuResult = useMemo(() => {
        const monthlyRate = Math.pow(1 + (nuCDI / 100), 1 / 12) - 1;
        let totalGross = nuInitial;
        let totalInvested = nuInitial;

        for (let i = 0; i < nuMonths; i++) {
            totalGross = totalGross * (1 + monthlyRate) + nuMonthly;
            totalInvested += nuMonthly;
        }

        const totalInterest = totalGross - totalInvested;

        // Tabela Regressiva IR
        let irRate = 0.225;
        const days = nuMonths * 30;
        if (days > 720) irRate = 0.15;
        else if (days > 360) irRate = 0.175;
        else if (days > 180) irRate = 0.20;

        const irValue = totalInterest * irRate;
        const totalNet = totalGross - irValue;

        return { totalInvested, totalInterest, irValue, totalNet, irRatePercent: irRate * 100 };
    }, [nuInitial, nuMonthly, nuMonths, nuCDI]);

    if (!isPremium) {
        return (
            <div className="h-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                <div className="text-center max-w-lg z-10 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-amber-600 dark:text-amber-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Investimentos Premium</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">Desbloqueie recomendações diárias de IA, simuladores de bancos e análise de suitability.</p>
                    <button onClick={onNavigateToSettings} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 shadow-md shadow-amber-500/20">Upgrade para Premium</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Premium segmented controls tabs */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex overflow-x-auto hide-scrollbar snap-x relative shadow-inner">
                {(['portfolio', 'opportunities', 'passiveIncome', 'nubank', 'suitability', 'projection'] as SubTab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setSubTab(t)}
                        className={`
                            relative flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 snap-center
                            ${subTab === t
                                ? 'text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}
                        `}
                    >
                        {/* Indicador Ativo (Pílula branca/escura que fica por trás do texto) */}
                        {subTab === t && (
                            <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 -z-10 animate-fade-in" />
                        )}

                        <span className="flex items-center justify-center gap-2">
                            {t === 'portfolio' ? <Wallet size={16} className={subTab === t ? 'text-blue-500' : ''} /> :
                                t === 'opportunities' ? <Sparkles size={16} className={subTab === t ? 'text-blue-500' : ''} /> :
                                    t === 'nubank' ? <PiggyBank size={16} className={subTab === t ? 'text-purple-500' : ''} /> :
                                        t === 'suitability' ? <Target size={16} className={subTab === t ? 'text-blue-500' : ''} /> :
                                            t === 'passiveIncome' ? <Coffee size={16} className={subTab === t ? 'text-amber-500' : ''} /> :
                                                <Calculator size={16} className={subTab === t ? 'text-blue-500' : ''} />}

                            {t === 'portfolio' ? 'Carteira' :
                                t === 'opportunities' ? 'Oportunidades' :
                                    t === 'nubank' ? 'Nubank' :
                                        t === 'suitability' ? 'Suitability' :
                                            t === 'passiveIncome' ? 'Renda Passiva' : 'Projeção'}
                        </span>
                    </button>
                ))}
            </div>

            {subTab === 'portfolio' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Portfolio Summary - Premium Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1: Patrimônio Bruto (Glassmorphism + Gradiente) */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-black p-6 rounded-2xl border border-slate-700 shadow-xl group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/30 transition-all"></div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Wallet size={12} /> Patrimônio Bruto</p>
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(portfolioStats.totalCurrent, currency)}</h3>
                                </div>

                                <div className="mt-6 flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-inner backdrop-blur-md border ${portfolioStats.profit >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                        <TrendingUp size={12} className={portfolioStats.profit < 0 ? 'rotate-180' : ''} />
                                        {Math.abs(portfolioStats.profitPct).toFixed(2)}%
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium tracking-wide">Rentabilidade da Carteira</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Total Investido e Proventos Básicos */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><PiggyBank size={12} className="text-blue-500" /> Total Desembolsado</p>
                                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatCurrency(portfolioStats.totalInvested, currency)}</h3>
                                <div className="mt-2 text-xs font-medium text-slate-500">
                                    Resultado Líquido: <span className={`font-bold ml-1 ${portfolioStats.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{portfolioStats.profit >= 0 ? '+' : ''}{formatCurrency(portfolioStats.profit, currency)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5"><Zap size={10} className="inline text-amber-500 mb-0.5" /> Est. Dividendos / Mês</p>
                                    <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(portfolioStats.estimatedDividends, currency)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Call to Action Dinâmico */}
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-blue-600 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-12 h-12 bg-blue-200 text-blue-600 dark:bg-blue-800 dark:text-blue-300 group-hover:bg-white/20 group-hover:text-white rounded-full flex items-center justify-center mb-3 shadow-inner transition-colors duration-300">
                                    <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                                </div>
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 group-hover:text-white transition-colors duration-300">Gravar Aporte</h3>
                                <p className="text-blue-600/70 dark:text-blue-400/70 text-xs font-medium group-hover:text-blue-100 transition-colors duration-300 mt-1">Registrar novo ativo</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Allocation Chart */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1 min-h-[300px] flex flex-col">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <PieChartIcon size={18} className="text-blue-500" /> Alocação por Tipo
                            </h4>
                            <div className="flex-1">
                                {portfolioStats.allocation.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={portfolioStats.allocation}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {portfolioStats.allocation.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0];
                                                        return (
                                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.color }}></div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase font-bold text-slate-500">{data.name}</p>
                                                                    <p className="font-bold text-slate-800 dark:text-white">{formatCurrency(data.value as number, currency)}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <PieChartIcon size={48} className="opacity-20 mb-2" />
                                        <p className="text-xs">Sem dados para gráfico</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Investments List */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart4 size={18} className="text-blue-500" /> Meus Ativos
                            </h4>
                            <div className="overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                {myInvestments.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 mt-2">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="w-20 h-20 mb-4 relative z-10 group cursor-pointer" onClick={() => setShowAddModal(true)}>
                                            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg group-hover:bg-blue-400/40 transition-all duration-500"></div>
                                            <div className="relative bg-white dark:bg-slate-800 border-[3px] border-blue-50 dark:border-blue-900 shadow-lg w-full h-full rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                                <Wallet size={32} className="text-blue-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 z-10 tracking-tight">Comece a Investir</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mb-6 z-10 leading-relaxed">
                                            Sua carteira está vazia. Registre seu primeiro aporte para iniciar sua jornada financeira inteligente.
                                        </p>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg border border-transparent shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Fazer Aporte
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myInvestments.map(item => (
                                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group overflow-hidden relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>
                                                <div className="flex items-center gap-4 mb-3 sm:mb-0 ml-2">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm uppercase shadow-sm border
                                                        ${item.type === 'fixed' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50' :
                                                            item.type === 'variable' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:border-purple-800/50' :
                                                                item.type === 'fund' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50' :
                                                                    item.type === 'crypto' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800/50' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                        {item.type.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 dark:text-white text-base leading-tight">{item.name}</h5>
                                                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                            <Calendar size={10} /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto ml-2 sm:ml-0">
                                                    <div className="flex flex-col items-start sm:items-end">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saldo Atual</span>
                                                        <span className="font-mono text-lg font-black text-slate-700 dark:text-slate-200 tracking-tight">{formatCurrency(item.currentValue || item.amount, currency)}</span>
                                                    </div>
                                                    <div className="border-l border-slate-100 dark:border-slate-700 pl-4">
                                                        <button onClick={() => handleDeleteInvestment(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all p-0">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white">Adicionar Investimento</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Ativo</label>
                                <input type="text" value={newInv.name || ''} onChange={e => setNewInv({ ...newInv, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: CDB Banco Inter, PETR4..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                    <select value={newInv.type} onChange={e => setNewInv({ ...newInv, type: e.target.value as any })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none">
                                        <option value="fixed">Renda Fixa</option>
                                        <option value="variable">Renda Variável</option>
                                        <option value="fund">Fundos</option>
                                        <option value="crypto">Criptomoedas</option>
                                        <option value="other">Outros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                                    <input type="date" value={newInv.date} onChange={e => setNewInv({ ...newInv, date: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Investido</label>
                                    <input type="number" value={newInv.amount || ''} onChange={e => setNewInv({ ...newInv, amount: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Atual (Opcional)</label>
                                    <input type="number" value={newInv.currentValue || ''} onChange={e => setNewInv({ ...newInv, currentValue: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm">Cancelar</button>
                            <button onClick={handleAddInvestment} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md">Salvar Investimento</button>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'passiveIncome' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex flex-col items-center justify-center shrink-0 shadow-inner">
                            <Flame size={40} className="text-amber-100 drop-shadow-md animate-pulse" />
                        </div>
                        <div className="relative z-10 flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black mb-2 tracking-tight">Simulador F.I.R.E.</h2>
                            <p className="text-amber-100 font-medium">Financial Independence, Retire Early - Descubra o patrimônio necessário para viver exclusivamente de renda passiva mensal.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm space-y-6 h-fit">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Target size={18} className="text-amber-500" /> Seus Objetivos</h3>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400">Renda Mensal Desejada</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                    <input type="number" value={piGoal} onChange={e => setPiGoal(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500/20 transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400">Taxa de Rendimento Mensal (% a.m.)</label>
                                <input type="number" step="0.1" value={piRate} onChange={e => setPiRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold text-sm outline-none mt-1 transition-all focus:ring-2 focus:ring-amber-500/20" />
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col justify-center h-full relative overflow-hidden min-h-[300px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                            {/* Calculation inline for reactivity */}
                            {(() => {
                                const requiredPatrimony = piRate > 0 ? piGoal / (piRate / 100) : 0;
                                const currentYielding = portfolioStats.totalInvested; // Simples
                                const progressRaw = requiredPatrimony > 0 ? (currentYielding / requiredPatrimony) * 100 : 0;
                                const progress = Math.min(progressRaw, 100);

                                return (
                                    <div className="relative z-10 flex flex-col justify-center h-full">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Patrimônio Mágico Necessário</h3>
                                        <div className="text-4xl sm:text-5xl md:text-6xl font-black text-center text-slate-800 dark:text-white tracking-tighter my-6">
                                            {formatCurrency(requiredPatrimony, currency)}
                                        </div>

                                        <div className="mt-8 space-y-5">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status Atual</p>
                                                    <p className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(currentYielding, currency)} acumulado</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-amber-500">{progress.toFixed(2)}%</p>
                                                </div>
                                            </div>

                                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner p-0.5">
                                                <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${Math.max(progress, 1)}%` }}></div>
                                            </div>

                                            <div className="flex justify-center pt-2">
                                                {progress < 100 ? (
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        Faltam <span className="font-bold text-amber-600 dark:text-amber-400 mx-1">{formatCurrency(Math.max(requiredPatrimony - currentYielding, 0), currency)}</span> para sua liberdade.
                                                    </p>
                                                ) : (
                                                    <p className="text-xs font-bold text-emerald-600 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                                                        <CheckCircle size={14} /> Você atingiu a Independência Financeira!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'nubank' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-[#820ad1] text-white rounded-lg">
                                <PiggyBank size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Caixinhas do Nubank</h3>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Quanto você tem hoje?</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                <input type="number" value={nuInitial} onChange={e => setNuInitial(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#820ad1]/20" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Quanto guardará por mês?</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                <input type="number" value={nuMonthly} onChange={e => setNuMonthly(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#820ad1]/20" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Por quanto tempo? ({nuMonths} meses)</label>
                            <input type="range" min="1" max="60" value={nuMonths} onChange={e => setNuMonths(Number(e.target.value))} className="w-full accent-[#820ad1] mt-2" />
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                                <span>1 Mês</span>
                                <span>5 Anos</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Taxa CDI Atual</label>
                                <span className="text-xs font-bold text-[#820ad1]">{nuCDI}% a.a.</span>
                            </div>
                            <input type="number" step="0.01" value={nuCDI} onChange={e => setNuCDI(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 font-bold text-sm outline-none" />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#820ad1] p-8 rounded-xl text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-2">Resultado Líquido Estimado</p>
                                <h2 className="text-5xl font-bold mb-6">{formatCurrency(nuResult.totalNet, currency)}</h2>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-purple-300 text-[10px] font-bold uppercase">Total Guardado</p>
                                        <p className="text-lg font-bold">{formatCurrency(nuResult.totalInvested, currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-purple-300 text-[10px] font-bold uppercase">Rendimento Bruto</p>
                                        <p className="text-lg font-bold text-emerald-300">+{formatCurrency(nuResult.totalInterest, currency)}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                        <p className="text-purple-300 text-[10px] font-bold uppercase flex items-center gap-1">Imposto de Renda <Info size={10} /></p>
                                        <p className="text-lg font-bold text-rose-300">-{formatCurrency(nuResult.irValue, currency)}</p>
                                        <span className="text-[9px] font-bold bg-white/10 px-1.5 rounded">Alíquota de {nuResult.irRatePercent}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-xl -mr-20 -mt-20"></div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart4 size={18} className="text-[#820ad1]" /> Comparativo de Acúmulo
                            </h4>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Investido', valor: nuResult.totalInvested, color: '#94a3b8' },
                                        { name: 'Bruto', valor: nuResult.totalInvested + nuResult.totalInterest, color: '#c084fc' },
                                        { name: 'Líquido', valor: nuResult.totalNet, color: '#820ad1' }
                                    ]}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                                        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                                            {[0, 1, 2].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : index === 1 ? '#c084fc' : '#820ad1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
                                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                    <AlertCircle size={12} className="text-blue-500" /> Sobre a tributação:
                                </p>
                                O Nubank utiliza a tabela regressiva de IR para Renda Fixa. O imposto incide apenas sobre o rendimento e a alíquota cai conforme o tempo: até 180 dias (22,5%), até 360 dias (20%), até 720 dias (17,5%) e acima de 720 dias (15%).
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'opportunities' && (
                <div className="space-y-6">
                    {/* IA Insight Header */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 border border-white/30">
                                <BrainCircuit size={32} className="text-blue-100" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2">
                                    <Sparkles size={18} className="text-amber-300" /> Insight do Consultor Financeiro IA
                                </h3>
                                <div className="mt-2 text-blue-50/90 text-sm leading-relaxed italic">
                                    {isLoadingAi ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw size={14} className="animate-spin" /> Analisando o mercado em tempo real...
                                        </div>
                                    ) : aiInsight}
                                </div>
                            </div>
                            <div className="hidden lg:block text-right">
                                <p className="text-[10px] uppercase font-bold text-blue-200 tracking-widest">Seu Perfil</p>
                                <p className="text-xl font-bold">{profile || 'NÃO DEFINIDO'}</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-xl -mr-20 -mt-20"></div>
                    </div>

                    {/* Market Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors hover:shadow-md">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa Selic</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">10.75%</p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors hover:shadow-md">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CDI Hoje</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">10.65%</p>
                            </div>
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <BarChart4 size={20} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors hover:shadow-md">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IPCA (12m)</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">4.50%</p>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-lg text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors hover:shadow-md">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poupança</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">6.17% + TR</p>
                            </div>
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <PiggyBank size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Landmark className="text-emerald-500" size={20} /> Oportunidades do Dia <span className="text-xs font-normal text-slate-400">({lastUpdateDate})</span>
                        </h3>
                        <button onClick={() => generateDailyOpportunities(true)} className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"><RefreshCw size={12} /> Atualizar</button>
                    </div>


                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar">
                        {(['all', 'fixa', 'variavel', 'fundos'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryTab(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${categoryTab === cat
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                {cat === 'all' ? 'Todos' : cat === 'fixa' ? 'Renda Fixa' : cat === 'variavel' ? 'Renda Variável' : 'Fundos'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {opportunities.filter(o => {
                            // Removido filtro estrito de perfil para permitir visualização de todas as categorias
                            // if (profile && !o.profile.includes(profile)) return false;

                            if (categoryTab === 'all') return true;
                            if (categoryTab === 'fixa') return ['Poupança', 'Tesouro Direto', 'CDB', 'LCI', 'LCA', 'CRI', 'CRA', 'LC', 'Debêntures', 'LF'].includes(o.type);
                            if (categoryTab === 'variavel') return ['Ações', 'BDRs', 'FIIs', 'ETFs'].includes(o.type);
                            if (categoryTab === 'fundos') return ['Fundo Invest', 'Fundo Imobiliário'].includes(o.type);
                            return true;
                        }).map((opt, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[9px] font-bold text-slate-500 dark:text-slate-400 rounded uppercase tracking-tighter border border-slate-200 dark:border-slate-600">{opt.type}</span>
                                    {opt.change !== undefined && (
                                        <div className={`flex items-center gap-1 text-[10px] font-bold ${opt.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            <TrendingUp size={10} className={opt.change < 0 ? 'rotate-180' : ''} />
                                            {opt.change > 0 ? '+' : ''}{opt.change.toFixed(2)}%
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{opt.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{opt.why}</p>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">{opt.rate}</div>
                                <div className="flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Aplicação Mínima</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">{formatCurrency(opt.min, currency)}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-[9px] text-slate-400 uppercase font-bold mb-1.5">Nível de Risco</p>
                                        <div className="flex gap-1" title={opt.risk}>
                                            <div className={`w-3 h-1.5 rounded-full ${opt.risk === 'Baixo' || opt.risk === 'Médio' || opt.risk === 'Alto' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                            <div className={`w-3 h-1.5 rounded-full ${opt.risk === 'Médio' || opt.risk === 'Alto' ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                            <div className={`w-3 h-1.5 rounded-full ${opt.risk === 'Alto' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSimulateOpportunity(opt)}
                                    className="w-full mt-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all"
                                >
                                    Simular Investimento <ArrowUpRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'suitability' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
                    {!profile || showQuiz ? (
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Qual seu perfil de investidor?</h3>
                            <p className="text-slate-500 mb-8">Descubra como você lida com risco e rentabilidade.</p>
                            <div className="space-y-8">
                                {[
                                    { id: 1, t: "Objetivo Principal?", o: [{ l: "Preservação", p: 1 }, { l: "Crescimento Moderado", p: 2 }, { l: "Máxima Rentabilidade", p: 3 }] },
                                    { id: 2, t: "Tempo de Investimento?", o: [{ l: "Até 1 ano", p: 1 }, { l: "1 a 5 anos", p: 2 }, { l: "Mais de 5 anos", p: 3 }] },
                                    { id: 3, t: "Reação a quedas de 20%?", o: [{ l: "Venderia tudo", p: 1 }, { l: "Aguardaria", p: 2 }, { l: "Compraria mais", p: 3 }] }
                                ].map(q => (
                                    <div key={q.id}>
                                        <p className="font-bold text-slate-700 dark:text-slate-200 mb-4">{q.id}. {q.t}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {q.o.map((opt, i) => (
                                                <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: opt.p })} className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${answers[q.id] === opt.p ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'}`}>
                                                    {opt.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button disabled={Object.keys(answers).length < 3} onClick={calculateProfile} className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-all disabled:opacity-50">SALVAR PERFIL</button>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <Wallet size={48} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Seu Perfil Identificado</p>
                            <h2 className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-4">{profile}</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">Nossas recomendações de IA foram ajustadas para o seu nível de tolerância a riscos.</p>
                            <button onClick={() => setShowQuiz(true)} className="text-slate-400 hover:text-blue-600 font-bold text-sm">Refazer Teste de Suitability</button>
                        </div>
                    )}
                </div>
            )}

            {subTab === 'projection' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit space-y-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Calculator size={18} className="text-blue-500" /> Simulador de Juros</h3>
                        <div><label className="text-[10px] font-bold uppercase text-slate-400">Aporte Inicial</label><input type="number" value={projInitial} onChange={e => setProjInitial(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold mt-1" /></div>
                        <div><label className="text-[10px] font-bold uppercase text-slate-400">Aporte Mensal</label><input type="number" value={projMonthly} onChange={e => setProjMonthly(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold mt-1" /></div>
                        <div><label className="text-[10px] font-bold uppercase text-slate-400">Rentabilidade (% a.a.)</label><input type="number" value={projRate} onChange={e => setProjRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold mt-1" /></div>
                        <div><label className="text-[10px] font-bold uppercase text-slate-400">Tempo (Anos: {projYears})</label><input type="range" min="1" max="40" value={projYears} onChange={e => setProjYears(Number(e.target.value))} className="w-full accent-blue-600 mt-2" /></div>
                        <button onClick={calculateProjection} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">Simular Crescimento</button>
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[400px]">
                        {projResult ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700"><p className="text-[10px] font-bold text-slate-400 uppercase">Investido</p><p className="text-sm font-bold">{formatCurrency(projResult.totalInvested, currency)}</p></div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800"><p className="text-[10px] font-bold text-emerald-500 uppercase">Juros</p><p className="text-sm font-bold text-emerald-600">{formatCurrency(projResult.totalInterest, currency)}</p></div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 col-span-2 sm:col-span-1"><p className="text-[10px] font-bold text-blue-500 uppercase">Final</p><p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(projResult.totalAmount, currency)}</p></div>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projResult.data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis hide />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-2xl">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">{label}</p>
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-1.5 h-6 rounded-full bg-blue-500"></div>
                                                                        <div>
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Patrimônio Final</p>
                                                                            <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(payload[0].value as number, currency)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-1.5 h-6 rounded-full bg-slate-400"></div>
                                                                        <div>
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Total Desembolsado</p>
                                                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{formatCurrency(payload[1].value as number, currency)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area type="monotone" dataKey="Total" stroke="#3b82f6" fill="url(#colorTotal)" strokeWidth={4} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                                            <Area type="monotone" dataKey="Investido" stroke="#94a3b8" fill="url(#colorInvestido)" strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0, fill: '#94a3b8' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300"><TrendingUp size={48} className="opacity-20 mb-4" /><p className="font-bold">Aperte em Simular para ver a projeção</p></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
