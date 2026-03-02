
import React, { useState, useEffect } from 'react';
import { PurchaseRequest, AdminMessage, SystemStats, UserProfile } from '../types';
import { DBService } from '../db';
import {
    Check, X, ShieldAlert, User, MessageSquare, Send, FileText, Mail,
    Eye, EyeOff, RefreshCw, Key, Copy, Smartphone, Lock, Loader2,
    Users, BarChart3, Wallet, Database, ShieldOff, ShieldCheck,
    Wrench, UserPlus, AlertTriangle, Megaphone, Search, Bell,
    LayoutDashboard, LogOut, ChevronRight, Download, CreditCard, TrendingUp, Zap
} from 'lucide-react';
import { generateId, generateLicenseKey, formatCurrency } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportAdminView } from './SupportAdminView';

type AdminTab = 'dashboard' | 'users' | 'push' | 'tools' | 'support';

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Push State
    const [pushTarget, setPushTarget] = useState<'all' | string>('all');
    const [pushTitle, setPushTitle] = useState('');
    const [pushBody, setPushBody] = useState('');
    const [pushSending, setPushSending] = useState(false);

    // Manual Tools State
    const [genUserId, setGenUserId] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');
    const [manualId, setManualId] = useState('');
    const [manualEmail, setManualEmail] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sysStats, dbProfiles] = await Promise.all([
                DBService.getSystemStats(),
                DBService.getAllProfiles()
            ]);
            setStats(sysStats);
            setProfiles(dbProfiles);
        } catch (error) {
            console.error("Error fetching admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLicense = async (profile: UserProfile) => {
        const newStatus = profile.licenseStatus === 'active' ? 'inactive' : 'active';
        if (!window.confirm(`Deseja ${newStatus === 'active' ? 'ativar' : 'remover'} o Premium de ${profile.name}?`)) return;

        try {
            await DBService.updateUserLicense(profile.id, newStatus);
            setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, licenseStatus: newStatus } : p));
            if (stats) {
                setStats({
                    ...stats,
                    activeLicenses: newStatus === 'active' ? stats.activeLicenses + 1 : stats.activeLicenses - 1
                });
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleSendPush = async () => {
        if (!pushTitle || !pushBody) {
            alert("Título e Mensagem são obrigatórios");
            return;
        }

        if (!window.confirm(`Enviar Push para ${pushTarget === 'all' ? 'TODOS' : 'usuário específico'}?`)) return;

        setPushSending(true);
        try {
            await DBService.sendPushNotification(pushTarget, pushTitle, pushBody);
            alert("Push enviado com sucesso!");
            setPushTitle('');
            setPushBody('');
        } catch (error: any) {
            alert("Erro ao enviar: " + error.message);
        } finally {
            setPushSending(false);
        }
    };

    const handleGenerateKey = () => {
        if (!genUserId) return;
        setGeneratedKey(generateLicenseKey(genUserId));
    };

    const handleCreateGhost = async () => {
        if (!manualId || !manualEmail) return;
        try {
            await DBService.createProfileManually(manualId, manualEmail, 'Usuário Recuperado');
            alert("Perfil criado!");
            setManualId(''); setManualEmail('');
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleExportLeads = () => {
        // Filter users who are not active premium (leads)
        const leads = profiles.filter(p => p.licenseStatus !== 'active');

        if (leads.length === 0) {
            alert("Nenhum lead encontrado para exportação.");
            return;
        }

        // CSV Header
        const headers = ['Nome', 'Email', 'Telefone', 'Data Cadastro', 'Status'];

        // CSV Rows
        const rows = leads.map(p => [
            p.name || 'Sem Nome',
            p.email,
            p.phone || '',
            p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
            'Inativo'
        ]);

        // Combine into CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredUsers = profiles.filter(p =>
        (p.name && p.name.toLowerCase().includes((searchTerm || '').toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes((searchTerm || '').toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 flex flex-col md:flex-row gap-6 animate-fade-in">
            {/* Sidebar */}
            <div className="w-full md:w-64 shrink-0">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col sticky top-4">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight uppercase tracking-tight">Admin</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Painel Pro</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-1 overflow-x-auto custom-scrollbar md:overflow-visible">
                        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max md:min-w-0 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max md:min-w-0 ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            <Users size={18} /> Usuários
                        </button>
                        <button onClick={() => setActiveTab('push')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max md:min-w-0 ${activeTab === 'push' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            <Bell size={18} /> Central Push
                        </button>
                        <button onClick={() => setActiveTab('tools')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max md:min-w-0 ${activeTab === 'tools' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            <Wrench size={18} /> Ferramentas
                        </button>
                        <button onClick={() => setActiveTab('support')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max md:min-w-0 ${activeTab === 'support' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            <MessageSquare size={18} /> Chamados
                        </button>
                    </nav>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 relative overflow-hidden group border border-slate-700 shadow-md">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Status da Nave</p>
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </div>
                                <span className="text-white text-sm font-black tracking-wide">OPERACIONAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <header className="flex justify-between items-center mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <div className="px-2">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">
                            {activeTab === 'dashboard' && 'Visão Geral'}
                            {activeTab === 'users' && 'Usuários'}
                            {activeTab === 'push' && 'Disparo de Push'}
                            {activeTab === 'tools' && 'Ferramentas'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Painel de Controle</p>
                    </div>
                    <button onClick={fetchData} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors active:scale-95">
                        <RefreshCw size={18} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {/* Dashboard View */}
                        {activeTab === 'dashboard' && stats && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg border border-indigo-400 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl transition-transform group-hover:scale-110"></div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="p-3 bg-white/20 rounded-xl text-white backdrop-blur-sm">
                                                <Users size={24} />
                                            </div>
                                        </div>
                                        <h3 className="text-4xl font-black text-white relative z-10">{stats.totalUsers}</h3>
                                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">Usuários Ativos</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-6 rounded-2xl shadow-lg border border-amber-300 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl transition-transform group-hover:scale-110"></div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="p-3 bg-white/20 rounded-xl text-white backdrop-blur-sm">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">PRO</span>
                                        </div>
                                        <h3 className="text-4xl font-black text-white relative z-10">{stats.activeLicenses}</h3>
                                        <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">Assinaturas</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg border border-emerald-400 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl transition-transform group-hover:scale-110"></div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="p-3 bg-white/20 rounded-xl text-white backdrop-blur-sm">
                                                <TrendingUp size={24} />
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-white relative z-10">R$ {(stats.activeLicenses * 80).toLocaleString('pt-BR')}</h3>
                                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">MRR Estimado</p>
                                    </div>
                                </div>

                                {/* Recent Activity Table (Apple Settings Style List) */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contas Criadas Recentemente</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {profiles
                                            .slice() // Create a copy so we don't mutate state
                                            .sort((a, b) => {
                                                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                                return dateB - dateA;
                                            })
                                            .slice(0, 5) // Last 5 users
                                            .map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                                {user.name || 'Novo Usuário'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {user.createdAt
                                                                    ? new Date(user.createdAt).toLocaleDateString('pt-BR') + ' às ' + new Date(user.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                                                    : 'Data desconhecida'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className="text-xs font-bold text-blue-600 cursor-pointer hover:underline"
                                                        onClick={() => {
                                                            setSearchTerm(user.email || '');
                                                            setActiveTab('users');
                                                        }}
                                                    >
                                                        Ver Detalhes
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users View */}
                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                        <Search className="text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Buscar usuário por nome ou email..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="bg-transparent outline-none text-sm font-bold w-full text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={handleExportLeads}
                                        className="bg-slate-800 dark:bg-slate-700 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                                    >
                                        <Download size={18} /> Exportar Leads
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Usuário</th>
                                                    <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Email</th>
                                                    <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase text-center">Status</th>
                                                    <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredUsers.map(user => (
                                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                                        <td className="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                                                                {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                                                            </div>
                                                            {user.name || 'Sem Nome'}
                                                        </td>
                                                        <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">{user.email}</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${user.licenseStatus === 'active' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                                                }`}>
                                                                {user.licenseStatus === 'active' ? 'PRO' : 'FREE'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => handleToggleLicense(user)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 ${user.licenseStatus === 'active' ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                                                            >
                                                                {user.licenseStatus === 'active' ? 'Revogar Pro' : 'Dar Premium'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Push Notification View */}
                        {activeTab === 'push' && (
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
                                        <Megaphone size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 tracking-tight">Broadcast Push</h3>
                                    <p className="text-center text-xs text-slate-500 mb-8 font-bold">Envie alertas em tempo real para os dispositivos</p>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 ml-1">Destinatário</label>
                                            <select
                                                value={pushTarget}
                                                onChange={(e) => setPushTarget(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                            >
                                                <option value="all">📢 TODOS OS USUÁRIOS (Broadcast)</option>
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 ml-1">Título do Alerta</label>
                                            <input
                                                type="text"
                                                value={pushTitle}
                                                onChange={e => setPushTitle(e.target.value)}
                                                placeholder="Ex: Fatura Vencendo!"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 ml-1">Mensagem (Corpo)</label>
                                            <textarea
                                                value={pushBody}
                                                onChange={e => setPushBody(e.target.value)}
                                                placeholder="Sua fatura do cartão vence amanhã..."
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none resize-none h-32 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSendPush}
                                            disabled={pushSending}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                                        >
                                            {pushSending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                            {pushSending ? 'ENVIANDO...' : 'ENVIAR NOTIFICAÇÃO'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tools View */}
                        {activeTab === 'tools' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shadow-inner">
                                            <UserPlus size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white">Reparar Perfil</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Criar usuário fantasma</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="UUID do Usuário (ID)" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20" />
                                        <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="Email Associado" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20" />
                                    </div>
                                    <button onClick={handleCreateGhost} className="w-full bg-orange-500 text-white font-bold py-3 mt-4 rounded-xl hover:bg-orange-600 shadow-sm active:scale-95 transition-transform">INJETAR PERFIL</button>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shadow-inner">
                                            <Key size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white">Gerador de Licença</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Criar chave offline premium</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <input value={genUserId} onChange={e => setGenUserId(e.target.value)} placeholder="UUID do Usuário (ID)" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                        {generatedKey && (
                                            <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-center text-sm rounded-xl border border-slate-800 select-all font-bold">
                                                {generatedKey}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleGenerateKey} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold py-3 mt-4 rounded-xl hover:bg-black shadow-sm active:scale-95 transition-transform">GERAR HASH</button>
                                </div>
                            </div>
                        )}

                        {/* Support Admin View */}
                        {activeTab === 'support' && (
                            <SupportAdminView />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const DollarSignIcon = ({ size }: { size: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-dollar-sign"
    >
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);
