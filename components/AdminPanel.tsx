
import React, { useState, useEffect } from 'react';
import { PurchaseRequest, AdminMessage } from '../types';
import { DBService } from '../db';
import { Check, X, ShieldAlert, User, MessageSquare, Send, FileText, Mail, Eye, EyeOff, LayoutList, RefreshCw } from 'lucide-react';
import { generateId } from '../utils';

type AdminTab = 'requests' | 'messages';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Message Modal State
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [msgTargetUser, setMsgTargetUser] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (activeTab === 'requests') {
            const data = await DBService.getAllPurchaseRequests();
            // Ordenar: Pendentes primeiro, depois por data mais recente
            const sorted = data.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
            });
            setRequests(sorted);
        } else {
            const data = await DBService.getAllMessages();
            setMessages(data);
        }
    } catch (error) {
        console.error("Error loading admin data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleStatusChange = async (req: PurchaseRequest, newStatus: 'approved' | 'rejected') => {
    const updated: PurchaseRequest = { ...req, status: newStatus };
    await DBService.savePurchaseRequest(updated);
    setRequests(prev => prev.map(r => r.userId === req.userId ? updated : r));
  };

  const openMessageModal = (userId: string) => {
      setMsgTargetUser(userId);
      setMsgContent('');
      setMsgModalOpen(true);
  };

  const handleSendMessage = async () => {
      if (!msgContent.trim()) return;
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
          
          // If we are on messages tab, refresh
          if (activeTab === 'messages') {
              fetchData();
          }
      } catch (error) {
          alert('Erro ao enviar mensagem.');
      } finally {
          setSending(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6 relative">
        {/* Header Area */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Painel Administrativo</h2>
                        <p className="text-slate-500">Gerencie o sistema e comunicação.</p>
                    </div>
                </div>
                <button 
                    onClick={fetchData} 
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    title="Atualizar Dados"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        activeTab === 'requests' 
                        ? 'text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <FileText size={18} />
                    Solicitações de Compra
                    {activeTab === 'requests' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        activeTab === 'messages' 
                        ? 'text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MessageSquare size={18} />
                    Histórico de Mensagens
                    {activeTab === 'messages' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                    )}
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            {loading ? (
                <div className="flex justify-center items-center h-64 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                    Carregando dados...
                </div>
            ) : (
                <>
                    {activeTab === 'requests' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Usuário</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Data da Solicitação</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status Atual</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400">
                                                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                                Nenhuma solicitação encontrada.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map(req => (
                                            <tr key={req.userId} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={16} className="text-slate-400" />
                                                        <span className="font-medium text-slate-700">{req.userId}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    {new Date(req.requestDate).toLocaleDateString('pt-BR')} às {new Date(req.requestDate).toLocaleTimeString('pt-BR')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        {req.status === 'approved' ? 'Aprovado' : 
                                                        req.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => openMessageModal(req.userId)}
                                                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                                            title="Enviar Mensagem"
                                                        >
                                                            <MessageSquare size={16} />
                                                        </button>

                                                        {/* Se não estiver Aprovado, mostrar botão Aprovar */}
                                                        {req.status !== 'approved' && (
                                                            <button 
                                                                onClick={() => handleStatusChange(req, 'approved')}
                                                                className="p-2 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"
                                                                title="Aprovar"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        )}

                                                        {/* Se não estiver Rejeitado, mostrar botão Rejeitar */}
                                                        {req.status !== 'rejected' && (
                                                            <button 
                                                                onClick={() => handleStatusChange(req, 'rejected')}
                                                                className="p-2 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"
                                                                title="Rejeitar"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="overflow-x-auto">
                             <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-48">Data/Hora</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-48">Destinatário</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Conteúdo</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-24 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {messages.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400">
                                                <Mail size={48} className="mx-auto mb-3 opacity-20" />
                                                Nenhuma mensagem enviada.
                                            </td>
                                        </tr>
                                    ) : (
                                        messages.map(msg => (
                                            <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    {new Date(msg.timestamp).toLocaleDateString('pt-BR')} <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString('pt-BR')}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-slate-400" />
                                                        <span className="font-medium text-slate-700 text-sm">{msg.receiver}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    <div className="truncate max-w-md" title={msg.content}>
                                                        {msg.content}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {msg.read ? (
                                                        <div className="flex flex-col items-center text-emerald-500" title="Lida">
                                                            <Eye size={18} />
                                                            <span className="text-[10px] font-semibold">Lida</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-slate-400" title="Não lida">
                                                            <EyeOff size={18} />
                                                            <span className="text-[10px]">Enviada</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Modal de Envio de Mensagem */}
        {msgModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMsgModalOpen(false)}></div>
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative z-10 animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-600" />
                        Enviar Mensagem
                    </h3>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Para:</label>
                        <input 
                            type="text" 
                            value={msgTargetUser} 
                            disabled 
                            className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-slate-600"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex justify-between">
                            <span>Mensagem:</span>
                            <span className={`normal-case font-normal ${msgContent.length >= 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {msgContent.length}/500
                            </span>
                        </label>
                        <textarea 
                            value={msgContent}
                            onChange={(e) => setMsgContent(e.target.value.slice(0, 500))}
                            maxLength={500}
                            className={`w-full border rounded-lg px-3 py-2 h-32 focus:ring-2 outline-none resize-none text-sm transition-colors ${
                                msgContent.length >= 500 
                                ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500 bg-rose-50' 
                                : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="Escreva a mensagem para o usuário aqui (limite de 500 caracteres)..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">
                            O usuário receberá uma notificação na Caixa de Entrada.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setMsgModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSendMessage}
                            disabled={!msgContent.trim() || sending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {sending ? 'Enviando...' : 'Enviar'} <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
