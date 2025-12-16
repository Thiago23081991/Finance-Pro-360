
import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { Lock, Crown, CheckCircle, TrendingUp, BarChart4, PieChart, Calculator, Landmark, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface InvestmentsProps {
    config: AppConfig;
    onNavigateToSettings: () => void;
}

type SubTab = 'suitability' | 'opportunities' | 'projection';
type ProfileType = 'Conservador' | 'Moderado' | 'Arrojado' | null;

export const Investments: React.FC<InvestmentsProps> = ({ config, onNavigateToSettings }) => {
    const [subTab, setSubTab] = useState<SubTab>('suitability');
    
    // --- SUITABILITY STATE ---
    const [profile, setProfile] = useState<ProfileType>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showQuiz, setShowQuiz] = useState(false);

    // --- PROJECTION STATE ---
    const [projInitial, setProjInitial] = useState(1000);
    const [projMonthly, setProjMonthly] = useState(500);
    const [projYears, setProjYears] = useState(10);
    const [projRate, setProjRate] = useState(10); // % ao ano
    const [projResult, setProjResult] = useState<{data: any[], totalInvested: number, totalInterest: number, totalAmount: number} | null>(null);

    // Load profile from local storage to avoid DB changes for now
    useEffect(() => {
        const savedProfile = localStorage.getItem(`fp360_investor_profile_${config.userId}`);
        if (savedProfile) {
            setProfile(savedProfile as ProfileType);
        }
    }, [config.userId]);

    const isPremium = config.licenseStatus === 'active';
    const currency = config.currency || 'BRL';

    // --- LOGIC: SUITABILITY ---
    const questions = [
        {
            id: 1,
            text: "Qual é o seu principal objetivo ao investir?",
            options: [
                { text: "Preservar meu patrimônio, evitando perdas.", points: 1 },
                { text: "Equilíbrio entre segurança e rentabilidade.", points: 2 },
                { text: "Maximizar lucros, aceitando riscos altos.", points: 3 }
            ]
        },
        {
            id: 2,
            text: "Por quanto tempo pretende deixar o dinheiro investido?",
            options: [
                { text: "Menos de 1 ano (Curto prazo).", points: 1 },
                { text: "Entre 1 e 5 anos (Médio prazo).", points: 2 },
                { text: "Mais de 5 anos (Longo prazo).", points: 3 }
            ]
        },
        {
            id: 3,
            text: "O que você faria se seus investimentos caíssem 20% em um mês?",
            options: [
                { text: "Venderia tudo para não perder mais.", points: 1 },
                { text: "Manteria e aguardaria recuperação.", points: 2 },
                { text: "Aproveitaria para investir mais (comprar na baixa).", points: 3 }
            ]
        }
    ];

    const calculateProfile = () => {
        let totalPoints = 0;
        Object.values(answers).forEach(p => totalPoints += (p as number));
        
        let result: ProfileType = 'Conservador';
        if (totalPoints >= 5 && totalPoints <= 7) result = 'Moderado';
        if (totalPoints > 7) result = 'Arrojado';

        setProfile(result);
        setShowQuiz(false);
        localStorage.setItem(`fp360_investor_profile_${config.userId}`, result);
    };

    // --- LOGIC: PROJECTION ---
    const calculateProjection = () => {
        const months = projYears * 12;
        const monthlyRate = Math.pow(1 + (projRate / 100), 1 / 12) - 1;
        
        let currentAmount = projInitial;
        let totalInvested = projInitial;
        const data = [];

        for (let i = 1; i <= months; i++) {
            currentAmount = currentAmount * (1 + monthlyRate) + projMonthly;
            totalInvested += projMonthly;
            
            // Generate data points for chart (every year to reduce noise)
            if (i % 12 === 0 || i === 1) {
                data.push({
                    name: `Ano ${Math.ceil(i/12)}`,
                    Investido: Math.round(totalInvested),
                    Juros: Math.round(currentAmount - totalInvested),
                    Total: Math.round(currentAmount)
                });
            }
        }

        setProjResult({
            data,
            totalInvested,
            totalInterest: currentAmount - totalInvested,
            totalAmount: currentAmount
        });
    };

    useEffect(() => {
        if (subTab === 'projection') calculateProjection();
    }, [subTab]);


    // --- PREMIUM LOCK SCREEN ---
    if (!isPremium) {
        return (
            <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                <div className="text-center max-w-lg z-10 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-amber-600 dark:text-amber-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-center gap-2">
                        Recurso Premium <Crown size={24} className="text-amber-500" />
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Desbloqueie o módulo avançado de <strong>Investimentos</strong> para acessar:
                    </p>
                    <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Análise de Perfil (Suitability):</strong> Descubra se você é Conservador, Moderado ou Arrojado.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Recomendações Diárias:</strong> Melhores oportunidades em CDBs, LCI/LCA e Tesouro Direto.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Simulador de Futuro:</strong> Projeção financeira avançada com juros compostos.</span>
                        </li>
                    </ul>
                    <button 
                        onClick={onNavigateToSettings}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105"
                    >
                        Quero ser Premium
                    </button>
                </div>
            </div>
        );
    }

    // --- MAIN CONTENT (PREMIUM ONLY) ---
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Sub-Navigation */}
            <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700 pb-1">
                <button
                    onClick={() => setSubTab('suitability')}
                    className={`pb-2 px-1 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        subTab === 'suitability' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <PieChart size={18} /> Perfil de Investidor
                    {subTab === 'suitability' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setSubTab('opportunities')}
                    className={`pb-2 px-1 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        subTab === 'opportunities' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <Landmark size={18} /> Melhores Oportunidades
                    {subTab === 'opportunities' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setSubTab('projection')}
                    className={`pb-2 px-1 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        subTab === 'projection' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <TrendingUp size={18} /> Projeção Futura
                    {subTab === 'projection' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>
            </div>

            {/* 1. SUITABILITY CONTENT */}
            {subTab === 'suitability' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    {!profile || showQuiz ? (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Descubra seu Perfil</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Responda a 3 perguntas rápidas para que possamos recomendar os melhores investimentos para você.</p>
                            </div>
                            
                            <div className="space-y-6">
                                {questions.map(q => (
                                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-3">{q.id}. {q.text}</p>
                                        <div className="space-y-2">
                                            {q.options.map((opt, idx) => (
                                                <label key={idx} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                                    <input 
                                                        type="radio" 
                                                        name={`q-${q.id}`} 
                                                        className="w-4 h-4 text-blue-600"
                                                        onChange={() => setAnswers({...answers, [q.id]: opt.points})}
                                                    />
                                                    <span className="text-sm text-slate-600 dark:text-slate-300">{opt.text}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={calculateProfile}
                                disabled={Object.keys(answers).length < 3}
                                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Definir Meu Perfil
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Seu Perfil é</p>
                            <h2 className={`text-4xl font-black mb-4 ${
                                profile === 'Conservador' ? 'text-blue-600' : 
                                profile === 'Moderado' ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                                {profile}
                            </h2>
                            <p className="max-w-md mx-auto text-slate-600 dark:text-slate-300 mb-8">
                                {profile === 'Conservador' && "Você prioriza a segurança e liquidez. Não gosta de ver seu saldo oscilar negativamente."}
                                {profile === 'Moderado' && "Você aceita pequenos riscos em busca de retornos acima da inflação, mas mantém parte do capital seguro."}
                                {profile === 'Arrojado' && "Você entende a volatilidade do mercado e foca no longo prazo para maximizar ganhos."}
                            </p>
                            
                            <button 
                                onClick={() => setShowQuiz(true)}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                            >
                                Refazer Teste
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 2. OPPORTUNITIES CONTENT */}
            {subTab === 'opportunities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="col-span-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Recomendações do Dia</h4>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Baseado no perfil: <strong>{profile || "Geral"}</strong>. Dados simulados para demonstração.
                            </p>
                        </div>
                     </div>

                     {/* Cards */}
                     {[
                        { type: 'Renda Fixa', title: 'CDB Banco Master', rate: '118% CDI', min: 1000, risk: 'Baixo', profile: ['Conservador', 'Moderado', 'Arrojado'] },
                        { type: 'Isento IR', title: 'LCI Banco ABC', rate: '94% CDI', min: 5000, risk: 'Baixo', profile: ['Conservador', 'Moderado'] },
                        { type: 'Tesouro', title: 'Tesouro IPCA+ 2035', rate: 'IPCA + 6.1%', min: 35, risk: 'Médio', profile: ['Moderado', 'Arrojado'] },
                        { type: 'FIIs', title: 'MXRF11', rate: 'Div. Yield 12% a.a.', min: 10, risk: 'Médio', profile: ['Moderado', 'Arrojado'] },
                        { type: 'Ações', title: 'VALE3', rate: 'Potencial +15%', min: 65, risk: 'Alto', profile: ['Arrojado'] },
                        { type: 'ETF', title: 'IVVB11 (S&P 500)', rate: 'Dolarizado', min: 280, risk: 'Alto', profile: ['Arrojado'] },
                     ].filter(i => !profile || i.profile.includes(profile)).map((item, idx) => (
                         <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col justify-between">
                             <div>
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-full">{item.type}</span>
                                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2">{item.title}</h3>
                                 <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-2">{item.rate}</div>
                                 <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-4">
                                     <span>Mínimo: {formatCurrency(item.min, currency)}</span>
                                     <span>Risco: {item.risk}</span>
                                 </div>
                             </div>
                             <button className="w-full mt-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 group">
                                 Simular <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                             </button>
                         </div>
                     ))}
                </div>
            )}

            {/* 3. PROJECTION CONTENT */}
            {subTab === 'projection' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 h-fit">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Calculator size={20} className="text-blue-500"/> Parâmetros
                        </h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor Inicial</label>
                            <input 
                                type="number" 
                                value={projInitial}
                                onChange={e => setProjInitial(Number(e.target.value))}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Aporte Mensal</label>
                            <input 
                                type="number" 
                                value={projMonthly}
                                onChange={e => setProjMonthly(Number(e.target.value))}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Taxa de Juros (% a.a.)</label>
                            <input 
                                type="number" 
                                value={projRate}
                                onChange={e => setProjRate(Number(e.target.value))}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Período (Anos)</label>
                            <input 
                                type="number" 
                                value={projYears}
                                onChange={e => setProjYears(Number(e.target.value))}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2"
                            />
                            <input 
                                type="range" 
                                min="1" max="40" 
                                value={projYears}
                                onChange={e => setProjYears(Number(e.target.value))}
                                className="w-full mt-2"
                            />
                        </div>
                        
                        <button 
                            onClick={calculateProjection}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Calcular Futuro
                        </button>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                        {projResult ? (
                            <>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Investido</p>
                                        <p className="text-sm md:text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(projResult.totalInvested, currency)}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Juros Ganhos</p>
                                        <p className="text-sm md:text-lg font-bold text-emerald-700 dark:text-emerald-400">+{formatCurrency(projResult.totalInterest, currency)}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Patrimônio Final</p>
                                        <p className="text-sm md:text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(projResult.totalAmount, currency)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projResult.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" tick={{fontSize: 10}} />
                                            <YAxis tickFormatter={(val) => currency === 'BRL' ? `R$${val/1000}k` : `${val/1000}k`} tick={{fontSize: 10}} />
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                                            <Area type="monotone" dataKey="Total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                                            <Area type="monotone" dataKey="Investido" stroke="#94a3b8" fillOpacity={1} fill="url(#colorInv)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                                <BarChart4 size={48} className="mb-2 opacity-30" />
                                <p>Preencha os dados e calcule para ver o gráfico.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
