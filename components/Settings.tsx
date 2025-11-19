import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Trash2, Plus } from 'lucide-react';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig }) => {
    const [newCat, setNewCat] = useState('');
    const [newMethod, setNewMethod] = useState('');

    const addCat = () => {
        if(newCat && !config.categories.includes(newCat)) {
            onUpdateConfig({...config, categories: [...config.categories, newCat]});
            setNewCat('');
        }
    };

    const removeCat = (c: string) => {
        onUpdateConfig({...config, categories: config.categories.filter(cat => cat !== c)});
    };

    const addMethod = () => {
         if(newMethod && !config.paymentMethods.includes(newMethod)) {
            onUpdateConfig({...config, paymentMethods: [...config.paymentMethods, newMethod]});
            setNewMethod('');
        }
    };

    const removeMethod = (m: string) => {
         onUpdateConfig({...config, paymentMethods: config.paymentMethods.filter(met => met !== m)});
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">Categorias</h3>
                <p className="text-sm text-slate-500 mb-4">Utilizadas em Receitas e Despesas.</p>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder="Nova Categoria" 
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCat()}
                    />
                    <button onClick={addCat} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        <Plus size={20} />
                    </button>
                </div>

                <ul className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                    {config.categories.map(cat => (
                        <li key={cat} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 group">
                            <span className="text-sm text-slate-700">{cat}</span>
                            <button onClick={() => removeCat(cat)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Formas de Pagamento</h3>
                <p className="text-sm text-slate-500 mb-4">Utilizadas apenas em Despesas.</p>

                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder="Nova Forma de Pagamento" 
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        value={newMethod}
                        onChange={e => setNewMethod(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMethod()}
                    />
                    <button onClick={addMethod} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        <Plus size={20} />
                    </button>
                </div>

                <ul className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                    {config.paymentMethods.map(method => (
                         <li key={method} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 group">
                            <span className="text-sm text-slate-700">{method}</span>
                            <button onClick={() => removeMethod(method)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};