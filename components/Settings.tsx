
import React, { useState, useEffect } from 'react';
import { AppConfig, Transaction, PurchaseRequest } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, AlertCircle, Bell, CreditCard, CheckCircle, Clock, XCircle, Upload, Shield, Key, Smartphone, Copy, Lock } from 'lucide-react';
import { exportToCSV, generateId, validateLicenseKey } from '../utils';
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
    const [isRestoring, setIsRestoring] = useState(false);
    
    // Remote License State
    const [inputLicenseKey, setInputLicenseKey] = useState('');
    const [licenseError, setLicenseError] = useState('');
    const [showManualActivation, setShowManualActivation] = useState(false);

    // Change Password State
    const [newPassword, setNewPassword] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);

    const isLicensed = config.licenseStatus === 'active' || config.licenseKey;

    useEffect(() => {
        if (config.userId) {
            DBService.getPurchaseRequest(config.userId).then(setPurchaseRequest);
        }
    }, [config.userId]);

    const handleRequestPurchase = async () => {
        if (!config.userId) {
            alert("Erro de identificação do usuário. Por favor, recarregue a página e faça login novamente.");
            return;
        }
        
        setLoadingReq(true);
        try {
            const req: PurchaseRequest = {
                id: generateId(),
                userId: config.userId,
                requestDate: new Date().toISOString(),
                status: 'pending'
            };
            await DBService.savePurchaseRequest(req);
            setPurchaseRequest(req);
            setShowManualActivation(true); // Show manual options immediately after request
        } catch (error) {
            console.error(error);
            alert("Não foi possível salvar a solicitação local. Tente usar o método via WhatsApp.");
        } finally {
            setLoadingReq(false);
        }
    };

    const handleActivateLicense = () => {
        if (!config.userId) return;

        if (validateLicenseKey(config.userId, inputLicenseKey)) {
             const newConfig = { 
                 ...config, 
                 licenseKey: inputLicenseKey,
                 licenseStatus: 'active' as const
             };
             onUpdateConfig(newConfig);
             setLicenseError('');
             alert('Licença ativada com sucesso! Obrigado por ser Premium.');
             // Also update local request status if exists
             if (purchaseRequest) {
                 const approvedReq = { ...purchaseRequest, status: 'approved' as const };
                 DBService.savePurchaseRequest(approvedReq);
                 setPurchaseRequest(approvedReq);
             }
        } else {
            setLicenseError('Chave inválida para este usuário.');
        }
    };

    const handleWhatsAppRequest = () => {
        const text = `Olá! Gostaria de solicitar a licença do Finance Pro 360.\n\nMeu ID de Usuário: *${config.userId}*\n\nAguardo a chave de ativação.`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        setShowManualActivation(true);
    };

    const copyUserId = () => {
        if (config.userId) {
            navigator.clipboard.writeText(config.userId);
            alert('ID copiado para a área de transferência!');
        }
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

    const handleBackup = async () => {
        try {
            const data = await DBService.createBackup();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `finance360_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert('Erro ao criar backup: ' + e);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!confirm('Atenção: A restauração irá sobrescrever e mesclar os dados atuais do banco de dados. Isso não pode ser desfeito. Deseja continuar?')) return;

        setIsRestoring(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                await DBService.restoreBackup(json);
                alert('Dados restaurados com sucesso! A página será recarregada para aplicar as alterações.');
                window.location.reload();
            } catch (error) {
                alert('Erro ao restaurar arquivo: ' + error);
                setIsRestoring(false);
            }
        };
        reader.readAsText(file);
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            alert('A senha deve ter pelo menos 4 caracteres.');
            return;
        }
        if (config.userId) {
            await DBService.resetUserPassword(config.userId, newPassword);
            localStorage.setItem('fp360_saved_pass', newPassword);
            setPassSuccess(true);
            setNewPassword('');
            setTimeout(() => setPassSuccess(false), 3000);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-10">
            
            {/* Purchase / License Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 rounded-xl shadow-lg text-white border border-blue-400 relative overflow-hidden">
                {/* Texture */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                <CreditCard className="text-white" size={24} />
                                Assinatura Finance Pro 360
                            </h3>
                            <p className="text-blue-100 text-sm max-w-lg">
                                {isLicensed 
                                    ? "Parabéns! Você possui uma licença vitalícia ativa. Aproveite todos os recursos sem limites."
                                    : "Adquira a licença vitalícia para desbloquear recursos exclusivos e suporte prioritário."
                                }
                            </p>
                        </div>
                        
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm min-w-[140px] text-center border border-white/20">
                            <span className="text-xs uppercase tracking-widest text-blue-200 mb-1 block">Status</span>
                            <div className="flex items-center justify-center gap-2 font-bold text-lg">
                                {isLicensed ? (
                                    <><CheckCircle size={20} className="text-emerald-300" /> Ativo</>
                                ) : (
                                    purchaseRequest?.status === 'pending' ? (
                                        <><Clock size={20} className="text-amber-300" /> Análise</>
                                    ) : (
                                        <><Lock size={20} className="text-slate-300" /> Gratuito</>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {!isLicensed && (
                        <div className="bg-white/95 text-slate-800 rounded-lg p-4 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Request Methods */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-indigo-700 uppercase">1. Solicitar Licença</h4>
                                    <p className="text-xs text-slate-500">
                                        Para ativar em <strong>qualquer dispositivo (Celular/PC)</strong>, envie seu ID para o administrador via WhatsApp.
                                    </p>
                                    
                                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border border-slate-200">
                                        <span className="text-xs text-slate-500 font-mono">ID:</span>
                                        <span className="text-sm font-bold font-mono select-all text-slate-800">{config.userId}</span>
                                        <button onClick={copyUserId} className="ml-auto text-slate-400 hover:text-blue-600" title="Copiar ID">
                                            <Copy size={16} />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleWhatsAppRequest}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Smartphone size={16} />
                                            Pedir no WhatsApp
                                        </button>
                                        {!purchaseRequest && (
                                            <button 
                                                onClick={handleRequestPurchase}
                                                disabled={loadingReq}
                                                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded text-sm font-bold transition-colors"
                                            >
                                                {loadingReq ? '...' : 'Pedir no App (Local)'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Activation */}
                                <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
                                    <h4 className="text-sm font-bold text-indigo-700 uppercase">2. Ativar Licença</h4>
                                    <p className="text-xs text-slate-500">
                                        Já recebeu sua chave? Insira abaixo para liberar o acesso imediatamente.
                                    </p>
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={inputLicenseKey}
                                            onChange={e => setInputLicenseKey(e.target.value.toUpperCase())}
                                            placeholder="XXXX-XXXX"
                                            className="flex-1 border-2 border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase focus:border-indigo-500 outline-none"
                                        />
                                        <button 
                                            onClick={handleActivateLicense}
                                            className="bg-slate-800 text-white px-4 rounded font-bold hover:bg-slate-900"
                                        >
                                            Ativar
                                        </button>
                                    </div>
                                    {licenseError && <p className="text-xs text-rose-500 font-bold">{licenseError}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Security & Data Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-6">
                    <Shield className="text-indigo-600" size={20} />
                    Segurança e Dados
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Password Change */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <Key size={16} /> Alterar Senha
                        </h4>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                placeholder="Nova senha..." 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button 
                                onClick={handleChangePassword}
                                className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-900 transition-colors"
                            >
                                Atualizar
                            </button>
                        </div>
                        {passSuccess && <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={12}/> Senha atualizada com sucesso!</p>}
                        <p className="text-xs text-slate-400">
                            Atualize sua senha de acesso periodicamente para manter sua conta segura.
                        </p>
                    </div>

                    {/* Backup & Restore */}
                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-4 md:pt-0">
                        <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <Download size={16} /> Backup e Restauração
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={handleBackup}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                                <Download size={16} />
                                Baixar Dados
                            </button>
                            <label className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded hover:bg-emerald-100 transition-colors text-sm font-medium cursor-pointer">
                                <Upload size={16} />
                                {isRestoring ? 'Restaurando...' : 'Restaurar'}
                                <input 
                                    type="file" 
                                    accept=".json"
                                    onChange={handleRestore} 
                                    disabled={isRestoring}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-400">
                            Grave todas as funções e cadastros em um arquivo seguro. Use a restauração para recuperar seus dados em caso de problemas ou mudança de navegador.
                        </p>
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