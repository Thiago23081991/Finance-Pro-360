
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check, Sparkles, LayoutDashboard, TrendingUp, Target, Settings } from 'lucide-react';
import { Tab } from '../types';

interface TutorialProps {
  onComplete: () => void;
  onStepChange: (target: Tab) => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onComplete, onStepChange }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Bem-vindo ao Finance Pro 360!",
      content: "Vamos fazer um tour rápido para te ensinar a gerenciar suas finanças como um profissional. Leva menos de 1 minuto.",
      target: 'controle' as Tab,
      icon: <Sparkles className="text-yellow-400" size={32} />
    },
    {
      title: "Seu Painel de Controle",
      content: "Aqui você tem uma visão geral da sua saúde financeira. Acompanhe saldo, gráficos de evolução e onde você está gastando mais.",
      target: 'controle' as Tab,
      icon: <LayoutDashboard className="text-blue-500" size={32} />
    },
    {
      title: "Lançamentos",
      content: "Nas abas 'Receitas' e 'Despesas' você registra suas movimentações. Use o botão '+ Novo Lançamento' para adicionar itens.",
      target: 'receitas' as Tab,
      icon: <TrendingUp className="text-emerald-500" size={32} />
    },
    {
      title: "Metas Financeiras",
      content: "Defina objetivos (como 'Comprar Carro' ou 'Viagem') e acompanhe o progresso visualmente. O app te avisa se você esquecer de atualizar!",
      target: 'metas' as Tab,
      icon: <Target className="text-rose-500" size={32} />
    },
    {
      title: "Personalização",
      content: "Em Configurações, você pode criar suas próprias categorias, métodos de pagamento e exportar seus dados para planilha.",
      target: 'config' as Tab,
      icon: <Settings className="text-slate-500" size={32} />
    },
    {
      title: "Tudo pronto!",
      content: "Você já sabe o básico. Comece adicionando sua primeira receita ou meta agora mesmo.",
      target: 'controle' as Tab,
      icon: <Check className="text-green-500" size={32} />
    }
  ];

  const currentStep = steps[step];

  useEffect(() => {
    // Request the parent app to switch tabs based on the current step
    onStepChange(currentStep.target);
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end pointer-events-none p-6">
      {/* Backdrop only for mobile to focus attention */}
      <div className="absolute inset-0 bg-black/20 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none pointer-events-auto sm:pointer-events-none transition-all" />

      <div className="bg-white w-full max-w-sm p-6 rounded-xl shadow-md border border-slate-100 pointer-events-auto relative animate-fade-in ring-4 ring-blue-500/10 sm:mr-10 sm:mb-10">
        
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          title="Pular Tutorial"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                {currentStep.icon}
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{currentStep.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    {currentStep.content}
                </p>
            </div>

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                <div className="flex gap-1">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
                        />
                    ))}
                </div>
                
                <button 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-200 active:scale-95"
                >
                    {step === steps.length - 1 ? 'Começar' : 'Próximo'}
                    {step === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};