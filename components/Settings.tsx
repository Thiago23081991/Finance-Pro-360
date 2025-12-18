
import React, { useState, useEffect } from 'react';
import { AppConfig, Transaction, PurchaseRequest } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, Bell, CreditCard, CheckCircle, Upload, Shield, Key, Lock, Moon, Sun, AlertTriangle, FileText, ArrowRight, DollarSign, Rocket, Star, ExternalLink, TableProperties, Info, Copy, Smartphone, Timer, QrCode, Loader2, Target, Scale } from 'lucide-react';
import { exportToCSV, validateLicenseKey, generateId } from '../utils';
import { DBService } from '../db';
import { PrivacyModal } from './PrivacyModal';
import { PAYMENT_CONFIG } from '../constants';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
    transactions: Transaction[]; 
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, transactions }) => {
    const [newCat, setNewCat] = useState('');
    const [newMethod, setNewMethod] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    
    const [inputLicenseKey, setInputLicenseKey] = useState('');
    const [licenseError, setLicenseError] = useState('');
    const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);

    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSheetGuide, setShowSheetGuide] = useState(false);

    const isLicensed = config.licenseStatus === 'active' || config.licenseKey;

    useEffect(() => {
        if (config.userId && !isLicensed) {
            DBService.getPurchaseRequest(config.userId).then(setPurchaseRequest);
        }
    }, [config.userId, isLicensed]);

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
             DBService.saveConfig(newConfig);
        } else {
            setLicenseError('Chave inválida para este usuário. Verifique o e-mail de compra.');
        }
    };

    const handleRequestActivation = async () => {
        if (!config.userId) return;
        setIsRequesting(true);
        try {
            const req: PurchaseRequest = {
                id: generateId(),
                userId: config.userId,
                requestDate: new Date().toISOString(),
                status: 'pending'
            };
            await DBService.savePurchaseRequest(req);
            setPurchaseRequest(req);
            alert("Solicitação enviada! Após a confirmação do PIX, sua conta será ativada em até 24h.");
        } catch (e) {
            alert("Erro ao solicitar ativação.");
        } finally {
            setIsRequesting(false);
        }
    };

    const copyPixCopiaECola = () => {
        navigator.clipboard.writeText(PAYMENT_CONFIG.payload);
        alert("PIX Copia e Cola copiado!");
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

    const handleDeleteAccount = async () => {
        if (!config.userId) return;
        const confirmation = window.prompt("ATENÇÃO: Isso excluirá permanentemente TODOS os seus dados. Para confirmar, digite 'DELETAR':");
        if (confirmation === 'DELETAR') {
            setIsDeleting(true);
            try {
                await DBService.deleteUserAccount(config.userId);
                alert('Sua conta e seus dados foram excluídos com sucesso.');
                window.location.reload();
            } catch (error: any) {
                alert('Erro ao excluir conta: ' + error.message);
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-10">
            
            {/* Upgrade Section with QR Code */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-1 rounded-xl shadow-lg text-white border border-slate-700 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                <Rocket className="text-emerald-500" size={24} />
                                Upgrade Premium
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                Desbloqueie relatórios avançados, IA de investimentos e muito mais.
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-bold text-sm ${
                            isLicensed 
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' 
                            : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                            {isLicensed ? (
                                <><CheckCircle size={16} /> ACESSO VITALÍCIO</>
                            ) : (
                                <><Lock size={16} /> VERSÃO GRATUITA</>
                            )}
                        </div>
                    </div>

                    {!isLicensed ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* QR CODE AREA */}
                            <div className="lg:col-span-2 flex flex-col items-center text-center">
                                <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 mb-4 inline-block">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(PAYMENT_CONFIG.payload)}`} 
                                        alt="PIX QR Code" 
                                        className="w-40 h-40"
                                    />
                                </div>
                                <h4 className="text-slate-800 dark:text-white font-bold text-sm">Escaneie o QR Code</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 uppercase font-bold tracking-widest">Valor: R$ {PAYMENT_CONFIG.value.toFixed(2)}</p>
                                
                                <button 
                                    onClick={copyPixCopiaECola}
                                    className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold text-xs bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full transition-colors border border-blue-100 dark:border-blue-800"
                                >
                                    <Copy size={14} /> Copiar Código "Copia e Cola"
                                </button>
                            </div>

                            {/* INSTRUCTIONS AREA */}
                            <div className="lg:col-span-3 border-l border-slate-100 dark:border-slate-800 pl-0 lg:pl-8 flex flex-col justify-center">
                                <div className="space-y-4 mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">1</div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Abra o app do seu banco e escolha a opção <strong>PIX</strong>.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">2</div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Escaneie o código ao lado ou use o <strong>Copia e Cola</strong>.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">3</div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Após confirmar o pagamento, clique no botão <strong>ATIVAR AGORA</strong> abaixo.</p>
                                    </div>
                                </div>

                                {purchaseRequest?.status === 'pending' ? (
                                    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center gap-4">
                                        <Timer className="text-amber-600 animate-pulse" size={24} />
                                        <div>
                                            <p className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">Solicitação em análise</p>
                                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">Ativaremos sua conta em até 24h úteis após o recebimento.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleRequestActivation}
                                        disabled={isRequesting}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                                    >
                                        {isRequesting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                        {isRequesting ? 'ENVIANDO SOLICITAÇÃO...' : 'JÁ FIZ O PIX, ATIVAR AGORA'}
                                    </button>
                                )}

                                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Key size={14} /> Ativação por Chave Manual</h4>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={inputLicenseKey} 
                                            onChange={e => setInputLicenseKey(e.target.value.toUpperCase())} 
                                            placeholder="XXXX-XXXX" 
                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-white uppercase outline-none focus:border-blue-500" 
                                        />
                                        <button 
                                            onClick={handleActivateLicense}
                                            className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-black transition-colors"
                                        >
                                            VALIDAR
                                        </button>
                                    </div>
                                    {licenseError && <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={10} /> {licenseError}</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star size={40} className="text-emerald-600 dark:text-emerald-400 fill-current" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Experiência Premium Ativada!</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                                Você agora tem acesso total a todos os módulos, gráficos de tendência e suporte prioritário. Obrigado pela confiança!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Appearance and Currency Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
                    {config.theme === 'dark' ? <Moon className="text-blue-500" size={20} /> : <Sun className="text-orange-500" size={20} />}
                    Aparência e Moeda
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">Tema da Aplicação</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Modo claro ou escuro.</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex items-center border border-slate-200 dark:border-slate-600">
                            <button onClick={() => onUpdateConfig({...config, theme: 'light'})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${config.theme !== 'dark' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Claro</button>
                            <button onClick={() => onUpdateConfig({...config, theme: 'dark'})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${config.theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Escuro</button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
                         <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> Moeda Preferida</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Símbolo monetário usado no app.</p>
                        </div>
                        <select
                            value={config.currency || 'BRL'}
                            onChange={(e) => onUpdateConfig({...config, currency: e.target.value as any})}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="BRL">Real (R$)</option>
                            <option value="USD">Dólar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">Libra (£)</option>
                            <option value="JPY">Iene (¥)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Google Sheets Guide - EXPANDIDO */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <TableProperties className="text-indigo-600 dark:text-indigo-400" />
                            Guia de Estrutura Google Sheets
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Estrutura completa para criar sua planilha espelho.</p>
                    </div>
                    <button 
                        onClick={() => setShowSheetGuide(!showSheetGuide)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                        {showSheetGuide ? 'Ocultar Estrutura' : 'Ver Estrutura Completa'}
                    </button>
                </div>

                {showSheetGuide && (
                    <div className="space-y-8 animate-fade-in mt-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                            <Info size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />
                            <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                                Para importar ou exportar dados corretamente, sua planilha deve seguir esta ordem de colunas. Você pode ter múltiplas abas.
                            </p>
                        </div>

                        {/* ABA 1: LANÇAMENTOS */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest flex items-center gap-2">
                                <ArrowRight className="text-emerald-500" size={14} /> Aba 1 — Controle Geral (Transações)
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-[10px] text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold">
                                        <tr>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Data (AAAA-MM-DD)</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Tipo (income/expense)</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Categoria</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Valor (0.00)</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Descrição</th>
                                            <th className="p-2 border-b dark:border-slate-700">Pagamento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <td className="p-2 border-r dark:border-slate-700">2024-03-01</td>
                                            <td className="p-2 border-r dark:border-slate-700 font-mono text-emerald-600">income</td>
                                            <td className="p-2 border-r dark:border-slate-700">Salário</td>
                                            <td className="p-2 border-r dark:border-slate-700">5000.00</td>
                                            <td className="p-2 border-r dark:border-slate-700">Depósito Mensal</td>
                                            <td className="p-2 dark:border-slate-700">PIX</td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <td className="p-2 border-r dark:border-slate-700">2024-03-05</td>
                                            <td className="p-2 border-r dark:border-slate-700 font-mono text-rose-600">expense</td>
                                            <td className="p-2 border-r dark:border-slate-700">Alimentação</td>
                                            <td className="p-2 border-r dark:border-slate-700">150.00</td>
                                            <td className="p-2 border-r dark:border-slate-700">Supermercado</td>
                                            <td className="p-2 dark:border-slate-700">Crédito</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ABA 2: METAS */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest flex items-center gap-2">
                                <Target className="text-blue-500" size={14} /> Aba 2 — Metas Financeiras
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-[10px] text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold">
                                        <tr>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Nome da Meta</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Valor Alvo</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Valor Atual</th>
                                            <th className="p-2 border-b dark:border-slate-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <td className="p-2 border-r dark:border-slate-700">Reserva Emergência</td>
                                            <td className="p-2 border-r dark:border-slate-700">10000.00</td>
                                            <td className="p-2 border-r dark:border-slate-700">2500.00</td>
                                            <td className="p-2 dark:border-slate-700">Em andamento</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ABA 3: DÍVIDAS */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest flex items-center gap-2">
                                <Scale className="text-rose-500" size={14} /> Aba 3 — Gestão de Dívidas (Passivos)
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-[10px] text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold">
                                        <tr>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Credor / Nome</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Valor Total</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Juros Mensal (%)</th>
                                            <th className="p-2 border-b border-r dark:border-slate-700">Vencimento</th>
                                            <th className="p-2 border-b dark:border-slate-700">Categoria</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <td className="p-2 border-r dark:border-slate-700">Banco Santander</td>
                                            <td className="p-2 border-r dark:border-slate-700">1200.00</td>
                                            <td className="p-2 border-r dark:border-slate-700">12.5</td>
                                            <td className="p-2 border-r dark:border-slate-700">2024-12-10</td>
                                            <td className="p-2 dark:border-slate-700">banco</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Security & Data Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-6"><Shield className="text-brand-blue dark:text-brand-gold" size={20} />Segurança e Privacidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Key size={16} /> Alterar Senha</h4>
                        <div className="flex gap-2">
                            <input type="password" placeholder="Nova senha..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                            <button onClick={handleChangePassword} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">Atualizar</button>
                        </div>
                        {passSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><CheckCircle size={12}/> Senha atualizada!</p>}
                        <div className="mt-4 pt-2">
                            <button onClick={() => setShowPrivacyModal(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"><FileText size={16} />Ver Política de Privacidade</button>
                        </div>
                    </div>
                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 md:pl-8 pt-4 md:pt-0">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Download size={16} /> Backup e Restauração</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"><Download size={16} />Baixar Dados</button>
                            <label className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-medium cursor-pointer">
                                <Upload size={16} />{isRestoring ? 'Processando...' : 'Restaurar'}<input type="file" accept=".json" onChange={handleRestore} disabled={isRestoring} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Sheets Integration Area */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><FileSpreadsheet className="text-emerald-600 dark:text-emerald-400" />Exportar Dados</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gere um CSV compatível com Excel e Google Sheets.</p>
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"><Download size={18} />Exportar .CSV</button>
                </div>
            </div>

            {/* Categories & Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-colors">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">Categorias</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="Nova Categoria" className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCat()} />
                        <button onClick={addCat} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button>
                    </div>
                    <ul className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-80">
                        {config.categories.map(cat => (
                            <li key={cat} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700 group transition-colors">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                                <button onClick={() => removeCat(cat)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-colors">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Formas de Pagamento</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="Nova Forma" className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={newMethod} onChange={e => setNewMethod(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMethod()} />
                        <button onClick={addMethod} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button>
                    </div>
                    <ul className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-80">
                        {config.paymentMethods.map(met => (
                            <li key={met} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700 group transition-colors">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{met}</span>
                                <button onClick={() => removeMethod(met)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
};
