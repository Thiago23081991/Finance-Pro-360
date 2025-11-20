import React, { useState } from 'react';
import { AppConfig, Transaction } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, AlertCircle, Bell } from 'lucide-react';
import { exportToCSV } from '../utils';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
    transactions: Transaction[]; // Added to support export
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, transactions }) => {
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

    const handleExport = () => {
        exportToCSV(transactions);
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-10">
            
            {/* Reminders Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
                    <Bell className="text-blue-600" size={20} />
                    Notificações e Lembretes
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-800">Lembretes de Metas</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Receba notificações periódicas no aplicativo para atualizar o progresso das suas metas financeiras.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={config.enableReminders ?? true}
                            onChange={(e) => onUpdateConfig({ ...config, enableReminders: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {/* Google Sheets / Data Integration Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                            <FileSpreadsheet className="text-emerald-600" />
                            Integração Google Sheets
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Exporte seus dados para backup ou análise avançada no Google Sheets e Excel.
                        </p>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Exportar .CSV
                    </button>
                </div>
                <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3 items-start">
                    <AlertCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-emerald-800">
                        <p className="font-semibold mb-1">Como importar no Google Sheets?</p>
                        <ol className="list-decimal list-inside space-y-1 text-emerald-700">
                            <li>Clique no botão "Exportar .CSV" acima para baixar o arquivo.</li>
                            <li>No Google Sheets, vá em <strong>Arquivo &gt; Importar &gt; Upload</strong>.</li>
                            <li>Selecione o arquivo baixado.</li>
                            <li>O sistema detectará automaticamente as colunas de Data, Valor e Categoria.</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
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

                    <ul className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-80">
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

                {/* Payment Methods Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
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

                    <ul className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-80">
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
        </div>
    );
};