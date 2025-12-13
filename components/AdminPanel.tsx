
import React, { useState, useEffect } from 'react';
import { PurchaseRequest, AdminMessage, SystemStats, UserProfile } from '../types';
import { DBService } from '../db';
import { Check, X, ShieldAlert, User, MessageSquare, Send, FileText, Mail, Eye, EyeOff, RefreshCw, Key, Copy, Smartphone, Lock, Loader2, Users, BarChart3, Wallet, Database, ShieldOff, ShieldCheck, Wrench, UserPlus, AlertTriangle } from 'lucide-react';
import { generateId, generateLicenseKey, formatCurrency } from '../utils';

type AdminTab = 'overview' | 'users' | 'requests' | 'messages' | 'generator';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Data States
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Message Modal State
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [msgTargetUser, setMsgTargetUser] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);

  // Tools/Generator State
  const [genUserId, setGenUserId] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  
  // Manual Create Profile State
  const [manualId, setManualId] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        // Parallel fetching for performance
        const [sysStats, dbProfiles, dbRequests, msgs] = await Promise.all([
            DBService.getSystemStats(),
            DBService.getAllProfiles(),
            DBService.getAllPurchaseRequests(),
            DBService.getAllMessages()
        ]);

        setStats(sysStats);

        // --- LÓGICA DE MESCLAGEM AUTOMÁTICA (RESOLVE USUÁRIOS FANTASMAS) ---
        // 1. Cria um mapa dos perfis existentes para acesso rápido
        const profileMap = new Map(dbProfiles.map(p => [p.id, p]));
        
        // 2. Identifica usuários que estão nos PEDIDOS mas NÃO estão nos PERFIS
        const ghostUsers: UserProfile[] = [];
        const uniqueRequestUserIds = new Set(dbRequests.map(r => r.userId));

        uniqueRequestUserIds.forEach(reqUserId => {
            if (!profileMap.has(reqUserId)) {
                // Usuário Fantasma detectado! Vamos criar um perfil virtual para exibição
                ghostUsers.push({
                    id: reqUserId,
                    name: 'Usuário (Perfil Pendente)',
                    email: 'Email não registrado',
                    username: 'user_ghost',
                    licenseStatus: 'inactive', // Default
                    isGhost: true,
                    createdAt: new Date().toISOString()
                });
            }
        });

        // 3. Combina perfis reais com fantasmas para a lista completa
        const allProfiles = [...dbProfiles, ...ghostUsers];
        setProfiles(allProfiles);

        // --- ENRIQUECIMENTO DAS SOLICITAÇÕES (EXIBIR NOME NA ABA LICENÇAS) ---
        const enrichedRequests = dbRequests.map(req => {
            const userProfile = profileMap.get(req.userId) || ghostUsers.find(g => g.id === req.userId);
            return {
                ...req,
                userName: userProfile?.name || 'Desconhecido',
                userEmail: userProfile?.email
            };
        });

        // Ordenação dos pedidos
        const sortedReqs = enrichedRequests.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        });
        setRequests(sortedReqs);
        setPendingRequestsCount(sortedReqs.filter(r => r.status === 'pending').length);

        setMessages(msgs);
    } catch (error) {
        console.error("Error loading admin data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh stats periodically
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (req: PurchaseRequest, newStatus: 'approved' | 'rejected') => {
    try {
        const updated: PurchaseRequest = { ...req, status: newStatus };
        await DBService.savePurchaseRequest(updated);
        
        // Refresh para garantir sincronia
        fetchData();

    } catch (error: any) {
        alert("Erro ao atualizar status: " + error.message);
    }
  };

  const handleToggleLicense = async (profile: UserProfile) => {
      // Se for usuário fantasma, avisar que precisa criar o perfil primeiro
      if (profile.isGhost) {
          if (confirm("Este usuário não possui perfil completo no banco de dados. Deseja criar um perfil básico para ele agora para poder ativar o Premium?")) {
              setManualId(profile.id);
              setManualEmail(profile.email !== 'Email não registrado' ? profile.email : '');
              setActiveTab('generator'); // Leva para a aba de ferramentas
              alert("Por favor, preencha o e-mail do usuário na aba Ferramentas para finalizar o cadastro.");
          }
          return;
      }

      const newStatus = profile.licenseStatus === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? 'ativar' : 'remover';
      
      if (!window.confirm(`Deseja realmente ${action} a licença Premium para ${profile.name || profile.email}?`)) return;

      try {
          await DBService.updateUserLicense(profile.id, newStatus);
          // Update local state
          setProfiles(prev => prev.map(p => 
              p.id === profile.id ? { ...p, licenseStatus: newStatus } : p
          ));
      } catch (error: any) {
          alert("Erro ao atualizar licença: " + error.message);
      }
  };

  const openMessageModal = (userId: string) => {
      setMsgTargetUser(userId);
      setMsgContent('');
      setMsgModalOpen(true);
  };

  const handleSendMessage = async () => {
      if (!msgContent.trim()) return;

      if (!window.confirm(`Tem certeza que deseja enviar esta mensagem para o usuário?`)) {
        return;
      }

      setSending(true);
      try {
          const msg: AdminMessage = {
              id: generateId(),
              sender: 'Admin',
              receiver: msgTargetUser,
              content: msgContent,
              timestamp: new Date().toISOString(),
              read: false
          };
          await DBService.sendMessage(msg);
          setMsgModalOpen(false);
          alert('Mensagem enviada com sucesso!');
          fetchData(); 
      } catch (error: any) {
          alert('Erro ao enviar mensagem: ' + error.message);
      } finally {
          setSending(false);
      }
  };

  const handleGenerateKey = () => {
      if (!genUserId) return;
      const key = generateLicenseKey(genUserId);
      setGeneratedKey(key);
  };

  const handleManualProfileCreate = async () => {
      if (!manualId || !manualEmail) {
          alert("ID e Email são obrigatórios.");
          return;
      }
      setManualLoading(true);
      try {
          await DBService.createProfileManually(manualId, manualEmail, manualName || 'Usuário Recuperado');
          alert("Perfil criado com sucesso! Agora você pode gerenciar este usuário na aba 'Usuários'.");
          setManualId('');
          setManualEmail('');
          setManualName('');
          fetchData(); // Refresh list
      } catch (error: any) {
          alert("Erro ao criar perfil: " + error.message);
      } finally {
          setManualLoading(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6 relative pb-10">
        {/* Header Area */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Painel Administrativo</h2>
                        <p className="text-slate-500 dark:text-slate-400">Gestão global do sistema Finance Pro 360.</p>
                    </div>
                </div>
                <button 
                    onClick={fetchData} 
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition-colors"
                    title="Atualizar Dados"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                        activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <BarChart3 size={18} /> Visão Geral
                    {activeTab === 'overview' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>

                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                        activeTab === 'users' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <Users size={18} /> Usuários
                    {activeTab === 'users' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>

                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                        activeTab === 'requests' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <FileText size={18} /> Licenças
                    {pendingRequestsCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {pendingRequestsCount}
                        </span>
                    )}
                    {activeTab === 'requests' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>
                
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                        activeTab === 'messages' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <MessageSquare size={18} /> Mensagens
                    {activeTab === 'messages' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>

                <button
                    onClick={() => setActiveTab('generator')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                        activeTab === 'generator' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <Wrench size={18} /> Ferramentas
                    {activeTab === 'generator' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>
            </div>
        </div>

        {/* --- CONTENT AREA --- */}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'overview' && stats && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuários Totais</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{stats.totalUsers}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transações</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{stats.totalTransactions}</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Database size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Volume Movimentado</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{formatCurrency(stats.totalVolume)}</h3>
                        </div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Wallet size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Licenças Ativas</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{stats.activeLicenses}</h3>
                        </div>
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <ShieldAlert size={24} />
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'users' && (
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Usuário</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Licença</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                profiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    {profile.name || 'Sem nome'}
                                                    {profile.isGhost && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded uppercase">Pendente</span>}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{profile.email}</span>
                                                {/* ID escondido em tooltip ou muito discreto */}
                                                <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono mt-0.5 truncate max-w-[150px]" title={profile.id}>ID: {profile.id.substring(0,8)}...</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                             <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                                profile.licenseStatus === 'active' 
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                {profile.licenseStatus === 'active' ? 'Premium' : 'Gratuito'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleToggleLicense(profile)}
                                                    className={`p-2 rounded transition-colors mr-2 ${
                                                        profile.licenseStatus === 'active' 
                                                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800'
                                                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800'
                                                    }`}
                                                    title={profile.licenseStatus === 'active' ? "Remover Premium" : "Ativar Premium"}
                                                >
                                                    {profile.licenseStatus === 'active' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => openMessageModal(profile.id)}
                                                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                    title="Enviar Mensagem"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
        )}

        {/* 3. REQUESTS TAB */}
        {activeTab === 'requests' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Solicitante</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Data</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Status</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                        Nenhuma solicitação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                                                        {req.userName || 'Desconhecido'}
                                                    </span>
                                                    {req.userEmail && <span className="text-xs text-slate-500">{req.userEmail}</span>}
                                                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 mt-0.5" title={req.userId}>
                                                        ID: {req.userId.substring(0,8)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(req.requestDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                                req.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                req.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                            }`}>
                                                {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleStatusChange(req, 'approved')}
                                                            className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                                                            title="Aprovar"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusChange(req, 'rejected')}
                                                            className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors"
                                                            title="Rejeitar"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => openMessageModal(req.userId)}
                                                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                    title="Enviar Mensagem"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* 4. MESSAGES TAB */}
        {activeTab === 'messages' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors">
                <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Para</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Mensagem</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Data</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                        Nenhuma mensagem enviada.
                                    </td>
                                </tr>
                            ) : (
                                messages.map(msg => {
                                    // Tentar encontrar nome do destinatário para exibição bonita
                                    const receiverProfile = profiles.find(p => p.id === msg.receiver);
                                    const receiverName = receiverProfile?.name || 'ID: ' + msg.receiver.substring(0,8)+'...';

                                    return (
                                    <tr key={msg.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 px-6 text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {receiverName}
                                        </td>
                                        <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">{msg.content}</td>
                                        <td className="py-3 px-6 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(msg.timestamp).toLocaleDateString('pt-BR')} {new Date(msg.timestamp).toLocaleTimeString('pt-BR')}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            {msg.read ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                                                    <Eye size={10} /> Lida
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">
                                                    <EyeOff size={10} /> Não lida
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* 5. TOOLS / GENERATOR TAB */}
        {activeTab === 'generator' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                
                {/* Manual Profile Creator (FIX GHOST USERS) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-amber-500" />
                        Reparar Usuário Fantasma
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Use isto se o usuário criou conta mas não aparece na lista (falha de registro no banco).
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ID do Usuário (UUID) *</label>
                            <input 
                                type="text" 
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-500"
                                placeholder="Ex: 8257b1c5-..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email *</label>
                            <input 
                                type="email" 
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                placeholder="email@exemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome (Opcional)</label>
                            <input 
                                type="text" 
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                placeholder="Nome do usuário"
                            />
                        </div>

                        <button 
                            onClick={handleManualProfileCreate}
                            disabled={manualLoading || !manualId || !manualEmail}
                            className="w-full bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {manualLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Criar Perfil na Base
                        </button>
                    </div>
                </div>

                {/* Key Generator */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Smartphone size={20} className="text-blue-500" />
                            Gerar Chave de Licença
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Gera uma chave manual para ativação offline ou via WhatsApp.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ID do Usuário</label>
                                <input 
                                    type="text" 
                                    value={genUserId}
                                    onChange={(e) => setGenUserId(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Cole o ID aqui..."
                                />
                            </div>

                            <button 
                                onClick={handleGenerateKey}
                                disabled={!genUserId}
                                className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Gerar Chave Única
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center transition-colors">
                        {generatedKey ? (
                            <div className="animate-fade-in w-full">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Key size={24} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h4 className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">Chave Gerada!</h4>
                                
                                <div className="bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-3 relative">
                                    <p className="text-xl font-mono font-bold text-slate-800 dark:text-white tracking-widest">{generatedKey}</p>
                                </div>

                                <button 
                                    onClick={() => { navigator.clipboard.writeText(generatedKey); alert('Chave copiada!'); }}
                                    className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline flex items-center justify-center gap-2"
                                >
                                    <Copy size={16} /> Copiar
                                </button>
                            </div>
                        ) : (
                            <div className="text-slate-400 dark:text-slate-600">
                                <Lock size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs">A chave aparecerá aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Message Modal */}
        {msgModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in border border-slate-200 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Enviar Mensagem</h3>
                        <button onClick={() => setMsgModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Para:</label>
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded text-sm font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {msgTargetUser}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Mensagem:</label>
                        <textarea 
                            value={msgContent}
                            onChange={(e) => setMsgContent(e.target.value)}
                            className="w-full h-32 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded p-3 text-sm focus:border-blue-500 outline-none resize-none"
                            placeholder="Escreva sua mensagem aqui..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setMsgModalOpen(false)}
                            disabled={sending}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSendMessage}
                            disabled={sending || !msgContent.trim()}
                            className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                                sending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            } text-white disabled:opacity-50`}
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Enviar Mensagem
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
