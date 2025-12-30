
import React, { useState, useEffect } from 'react';
import { AppConfig, Transaction, PurchaseRequest } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, Bell, CreditCard, CheckCircle, Upload, Shield, Key, Lock, Moon, Sun, AlertTriangle, FileText, ArrowRight, DollarSign, Rocket, Star, ExternalLink, TableProperties, Info, Copy, Smartphone, Timer, QrCode, Loader2, Target, Scale, User, Edit2, Save, MessageCircle, Zap, Tag, Wallet } from 'lucide-react';
import { exportToCSV, validateLicenseKey, generateId } from '../utils';
import { DBService } from '../db';
import { PrivacyModal } from './PrivacyModal';
import { PLANS_CONFIG } from '../constants';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
    transactions: Transaction[]; 
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, transactions }) => {
    const [newCat, setNewCat] = useState('');
    const [newMethod, setNewMethod] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    
    // Perfil
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(config.name || '');

    // Upgrade
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
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
    }, [config.userId, isLicensed, config.name]);

    const handleSaveName = () => {
        onUpdateConfig({ ...config, name: tempName });
        setIsEditingName(false);
    };

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

    const handleRequestActivation = async () => {
        if (!config.userId) return;
        setIsRequestingState(true);
        try {
            const req: PurchaseRequest = {
                id: generateId(),
                userId: config.userId,
                requestDate: new Date().toISOString(),
                status: 'pending'
            };
            await DBService.savePurchaseRequest(req);
            setPurchaseRequest(req);
            
            // Redirecionar para o WhatsApp com os dados do plano escolhido
            const planName = PLANS_CONFIG[selectedPlan].name;
            const planValue = PLANS_CONFIG[selectedPlan].value.toFixed(2);
            const whatsappMsg = `Olá! Acabei de fazer o PIX de R$ ${planValue} para o ${planName}.\n\nNome: ${config.name || 'Usuário Sem Nome'}\nID do Usuário: ${config.userId}\n\nEstou enviando o comprovante em anexo.`;
            window.open(`https://wa.me/5579988541124?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
            
            alert("Solicitação registrada! Agora envie o comprovante no WhatsApp que abrimos para você.");
        } catch (e) {
            alert("Erro ao solicitar ativação.");
        } finally {
            setIsRequestingState(false);
        }
    };

    const copyPixCopiaECola = () => {
        navigator.clipboard.writeText(PLANS_CONFIG[selectedPlan].payload);
        alert("PIX Copia e Cola copiado!");
    };

    const addCat = () => {
        if(newCat && !config.categories.includes(newCat)) {
            onUpdateConfig({...config, categories: [...config.categories, newCat]});
            setNewCat('');
        }
    };

    const removeCat = (c: string) => {
        if (window.confirm(`Deseja remover a categoria "${c}"?`)) {
            onUpdateConfig({...config, categories: config.categories.filter(cat => cat !== c)});
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

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-10">
            
            {/* Perfil do Usuário */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-6">
                    <User className="text-blue-500" size={20} />
                    Configuração de Perfil
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Como você quer ser chamado?</label>
                            <div className="flex gap-2">
                                {isEditingName ? (
                                    <>
                                        <input 
                                            type="text" 
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Seu nome aqui..."
                                        />
                                        <button onClick={handleSaveName} className="px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm">SALVAR</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-4 py-2.5 text-lg font-black text-slate-800 dark:text-white">
                                            {config.name || 'Usuário Sem Nome'}
                                        </div>
                                        <button onClick={() => setIsEditingName(true)} className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><Edit2 size={20} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identificador da Conta (ID)</label>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                <Key size={12} />
                                <span className="truncate">{config.userId}</span>
                                <button onClick={() => { navigator.clipboard.writeText(config.userId || ''); alert('ID Copiado!'); }} className="text-blue-500 hover:text-blue-600 ml-2"><Copy size={12} /></button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center text-3xl font-black text-brand-blue mb-3 shadow-lg border-4 border-white dark:border-slate-800">
                            {(config.name || 'U').substring(0, 1).toUpperCase()}
                        </div>
                        <p className="font-black text-slate-800 dark:text-white text-xl leading-tight">{config.name || 'Usuário'}</p>
                        <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isLicensed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                            {isLicensed ? 'Licença Ativa' : 'Plano Gratuito'}
                        </span>
                    </div>
                </div>
            </div>

            {/* UPGRADE - ESCOLHA DE PLANOS */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <Rocket className="text-brand-gold" size={32} />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Evolua sua Gestão</h3>
                        </div>

                        {!isLicensed ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setSelectedPlan('basic')}
                                        className={`relative p-5 rounded-2xl border-2 text-left transition-all ${selectedPlan === 'basic' ? 'border-brand-gold bg-white/5 ring-4 ring-brand-gold/10' : 'border-slate-700 bg-black/20 hover:border-slate-500'}`}
                                    >
                                        {selectedPlan === 'basic' && <CheckCircle className="absolute top-4 right-4 text-brand-gold" size={20} />}
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Entrada</p>
                                        <h4 className="text-white font-black text-lg">PLANO BÁSICO</h4>
                                        <div className="mt-2 text-2xl font-black text-white">R$ 19,90<span className="text-xs font-normal text-slate-400 ml-1">VITALÍCIO</span></div>
                                        <ul className="mt-4 space-y-2">
                                            {PLANS_CONFIG.basic.features.slice(0, 3).map((f, i) => (
                                                <li key={i} className="text-[11px] text-slate-400 flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500"/> {f}</li>
                                            ))}
                                        </ul>
                                    </button>

                                    <button 
                                        onClick={() => setSelectedPlan('premium')}
                                        className={`relative p-5 rounded-2xl border-2 text-left transition-all ${selectedPlan === 'premium' ? 'border-brand-gold bg-white/5 ring-4 ring-brand-gold/10' : 'border-slate-700 bg-black/20 hover:border-slate-500'}`}
                                    >
                                        {selectedPlan === 'premium' && <CheckCircle className="absolute top-4 right-4 text-brand-gold" size={20} />}
                                        <div className="absolute -top-3 left-4 bg-brand-gold text-brand-blue text-[9px] font-black px-2 py-0.5 rounded-full">O MAIS COMPLETO</div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Profissional</p>
                                        <h4 className="text-white font-black text-lg">PLANO PREMIUM</h4>
                                        <div className="mt-2 text-2xl font-black text-white">R$ 80,00<span className="text-xs font-normal text-slate-400 ml-1">VITALÍCIO</span></div>
                                        <ul className="mt-4 space-y-2">
                                            {PLANS_CONFIG.premium.features.slice(1, 4).map((f, i) => (
                                                <li key={i} className="text-[11px] text-slate-400 flex items-center gap-2"><Zap size={12} className="text-brand-gold fill-current"/> {f}</li>
                                            ))}
                                        </ul>
                                    </button>
                                </div>

                                <div className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        <div className="bg-white p-3 rounded-xl shrink-0">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(PLANS_CONFIG[selectedPlan].payload)}`} 
                                                alt="PIX QR Code" 
                                                className="w-32 h-32"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-4 text-center md:text-left">
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Plano Selecionado: {PLANS_CONFIG[selectedPlan].name}</p>
                                                <h4 className="text-white font-bold text-lg">Total a pagar: R$ {PLANS_CONFIG[selectedPlan].value.toFixed(2)}</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                                <button onClick={copyPixCopiaECola} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/10">
                                                    <Copy size={14} /> COPIAR PIX
                                                </button>
                                                <a href={`https://wa.me/5579988541124?text=${encodeURIComponent(`Olá! Quero suporte sobre o plano ${PLANS_CONFIG[selectedPlan].name}.\nID: ${config.userId}`)}`} target="_blank" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-xs font-bold px-4 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                                                    <MessageCircle size={14} /> TIRAR DÚVIDAS
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {purchaseRequest?.status === 'pending' ? (
                                        <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4">
                                            <Timer className="text-amber-400 animate-pulse" size={24} />
                                            <div>
                                                <p className="text-sm font-bold text-amber-200">SOLICITAÇÃO EM ANÁLISE</p>
                                                <p className="text-[11px] text-amber-200/60">Aguardando confirmação do PIX. O prazo é de até 24h.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleRequestActivation}
                                            disabled={isRequestingState}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                                        >
                                            {isRequestingState ? <Loader2 className="animate-spin" size={24} /> : <MessageCircle size={24} />}
                                            {isRequestingState ? 'PROCESSANDO...' : 'JÁ FIZ O PIX, ENVIAR COMPROVANTE'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                                    <Star size={40} className="text-brand-blue fill-current" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-2">EXPERIÊNCIA COMPLETA!</h3>
                                <p className="text-slate-400 max-w-md mx-auto text-sm">Você já possui uma licença ativa. Aproveite todos os recursos do Finance Pro 360.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Aparência e Moeda */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-6">
                    {config.theme === 'dark' ? <Moon className="text-blue-500" size={20} /> : <Sun className="text-orange-500" size={20} />}
                    Aparência e Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Tema Visual</p>
                            <p className="text-[11px] text-slate-500">Claro ou Escuro</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg flex items-center border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button onClick={() => onUpdateConfig({...config, theme: 'light'})} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${config.theme !== 'dark' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>CLARO</button>
                            <button onClick={() => onUpdateConfig({...config, theme: 'dark'})} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${config.theme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>ESCURO</button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Moeda</p>
                            <p className="text-[11px] text-slate-500">Formatação de valores</p>
                        </div>
                        <select
                            value={config.currency || 'BRL'}
                            onChange={(e) => onUpdateConfig({...config, currency: e.target.value as any})}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none"
                        >
                            <option value="BRL">REAL (R$)</option>
                            <option value="USD">DÓLAR ($)</option>
                            <option value="EUR">EURO (€)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Personalização: Categorias e Métodos */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-6">
                    <Tag className="text-brand-blue dark:text-brand-gold" size={20} />
                    Personalização de Listas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Categorias */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Minhas Categorias</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Nova categoria..." 
                                value={newCat} 
                                onChange={(e) => setNewCat(e.target.value)} 
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-gold" 
                            />
                            <button onClick={addCat} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg"><Plus size={18}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {config.categories.map(cat => (
                                <span key={cat} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                    {cat}
                                    <button onClick={() => removeCat(cat)} className="text-slate-400 hover:text-rose-500"><Trash2 size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Métodos de Pagamento */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 md:pl-8 pt-4 md:pt-0">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Métodos de Pagamento</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Novo método..." 
                                value={newMethod} 
                                onChange={(e) => setNewMethod(e.target.value)} 
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-gold" 
                            />
                            <button onClick={addMethod} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg"><Plus size={18}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {config.paymentMethods.map(method => (
                                <span key={method} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                    {method}
                                    <button onClick={() => removeMethod(method)} className="text-slate-400 hover:text-rose-500"><Trash2 size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Segurança e Dados */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-6"><Shield className="text-brand-blue dark:text-brand-gold" size={20} />Proteção e Backup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Alterar Senha de Acesso</label>
                        <div className="flex gap-2">
                            <input type="password" placeholder="Nova senha..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-brand-gold outline-none" />
                            <button onClick={handleChangePassword} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-black transition-colors">ATUALIZAR</button>
                        </div>
                        {passSuccess && <p className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1"><CheckCircle size={12}/> Senha Alterada!</p>}
                    </div>
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 md:pl-8 pt-4 md:pt-0">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Exportação e Segurança</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-2.5 rounded-lg hover:bg-blue-100 transition-colors text-xs font-black"><Download size={14} />BAIXAR BACKUP</button>
                            <button onClick={() => setShowPrivacyModal(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors text-xs font-black"><FileText size={14} />VER TERMOS LGPD</button>
                        </div>
                    </div>
                </div>
            </div>

            <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
};
