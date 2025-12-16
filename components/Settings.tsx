
import React, { useState, useEffect } from 'react';
import { AppConfig, Transaction, PurchaseRequest } from '../types';
import { Trash2, Plus, FileSpreadsheet, Download, Bell, CreditCard, CheckCircle, Clock, Upload, Shield, Key, Smartphone, Copy, Lock, Moon, Sun, AlertTriangle, FileText, QrCode, ArrowRight, DollarSign } from 'lucide-react';
import { exportToCSV, generateId, validateLicenseKey } from '../utils';
import { DBService } from '../db';
import { PrivacyModal } from './PrivacyModal';

interface SettingsProps {
    config: AppConfig;
    onUpdateConfig: (c: AppConfig) => void;
    transactions: Transaction[]; 
}

// --- CONFIGURAÇÃO DO PIX ---
// Código Pix Copia e Cola Completo
const PIX_PAYLOAD = "00020126580014br.gov.bcb.pix013671ee2472-12a1-4edf-b0e0-ad0bc4c2a98427600016BR.COM.PAGSEGURO0136D1917A9C-D209-49F6-BFBF-80644AC0D5A4520489995303986540549.905802BR5925THIAGO DA SILVA NASCIMENT6007Aracaju62290525PAGS0000049902512161508466304D5A4";
const PIX_NAME = "THIAGO DA SILVA NASCIMENTO";
const PIX_VALUE = "49.90";

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, transactions }) => {
    const [newCat, setNewCat] = useState('');
    const [newMethod, setNewMethod] = useState('');
    const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
    const [loadingReq, setLoadingReq] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    
    // Remote License State
    const [inputLicenseKey, setInputLicenseKey] = useState('');
    const [licenseError, setLicenseError] = useState('');

    // Change Password State
    const [newPassword, setNewPassword] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);

    // Privacy Modal State
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
        const text = `Olá! Realizei o pagamento de R$ ${PIX_VALUE.replace('.', ',')} via Pix e gostaria de solicitar a licença do Finance Pro 360.\n\nMeu ID de Usuário: *${config.userId}*\n\n(Anexe o comprovante aqui)`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const copyUserId = () => {
        if (config.userId) {
            navigator.clipboard.writeText(config.userId);
            alert('ID copiado para a área de transferência!');
        }
    };

    const copyPixCode = () => {
        navigator.clipboard.writeText(PIX_PAYLOAD);
        alert('Código Pix Copia e Cola copiado com sucesso!');
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
            
            {/* Purchase / License Section */}
            <div className="bg-gradient-to-r from-brand-blue to-[#0a192f] p-1 rounded-xl shadow-lg text-white border border-slate-700 relative overflow-hidden">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                <CreditCard className="text-brand-gold" size={24} />
                                Status da Assinatura
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                Gerencie sua licença e libere recursos exclusivos.
                            </p>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-bold text-sm ${
                            isLicensed 
                            ? 'bg-brand-gold/10 border-brand-gold text-brand-gold dark:bg-brand-gold/20' 
                            : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                            {isLicensed ? (
                                <><CheckCircle size={16} /> PREMIUM ATIVO</>
                            ) : (
                                purchaseRequest?.status === 'pending' ? (
                                    <><Clock size={16} /> AGUARDANDO PAGAMENTO</>
                                ) : (
                                    <><Lock size={16} /> VERSÃO GRATUITA</>
                                )
                            )}
                        </div>
                    </div>

                    {!isLicensed && (
                        <div className="space-y-8">
                            
                            {/* PASSO 1: Solicitar e Pagar */}
                            <div>
                                {!purchaseRequest ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                                        <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">Libere seu acesso agora</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                                            Adquira a licença vitalícia por apenas <span className="font-bold">R$ {PIX_VALUE.replace('.', ',')}</span> e desbloqueie gráficos avançados, aba de investimentos, cursos exclusivos e muito mais.
                                        </p>
                                        
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <span className="text-xs text-slate-500 font-mono uppercase">Seu ID:</span>
                                                <code className="text-sm font-bold text-slate-800 dark:text-slate-200 select-all">{config.userId}</code>
                                                <button onClick={copyUserId} className="text-brand-blue hover:text-brand-gold ml-2" title="Copiar ID">
                                                    <Copy size={14} />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={handleRequestPurchase}
                                                disabled={loadingReq}
                                                className="bg-gradient-to-r from-brand-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white py-3 px-8 rounded-full font-bold shadow-lg shadow-brand-gold/20 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                                            >
                                                {loadingReq ? 'Processando...' : <><QrCode size={18} /> Solicitar e Pagar com Pix</>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // ÁREA DE PAGAMENTO PIX
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-500 border-dashed rounded-xl p-6 animate-fade-in relative text-center">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider flex items-center gap-1">
                                            <QrCode size={12} /> Pagamento Pix
                                        </div>
                                        
                                        <div className="mt-4 flex flex-col items-center gap-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                Escaneie o QR Code abaixo com o app do seu banco:
                                            </p>
                                            
                                            <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200 inline-block relative">
                                                {/* Fallback automático usando o Payload Completo para gerar QR Code correto se a imagem falhar */}
                                                <img 
                                                    src="/pix-qrcode.png" 
                                                    alt="QR Code Pix" 
                                                    className="w-48 h-48 object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_PAYLOAD)}`;
                                                    }}
                                                />
                                                <div className="text-center mt-2 pb-1 border-t border-slate-100">
                                                    <p className="text-lg font-bold text-emerald-600">R$ {PIX_VALUE.replace('.', ',')}</p>
                                                </div>
                                            </div>

                                            <div className="w-full max-w-sm space-y-2">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pix Copia e Cola:</p>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-700 dark:text-slate-200 flex items-center truncate">
                                                        {PIX_PAYLOAD.substring(0, 30)}...
                                                    </div>
                                                    <button 
                                                        onClick={copyPixCode}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg transition-colors shadow-sm flex items-center justify-center shrink-0"
                                                        title="Copiar Código Pix Completo"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                </div>
                                                <div className="text-center mt-1">
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                                        Beneficiário: <strong className="text-slate-600 dark:text-slate-300">{PIX_NAME}</strong>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 pt-6 border-t border-emerald-200 dark:border-emerald-800/30">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                                Após realizar o pagamento, envie o comprovante:
                                            </p>
                                            <button 
                                                onClick={handleWhatsAppRequest}
                                                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                            >
                                                <Smartphone size={18} />
                                                Enviar Comprovante via WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PASSO 2: Inserir Chave */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-3 flex items-center gap-2">
                                    <Key size={16} /> Já possui sua chave?
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                                    <input 
                                        type="text" 
                                        value={inputLicenseKey}
                                        onChange={e => setInputLicenseKey(e.target.value.toUpperCase())}
                                        placeholder="Cole sua chave de licença aqui (XXXX-XXXX)"
                                        className="flex-1 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 text-sm font-mono uppercase focus:border-brand-gold outline-none transition-colors"
                                    />
                                    <button 
                                        onClick={handleActivateLicense}
                                        className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        Ativar Agora <ArrowRight size={16} />
                                    </button>
                                </div>
                                {licenseError && (
                                    <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1 animate-fade-in">
                                        <AlertTriangle size={12} /> {licenseError}
                                    </p>
                                )}
                            </div>

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
                    {/* Theme */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">Tema da Aplicação</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Escolha entre o modo claro ou escuro.
                            </p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex items-center border border-slate-200 dark:border-slate-600">
                            <button
                                onClick={() => onUpdateConfig({...config, theme: 'light'})}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    config.theme !== 'dark' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                Claro
                            </button>
                            <button
                                onClick={() => onUpdateConfig({...config, theme: 'dark'})}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    config.theme === 'dark' 
                                    ? 'bg-slate-600 text-white shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                Escuro
                            </button>
                        </div>
                    </div>

                    {/* Currency */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
                         <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-500" /> Moeda Preferida
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Símbolo monetário usado em todo o aplicativo.
                            </p>
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

            {/* Security & Data Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-6">
                    <Shield className="text-brand-blue dark:text-brand-gold" size={20} />
                    Segurança e Privacidade
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Password Change */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Key size={16} /> Alterar Senha
                        </h4>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                placeholder="Nova senha..." 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                            />
                            <button 
                                onClick={handleChangePassword}
                                className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
                            >
                                Atualizar
                            </button>
                        </div>
                        {passSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><CheckCircle size={12}/> Senha atualizada com sucesso!</p>}
                        
                        {/* Privacy Policy Link */}
                        <div className="mt-4 pt-2">
                            <button 
                                onClick={() => setShowPrivacyModal(true)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                <FileText size={16} />
                                Ver Política de Privacidade e LGPD
                            </button>
                        </div>
                    </div>

                    {/* Backup & Restore */}
                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 md:pl-8 pt-4 md:pt-0">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Download size={16} /> Backup e Restauração
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={handleBackup}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                            >
                                <Download size={16} />
                                Baixar Dados
                            </button>
                            <label className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-medium cursor-pointer">
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

            {/* DANGER ZONE - LGPD Right to be Forgotten */}
            <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-xl shadow-sm border border-rose-200 dark:border-rose-900 transition-colors">
                 <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-500 flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} />
                    Zona de Perigo
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Ações irreversíveis relacionadas à sua conta e dados.
                </p>
                
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-rose-100 dark:border-rose-900/50">
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Excluir Minha Conta (LGPD)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Isso apagará permanentemente todos os seus dados e revogará seu acesso.
                        </p>
                    </div>
                    <button 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        {isDeleting ? 'Excluindo...' : 'Excluir Conta'}
                    </button>
                </div>
            </div>

            {/* Reminders Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
                    <Bell className="text-blue-600 dark:text-blue-400" size={20} />
                    Notificações e Lembretes
                </h3>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Lembretes de Metas</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-900/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Frequency Settings - Conditional */}
                 {(config.enableReminders ?? true) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 animate-fade-in pl-2">
                        <div className="flex items-center justify-between max-w-sm">
                            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Frequência dos alertas:</label>
                            <select 
                                value={config.reminderFrequency || 'weekly'} 
                                onChange={(e) => onUpdateConfig({...config, reminderFrequency: e.target.value as any})}
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none w-40"
                            >
                                <option value="weekly">Semanal</option>
                                <option value="biweekly">Quinzenal</option>
                                <option value="monthly">Mensal</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Google Sheets / Data Integration Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <FileSpreadsheet className="text-emerald-600 dark:text-emerald-400" />
                            Integração Google Sheets
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-colors">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">Categorias</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Utilizadas em Receitas e Despesas.</p>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Nova Categoria" 
                            className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                            <li key={cat} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700 group transition-colors">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                                <button onClick={() => removeCat(cat)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Payment Methods Settings */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-colors">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Formas de Pagamento</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Utilizadas apenas em Despesas.</p>

                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Nova Forma de Pagamento" 
                            className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={newMethod}
                            onChange={e => setNewMethod(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addMethod()}
                        />
                        <button onClick={addMethod} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            <Plus size={20} />
                        </button>
                    </div>

                    <ul className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-80">
                        {config.paymentMethods.map(met => (
                            <li key={met} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700 group transition-colors">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{met}</span>
                                <button onClick={() => removeMethod(met)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
};
