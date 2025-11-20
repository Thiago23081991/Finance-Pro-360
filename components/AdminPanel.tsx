
import React, { useState, useEffect } from 'react';
import { PurchaseRequest } from '../types';
import { DBService } from '../db';
import { Check, X, ShieldAlert, User } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
        const data = await DBService.getAllPurchaseRequests();
        setRequests(data);
    } catch (error) {
        console.error("Error loading requests", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (req: PurchaseRequest, newStatus: 'approved' | 'rejected') => {
    const updated: PurchaseRequest = { ...req, status: newStatus };
    await DBService.savePurchaseRequest(updated);
    
    // Update local state
    setRequests(prev => prev.map(r => r.userId === req.userId ? updated : r));
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Painel Administrativo</h2>
                    <p className="text-slate-500">Gerencie solicitações de licença e usuários.</p>
                </div>
            </div>

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
                                <td colSpan={4} className="py-8 text-center text-slate-400">
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
                                            {req.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusChange(req, 'approved')}
                                                        className="p-2 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"
                                                        title="Aprovar"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(req, 'rejected')}
                                                        className="p-2 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"
                                                        title="Rejeitar"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {req.status !== 'pending' && (
                                                <span className="text-xs text-slate-400 italic">Processado</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
