
import React, { useState, useEffect } from 'react';
import { AppConfig, Transaction, PurchaseRequest } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, Bell, CreditCard, CheckCircle, Upload, Shield, Key, Lock, Moon, Sun, AlertTriangle, FileText, ArrowRight, DollarSign, Rocket, Star, ExternalLink, TableProperties, Info, Copy, Smartphone, Timer, QrCode, Loader2, Target, Scale, User, Edit2, Save, MessageCircle, Zap, Tag, Wallet, Calendar, TrendingUp, X } from 'lucide-react';
import { exportToCSV, validateLicenseKey, generateId } from '../utils';
import { DBService } from '../db';
import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { PrivacyModal } from './PrivacyModal';
import { PLANS_CONFIG } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
    transactions: Transaction[];
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, transactions }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'plan' | 'appearance' | 'categories' | 'security'>('profile');
    const [newIncomeCat, setNewIncomeCat] = useState('');
    const [newExpenseCat, setNewExpenseCat] = useState('');
    const [newMethod, setNewMethod] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    const [dueDate, setDueDate] = useState(config.creditCardDueDate || 10);
    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    // Perfil
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(config.name || '');

    // Upgrade
    const [selectedPlan, setSelectedPlan] = useState<'semiannual' | 'annual'>('annual');
    const [inputLicenseKey, setInputLicenseKey] = useState('');
    const [licenseError, setLicenseError] = useState('');
    const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
    const [isRequestingState, setIsRequestingState] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showSheetGuide, setShowSheetGuide] = useState(false);

    const isLicensed = config.licenseStatus === 'active' || config.licenseKey;

    useEffect(() => {
        if (config.userId && !isLicensed) {
            DBService.getPurchaseRequest(config.userId).then(setPurchaseRequest);
        }
        setTempName(config.name || '');
        setDueDate(config.creditCardDueDate || 10);
    }, [config.userId, isLicensed, config.name, config.creditCardDueDate]);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setIsPushEnabled(true);
                });
            });
        }
    }, []);

    const handleSaveName = () => {
        onUpdateConfig({ ...config, name: tempName });
        setIsEditingName(false);
    };

    // Funções de Checkout simplificadas (lógica movida para o botão)
    const handleActivateLicense = () => {
        if (!config.userId) return;
        if (validateLicenseKey(config.userId, inputLicenseKey)) {
            const newConfig = { ...config, licenseKey: inputLicenseKey, licenseStatus: 'active' as const };
            onUpdateConfig(newConfig);
            setLicenseError('');
            alert('Licença ativada com sucesso! Obrigado por ser Premium.');
            DBService.saveConfig(newConfig);
        } else {
            setLicenseError('Chave inválida para este usuário. Verifique o e-mail de compra.');
        }
    };

    const handleTogglePush = async () => {
        if (!('serviceWorker' in navigator)) {
            alert('Seu navegador não suporta notificações Push.');
            return;
        }

        setPushLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();

            if (sub) {
                // Unsubscribe logic (optional, for now just toggle state locally or remove from DB if we implemented delete)
                // For simplified flow we just re-subscribe or stay subscribed
                setIsPushEnabled(true);
                alert("Você já está inscrito!");
            } else {
                const newSub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'BCpZYgyHbEfonCDY5NdvLfbG1vlNnGbRvPbiJRW4nniP89YIiAKI3LozraSqQRe9LP65j1H0x0N_ArBAdeonIyQ'
                });
                await DBService.savePushSubscription(newSub);
                setIsPushEnabled(true);
                alert("Notificações ativadas com sucesso!");
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao ativar notificações. Verifique se você bloqueou o site.');
        } finally {
            setPushLoading(false);
        }
    };

    // const handleRequestActivation = async () => { // Removed as per instruction
    //     if (!config.userId) return;
    //     setIsRequestingState(true);
    //     try {
    //         const req: PurchaseRequest = {
    //             id: generateId(),
    //             userId: config.userId,
    //             requestDate: new Date().toISOString(),
    //             status: 'pending'
    //         };
    //         await DBService.savePurchaseRequest(req);
    //         setPurchaseRequest(req);

    //         // Redirecionar para o WhatsApp com os dados do plano escolhido
    //         const planName = PLANS_CONFIG[selectedPlan].name;
    //         const planValue = PLANS_CONFIG[selectedPlan].value.toFixed(2);
    //         const whatsappMsg = `Olá! Acabei de fazer o PIX de R$ ${planValue} para o ${planName}.\n\nNome: ${config.name || 'Usuário Sem Nome'}\nID do Usuário: ${config.userId}\n\nEstou enviando o comprovante em anexo.`;
    //         window.open(`https://wa.me/5579988541124?text=${encodeURIComponent(whatsappMsg)}`, '_blank');

    //         alert("Solicitação registrada! Agora envie o comprovante no WhatsApp que abrimos para você.");
    //     } catch (e) {
    //         alert("Erro ao solicitar ativação.");
    //     } finally {
    //         setIsRequestingState(false);
    //     }
    // }; // Removed as per instruction

    // const copyPixCopiaECola = () => { // Removed as per instruction
    //     navigator.clipboard.writeText(PLANS_CONFIG[selectedPlan].payload);
    //     alert("PIX Copia e Cola copiado!");
    // }; // Removed as per instruction

    const addIncomeCat = () => {
        const currentCats = config.incomeCategories || [];
        if (newIncomeCat && !currentCats.includes(newIncomeCat)) {
            onUpdateConfig({ ...config, incomeCategories: [...currentCats, newIncomeCat] });
            setNewIncomeCat('');
        }
    };

    const removeIncomeCat = (c: string) => {
        if (window.confirm(`Deseja remover a categoria de receita "${c}"?`)) {
            onUpdateConfig({ ...config, incomeCategories: (config.incomeCategories || []).filter(cat => cat !== c) });
        }
    };

    const addExpenseCat = () => {
        const currentCats = config.expenseCategories || [];
        if (newExpenseCat && !currentCats.includes(newExpenseCat)) {
            onUpdateConfig({ ...config, expenseCategories: [...currentCats, newExpenseCat] });
            setNewExpenseCat('');
        }
    };

    const removeExpenseCat = (c: string) => {
        if (window.confirm(`Deseja remover a categoria de despesa "${c}"?`)) {
            onUpdateConfig({ ...config, expenseCategories: (config.expenseCategories || []).filter(cat => cat !== c) });
        }
    };

    const addMethod = () => {
        if (newMethod && !config.paymentMethods.includes(newMethod)) {
            onUpdateConfig({ ...config, paymentMethods: [...config.paymentMethods, newMethod] });
            setNewMethod('');
        }
    };

    const removeMethod = (m: string) => {
        if (window.confirm(`Deseja remover o método "${m}"?`)) {
            onUpdateConfig({ ...config, paymentMethods: config.paymentMethods.filter(x => x !== m) });
        }
    };

    const handleBackup = async () => {
        try {
            const data = await DBService.createBackup();
            const fileName = `finance360_backup_${new Date().toISOString().split('T')[0]}.json`;

            if (Capacitor.isNativePlatform()) {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: data,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8
                });
                await CapacitorShare.share({
                    title: 'Backup Finance Pro 360',
                    url: result.uri,
                    dialogTitle: 'Salvar Banco de Dados'
                });
            } else {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e: any) {
            alert('Erro ao criar backup: ' + e.message);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        try {
            await DBService.resetUserPassword('', newPassword);
            setPassSuccess(true);
            setNewPassword('');
            setTimeout(() => setPassSuccess(false), 3000);
        } catch (e: any) {
            alert('Erro ao alterar senha: ' + e.message);
        }
    };

    const handleDueDateChange = (val: string) => {
        const day = parseInt(val);
        if (day >= 1 && day <= 31) {
            setDueDate(day);
            onUpdateConfig({ ...config, creditCardDueDate: day });
        }
    };

    const menuItems = [
        { id: 'profile', label: 'Meu Perfil', icon: <User size={20} className={activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} /> },
        { id: 'plan', label: 'Assinatura', icon: <Star size={20} className={activeTab === 'plan' ? 'text-brand-gold' : 'text-slate-400'} /> },
        { id: 'appearance', label: 'Ajustes', icon: <Moon size={20} className={activeTab === 'appearance' ? 'text-purple-500' : 'text-slate-400'} /> },
        { id: 'categories', label: 'Listas', icon: <Tag size={20} className={activeTab === 'categories' ? 'text-emerald-500' : 'text-slate-400'} /> },
        { id: 'security', label: 'Segurança', icon: <Shield size={20} className={activeTab === 'security' ? 'text-rose-500' : 'text-slate-400'} /> },
    ] as const;

    const AppleToggle = ({ enabled, onChange, disabled }: { enabled: boolean, onChange: () => void, disabled?: boolean }) => (
        <div onClick={disabled ? undefined : onChange} className={`w-[50px] h-[30px] rounded-full flex items-center px-[3px] transition-colors duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <motion.div layout className="w-[24px] h-[24px] bg-white rounded-full shadow-sm" animate={{ x: enabled ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 shrink-0">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-2 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex md:flex-col gap-1 overflow-x-auto custom-scrollbar sticky top-4">
                    {menuItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max md:min-w-0 ${activeTab === item.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                {/* Premium Card Holográfico */}
                                <div className={`relative overflow-hidden rounded-2xl p-8 shadow-xl border ${isLicensed ? 'bg-gradient-to-tr from-brand-gold to-yellow-300 border-yellow-200' : 'bg-gradient-to-br from-slate-800 to-black border-slate-700'} text-white`}>
                                    {isLicensed && <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -mr-20 -mt-20"></div>}
                                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                        <div className={`w-24 h-24 rounded-2xl shadow-inner flex items-center justify-center text-4xl font-black ${isLicensed ? 'bg-white/20 text-white border border-white/40' : 'bg-white/10 text-slate-300 border border-white/20'}`}>
                                            {(config.name || 'U').substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h2 className="text-3xl font-black tracking-tight mb-2">{config.name || 'Usuário Premium'}</h2>
                                            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${isLicensed ? 'bg-black/20 text-white border-white/30' : 'bg-white/10 text-slate-300 border-white/10'}`}>
                                                    {isLicensed ? 'Licença Ativa' : 'Plano Gratuito'}
                                                </span>
                                                <div className="flex items-center gap-2 text-xs font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                                                    <Key size={12} className="opacity-70" />
                                                    <span className="opacity-90">{config.userId}</span>
                                                    <button onClick={() => { navigator.clipboard.writeText(config.userId || ''); alert('ID Copiado!'); }} className="hover:text-amber-200 transition-colors"><Copy size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                        {!isLicensed && (
                                            <button onClick={() => setActiveTab('plan')} className="mt-4 sm:mt-0 bg-brand-gold text-brand-blue px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-yellow-400 transition-transform transform hover:scale-105 flex items-center gap-2">
                                                <Star size={16} className="fill-current" /> ASSINAR
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Editar Nome (Apple Style List) */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informações Pessoais</h4>
                                    </div>
                                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Como você quer ser chamado?</p>
                                                <div className="flex gap-2 mt-2">
                                                    {isEditingName ? (
                                                        <>
                                                            <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                                                            <button onClick={handleSaveName} className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-xs shadow-sm">SALVAR</button>
                                                        </>
                                                    ) : (
                                                        <div className="flex gap-4 items-center w-full">
                                                            <span className="flex-1 text-slate-600 dark:text-slate-400 font-medium">{config.name}</span>
                                                            <button onClick={() => setIsEditingName(true)} className="text-blue-600 font-bold text-xs hover:underline">EDITAR NOME</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'plan' && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 sm:p-8 rounded-xl shadow-xl border border-slate-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-xl pointer-events-none -mr-32 -mt-32"></div>
                                    <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Rocket className="text-brand-gold" size={32} />
                                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Evolua sua Gestão</h3>
                                            </div>
                                            {!isLicensed ? (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <button onClick={() => setSelectedPlan('semiannual')} className={`relative p-5 rounded-xl border-2 text-left transition-all ${selectedPlan === 'semiannual' ? 'border-brand-gold bg-white/5 ring-4 ring-brand-gold/10' : 'border-slate-700 bg-black/20 hover:border-slate-500'}`}>
                                                            {selectedPlan === 'semiannual' && <CheckCircle className="absolute top-4 right-4 text-brand-gold" size={20} />}
                                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Semestral</p>
                                                            <h4 className="text-white font-bold text-lg">PLANO SEMESTRAL</h4>
                                                            <div className="mt-2 text-2xl font-bold text-white">R$ {PLANS_CONFIG.semiannual.value.toFixed(2).replace('.', ',')}<span className="text-xs font-normal text-slate-400 ml-1">/6 MESES</span></div>
                                                            <ul className="mt-4 space-y-2">
                                                                {PLANS_CONFIG.semiannual.features.slice(0, 3).map((f, i) => (
                                                                    <li key={i} className="text-[11px] text-slate-400 flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> {f}</li>
                                                                ))}
                                                            </ul>
                                                        </button>
                                                        <button onClick={() => setSelectedPlan('annual')} className={`relative p-5 rounded-xl border-2 text-left transition-all ${selectedPlan === 'annual' ? 'border-brand-gold bg-white/5 ring-4 ring-brand-gold/10' : 'border-slate-700 bg-black/20 hover:border-slate-500'}`}>
                                                            {selectedPlan === 'annual' && <CheckCircle className="absolute top-4 right-4 text-brand-gold" size={20} />}
                                                            <div className="absolute -top-3 left-4 bg-brand-gold text-brand-blue text-[9px] font-bold px-2 py-0.5 rounded-full">MELHOR VALOR</div>
                                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Anual</p>
                                                            <h4 className="text-white font-bold text-lg">PLANO ANUAL</h4>
                                                            <div className="mt-2 text-2xl font-bold text-white">R$ {PLANS_CONFIG.annual.value.toFixed(2).replace('.', ',')}<span className="text-xs font-normal text-slate-400 ml-1">/ANO</span></div>
                                                            <ul className="mt-4 space-y-2">
                                                                {PLANS_CONFIG.annual.features.slice(1, 4).map((f, i) => (
                                                                    <li key={i} className="text-[11px] text-slate-400 flex items-center gap-2"><Zap size={12} className="text-brand-gold fill-current" /> {f}</li>
                                                                ))}
                                                            </ul>
                                                        </button>
                                                    </div>
                                                    <div className="bg-black/30 p-6 rounded-xl border border-white/5 space-y-4">
                                                        <div className="flex flex-col md:flex-row gap-8 items-center">
                                                            <div className="flex-1 space-y-4 text-center md:text-left">
                                                                <div>
                                                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Plano Selecionado: {PLANS_CONFIG[selectedPlan].name}</p>
                                                                    <h4 className="text-white font-bold text-lg">Total a pagar: R$ {PLANS_CONFIG[selectedPlan].value.toFixed(2)}</h4>
                                                                    <p className="text-xs text-slate-400 mt-2">Assinatura com renovação automática. Cancele a qualquer momento.<br />Pagamento seguro via <strong>Kiwify</strong>. Liberação imediata.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => { const link = PLANS_CONFIG[selectedPlan].checkoutUrl; const finalLink = `${link}?email=${encodeURIComponent(config.userId + '@user.app')}&custom_id=${config.userId}`; window.open(finalLink, '_blank'); }} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl shadow-md transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3">
                                                            <CreditCard size={24} /> ASSINAR AGORA E DESBLOQUEAR
                                                        </button>
                                                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500"><Lock size={12} /> Assinatura Segura e Flexível</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10">
                                                    <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-md animate-pulse">
                                                        <Star size={40} className="text-brand-blue fill-current" />
                                                    </div>
                                                    <h3 className="text-3xl font-bold text-white mb-2">EXPERIÊNCIA COMPLETA!</h3>
                                                    <p className="text-slate-400 max-w-md mx-auto text-sm">Você já possui uma licença ativa. Aproveite todos os recursos do Finance Pro 360.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aparência do App</h4>
                                    </div>
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.theme === 'dark' ? 'bg-slate-900 text-yellow-400 border border-slate-700' : 'bg-orange-100 text-orange-500'}`}>
                                                {config.theme === 'dark' ? <Moon size={20} className="fill-current" /> : <Sun size={20} className="fill-current" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">Modo Escuro</p>
                                                <p className="text-[10px] text-slate-500">Altera as cores de todo o aplicativo.</p>
                                            </div>
                                        </div>
                                        <AppleToggle enabled={config.theme === 'dark'} onChange={() => onUpdateConfig({ ...config, theme: config.theme === 'dark' ? 'light' : 'dark' })} />
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                                                <DollarSign size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">Moeda Padrão</p>
                                                <p className="text-[10px] text-slate-500">Exibição de valores</p>
                                            </div>
                                        </div>
                                        <select value={config.currency || 'BRL'} onChange={(e) => onUpdateConfig({ ...config, currency: e.target.value as any })} className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                                            <option value="BRL">BRL (R$)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notificações e Alertas</h4>
                                    </div>
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                                                <Bell size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">Notificações Push</p>
                                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight mt-0.5">Alertas no dispositivo sobre vencimentos.</p>
                                            </div>
                                        </div>
                                        <AppleToggle enabled={isPushEnabled} disabled={pushLoading} onChange={handleTogglePush} />
                                    </div>
                                    <div className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">Vencimento Fatura</p>
                                                <p className="text-[10px] text-slate-500 max-w-[200px]">Dia do vencimento do cartão.</p>
                                            </div>
                                        </div>
                                        <input type="number" min="1" max="31" value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} className="w-16 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="space-y-6">
                                {[
                                    { title: 'Receitas', icon: <TrendingUp size={16} className="text-emerald-500" />, cat: 'incomeCategories', styleColor: 'emerald', add: addIncomeCat, rm: removeIncomeCat, v: newIncomeCat, setV: setNewIncomeCat },
                                    { title: 'Despesas', icon: <CreditCard size={16} className="text-rose-500" />, cat: 'expenseCategories', styleColor: 'rose', add: addExpenseCat, rm: removeExpenseCat, v: newExpenseCat, setV: setNewExpenseCat },
                                    { title: 'Formas de Pagamento', icon: <Wallet size={16} className="text-blue-500" />, cat: 'paymentMethods', styleColor: 'blue', add: addMethod, rm: removeMethod, v: newMethod, setV: setNewMethod },
                                ].map((list, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                {list.icon} {list.title}
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex gap-2 mb-6">
                                                <input type="text" placeholder="Adicionar novo..." value={list.v} onChange={(e) => list.setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && list.add()} className={`flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:border-transparent transition-all ${list.styleColor === 'emerald' ? 'focus:ring-emerald-500/20' : list.styleColor === 'rose' ? 'focus:ring-rose-500/20' : 'focus:ring-blue-500/20'}`} />
                                                <button onClick={list.add} className={`text-white px-4 rounded-xl shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${list.styleColor === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600' : list.styleColor === 'rose' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-500 hover:bg-blue-600'}`}><Plus size={20} /></button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <AnimatePresence>
                                                    {(config[list.cat as keyof AppConfig] as string[] || []).map(cat => (
                                                        <motion.span key={cat} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, y: -10 }} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border shadow-sm ${list.styleColor === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : list.styleColor === 'rose' ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' : 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'}`}>
                                                            {cat}
                                                            <button onClick={() => list.rm(cat)} className={`rounded-full p-0.5 transition-colors ${list.styleColor === 'emerald' ? 'text-emerald-400 hover:text-white hover:bg-emerald-500' : list.styleColor === 'rose' ? 'text-rose-400 hover:text-white hover:bg-rose-500' : 'text-blue-400 hover:text-white hover:bg-blue-500'}`}><X size={12} /></button>
                                                        </motion.span>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Proteção do Aplicativo</h4>
                                    </div>
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                                                <Lock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">Bloqueio Biométrico</p>
                                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight mt-0.5">Usar Face ID ou Digital.</p>
                                            </div>
                                        </div>
                                        <AppleToggle enabled={!!config.requireBiometrics} onChange={() => onUpdateConfig({ ...config, requireBiometrics: !config.requireBiometrics })} />
                                    </div>
                                    <div className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                                                <Key size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">Alterar Senha</p>
                                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight mt-0.5">Nova senha de acesso ao app.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <input type="password" placeholder="Nova senha..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full sm:w-40 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 outline-none transition-all" />
                                            <button onClick={handleChangePassword} className="bg-slate-800 dark:bg-slate-700 text-white px-4 rounded-lg text-xs font-bold hover:bg-black transition-transform active:scale-95 shadow-sm">ATUALIZAR</button>
                                        </div>
                                    </div>
                                    {passSuccess && <div className="px-4 pb-4"><p className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1"><CheckCircle size={12} /> Senha Alterada com sucesso!</p></div>}
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Backup & LGPD</h4>
                                    </div>
                                    <div className="p-4 flex flex-col sm:flex-row gap-3">
                                        <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs font-bold active:scale-95"><Download size={16} />BAIXAR BACKUP</button>
                                        <button onClick={() => setShowPrivacyModal(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors text-xs font-bold active:scale-95"><FileText size={16} />TERMOS DE PRIVACIDADE</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
};
