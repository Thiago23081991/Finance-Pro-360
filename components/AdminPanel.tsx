
import React, { useState, useEffect } from 'react';
import { PurchaseRequest, AdminMessage, SystemStats, UserProfile } from '../types';
import { DBService } from '../db';
import {
    Check, X, ShieldAlert, User, MessageSquare, Send, FileText, Mail,
    Eye, EyeOff, RefreshCw, Key, Copy, Smartphone, Lock, Loader2,
    Users, BarChart3, Wallet, Database, ShieldOff, ShieldCheck,
    Wrench, UserPlus, AlertTriangle, Megaphone, Search, Bell,
    LayoutDashboard, LogOut, ChevronRight
} from 'lucide-react';
import { generateId, generateLicenseKey, formatCurrency } from '../utils';

type AdminTab = 'dashboard' | 'users' | 'push' | 'tools';

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

    const filteredUsers = profiles.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-800 dark:text-white text-lg leading-tight">ADMIN</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Painel</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        <Users size={18} /> Usuários
                    </button>
                    <button onClick={() => setActiveTab('push')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'push' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        <Bell size={18} /> Central Push
                    </button>
                    <button onClick={() => setActiveTab('tools')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'tools' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        <Wrench size={18} /> Ferramentas
                    </button>
                </nav>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <div className="bg-slate-900 rounded-xl p-4 relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                        <p className="text-slate-400 text-xs font-bold mb-1">Status do Sistema</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-bold">Operacional</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
                            {activeTab === 'dashboard' && 'Visão Geral'}
                            {activeTab === 'users' && 'Gestão de Usuários'}
                            {activeTab === 'push' && 'Disparo de Notificações'}
                            {activeTab === 'tools' && 'Ferramentas de Suporte'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Bem-vindo ao painel de controle do Finance Pro 360.</p>
                    </div>
                    <button onClick={fetchData} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                        <RefreshCw size={20} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </header>

                {/* Dashboard View */}
                {activeTab === 'dashboard' && stats && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                        <Users size={24} />
                                    </div>
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">+12%</span>
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalUsers}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Usuários Totais</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                        <Wallet size={24} />
                                    </div>
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">+5%</span>
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.activeLicenses}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Assinantes Premium</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                                        <DollarSignIcon size={24} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">R$ {(stats.activeLicenses * 80).toLocaleString('pt-BR')}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Receita Estimada (Ano)</p>
                            </div>
                        </div>

                        {/* Recent Activity Table (Mock) */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Atividade Recente</h3>
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
                                                    setSearchTerm(user.email);
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
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                <Search className="text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar usuário..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-transparent outline-none text-sm w-full dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Usuário</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800 dark:text-white">{user.name || 'Sem Nome'}</td>
                                            <td className="p-4 text-sm text-slate-500">{user.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${user.licenseStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.licenseStatus === 'active' ? 'PREMIUM' : 'GRÁTIS'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleToggleLicense(user)}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                                                >
                                                    {user.licenseStatus === 'active' ? 'Remover Premium' : 'Dar Premium'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Push Notification View */}
                {activeTab === 'push' && (
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6 mx-auto">
                                <Megaphone size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-8">Disparar Notificação</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Destinatário</label>
                                    <select
                                        value={pushTarget}
                                        onChange={(e) => setPushTarget(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                                    >
                                        <option value="all">📢 TODOS OS USUÁRIOS</option>
                                        {profiles.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título do Alerta</label>
                                    <input
                                        type="text"
                                        value={pushTitle}
                                        onChange={e => setPushTitle(e.target.value)}
                                        placeholder="Ex: Fatura Vencendo!"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mensagem</label>
                                    <textarea
                                        value={pushBody}
                                        onChange={e => setPushBody(e.target.value)}
                                        placeholder="Sua fatura do cartão vence amanhã..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none resize-none h-32"
                                    />
                                </div>

                                <button
                                    onClick={handleSendPush}
                                    disabled={pushSending}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {pushSending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                    ENVIAR NOTIFICAÇÃOAGORA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tools View */}
                {activeTab === 'tools' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-white"><UserPlus size={20} className="text-orange-500" /> Reparar Usuário Fantasma</h3>
                            <div className="space-y-4">
                                <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="UUID do Usuário" className="w-full bg-slate-50 p-3 rounded-lg text-sm border border-slate-200" />
                                <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-50 p-3 rounded-lg text-sm border border-slate-200" />
                                <button onClick={handleCreateGhost} className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600">Criar Perfil</button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-white"><Key size={20} className="text-emerald-500" /> Gerar Chave Offline</h3>
                            <div className="space-y-4">
                                <input value={genUserId} onChange={e => setGenUserId(e.target.value)} placeholder="UUID do Usuário" className="w-full bg-slate-50 p-3 rounded-lg text-sm border border-slate-200" />
                                {generatedKey && <div className="p-4 bg-emerald-50 text-emerald-700 font-mono text-center font-bold rounded-lg border border-emerald-200 select-all">{generatedKey}</div>}
                                <button onClick={handleGenerateKey} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-lg hover:bg-emerald-600">Gerar Chave</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
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
