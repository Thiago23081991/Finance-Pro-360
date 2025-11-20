
import React, { useState, useEffect } from 'react';
import { AppConfig, Transaction, PurchaseRequest } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, AlertCircle, Bell, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import { exportToCSV, generateId } from '../utils';
import { DBService } from '../db';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
    transactions: Transaction[]; 
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, transactions }) => {
    const [newCat, setNewCat] = useState('');
    const [newMethod, setNewMethod] = useState('');
    const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
    const [loadingReq, setLoadingReq] = useState(false);

    useEffect(() => {
        if (config.userId) {
            DBService.getPurchaseRequest(config.userId).then(setPurchaseRequest);
        }
    }, [config.userId]);

    const handleRequestPurchase = async () => {
        if (!config.userId) return;
        setLoadingReq(true);
        const req: PurchaseRequest = {
            id: generateId(),
            userId: config.userId,
            requestDate: new Date().toISOString(),
            status: 'pending'
        };
        await DBService.savePurchaseRequest(req);
        setPurchaseRequest(req);
        setLoadingReq(false);
    };

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
            
            {/* Purchase / License Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 rounded-xl shadow-lg text-white border border-blue-400">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                            <CreditCard className="text-white" size={24} />
                            Assinatura Finance Pro 360
                        </h3>
                        <p className="text-blue-100 text-sm max-w-lg">
                            Adquira a licença vitalícia para desbloquear recursos exclusivos e suporte prioritário. 
                            Sua solicitação será enviada diretamente para o administrador.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm min-w-[200px] text-center">
                        {!purchaseRequest ? (
                            <button 
                                onClick={handleRequestPurchase}
                                disabled={loadingReq}
                                className="w-full bg-white text-blue-600 font-bold py-2 px-4 rounded hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                {loadingReq ? 'Enviando...' : 'Solicitar Compra'}
                            </button>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase tracking-widest text-blue-200 mb-1">Status</span>
                                <div className="flex items-center gap-2 font-bold text-lg">
                                    {purchaseRequest.status === 'approved' && <><CheckCircle size={20} /> Ativo</>}
                                    {purchaseRequest.status === 'pending' && <><Clock size={20} /> Em Análise</>}
                                    {purchaseRequest.status === 'rejected' && <><XCircle size={20} /> Recusado</>}
                                </div>
                                <p className="text-[10px] text-blue-200 mt-1">
                                    {purchaseRequest.status === 'pending' && 'Aguardando aprovação do Admin.'}
                                    {purchaseRequest.status === 'approved' && 'Licença válida.'}
                                    {purchaseRequest.status === 'rejected' && 'Entre em contato com suporte.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
