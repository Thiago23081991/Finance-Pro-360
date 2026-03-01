
import React, { useState, useEffect } from 'react';
import { X, Delete, Equal, Calculator as CalcIcon } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');

  // Limpar ao abrir
  useEffect(() => {
    if (isOpen) {
        setDisplay('');
        setResult('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePress = (val: string) => {
    // Se já houve um resultado e o usuário digita um número, limpa e começa novo
    if (result && !['+', '-', '*', '/', '%'].includes(val)) {
        setDisplay(val);
        setResult('');
        return;
    }
    // Se houve resultado e digita operador, continua a conta
    if (result && ['+', '-', '*', '/', '%'].includes(val)) {
        setDisplay(result + val);
        setResult('');
        return;
    }

    setDisplay(prev => prev + val);
  };

  const handleClear = () => {
    setDisplay('');
    setResult('');
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.slice(0, -1));
  };

  const calculate = () => {
    try {
      // Substitui visualização por operadores JS
      let expression = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      
      // Avaliação segura para matemática simples
      // eslint-disable-next-line no-new-func
      const evalResult = new Function('return ' + expression)();
      
      const formatted = String(parseFloat(evalResult.toFixed(2))); // Max 2 casas decimais se necessário
      setResult(formatted);
    } catch (e) {
      setResult('Erro');
    }
  };

  const buttons = [
    { label: 'C', action: handleClear, style: 'text-rose-500 font-bold' },
    { label: '(', action: () => handlePress('('), style: 'text-blue-500' },
    { label: ')', action: () => handlePress(')'), style: 'text-blue-500' },
    { label: '÷', action: () => handlePress('/'), style: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: '7', action: () => handlePress('7') },
    { label: '8', action: () => handlePress('8') },
    { label: '9', action: () => handlePress('9') },
    { label: '×', action: () => handlePress('*'), style: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: '4', action: () => handlePress('4') },
    { label: '5', action: () => handlePress('5') },
    { label: '6', action: () => handlePress('6') },
    { label: '-', action: () => handlePress('-'), style: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: '1', action: () => handlePress('1') },
    { label: '2', action: () => handlePress('2') },
    { label: '3', action: () => handlePress('3') },
    { label: '+', action: () => handlePress('+'), style: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: '0', action: () => handlePress('0'), width: 'col-span-2' },
    { label: '.', action: () => handlePress('.') },
    { label: '=', action: calculate, style: 'bg-emerald-500 text-white hover:bg-emerald-600' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-fade-in transition-colors">
        {/* Header */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CalcIcon size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Calculadora</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={18} />
            </button>
        </div>

        {/* Display */}
        <div className="p-4 text-right bg-slate-50 dark:bg-slate-900">
            <div className="text-slate-500 dark:text-slate-400 text-sm h-6 overflow-hidden">
                {display || '0'}
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mt-1 h-10 overflow-hidden">
                {result || (display ? '' : '0')}
            </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-4 gap-3 bg-white dark:bg-slate-800">
            {buttons.map((btn, idx) => (
                <button
                    key={idx}
                    onClick={btn.action}
                    className={`h-12 rounded-lg text-lg font-medium transition-all active:scale-95 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 dark:text-slate-200
                        ${btn.width || ''} 
                        ${btn.style || 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'}
                    `}
                >
                    {btn.label}
                </button>
            ))}
            <button 
                onClick={handleBackspace} 
                className="col-start-4 row-start-1 h-12 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center transition-colors"
            >
                <Delete size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
