
import React, { useEffect, useState } from 'react';
import { AdminMessage } from '../types';
import { DBService } from '../db';
import { X, Mail, MailOpen, Clock, Trash2 } from 'lucide-react';

interface InboxProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnread: () => void;
}

export const Inbox: React.FC<InboxProps> = ({ userId, isOpen, onClose, onUpdateUnread }) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  const loadMessages = async () => {
    const msgs = await DBService.getMessagesForUser(userId);
    setMessages(msgs);
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, userId]);

  const handleSelectMessage = async (msg: AdminMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await DBService.markMessageAsRead(msg.id);
      // Update local state to reflect read status immediately
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      onUpdateUnread();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Mail className="text-blue-600" />
            Caixa de Entrada
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-6">
              <button 
                onClick={() => setSelectedMessage(null)}
                className="self-start mb-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                ← Voltar para lista
              </button>
              
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                   <div>
                       <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">De</span>
                       <p className="font-bold text-slate-800">{selectedMessage.sender}</p>
                   </div>
                   <div className="text-right">
                       <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</span>
                       <p className="text-sm text-slate-600">
                           {new Date(selectedMessage.timestamp).toLocaleDateString('pt-BR')}
                           <br/>
                           {new Date(selectedMessage.timestamp).toLocaleTimeString('pt-BR')}
                       </p>
                   </div>
                </div>
                
                <div className="prose prose-slate text-slate-700 whitespace-pre-wrap">
                    {selectedMessage.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MailOpen size={48} className="mb-4 opacity-50" />
                  <p>Nenhuma mensagem recebida.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {messages.map(msg => (
                    <li key={msg.id}>
                      <button 
                        onClick={() => handleSelectMessage(msg)}
                        className={`w-full text-left p-4 rounded-lg transition-all border flex gap-3 ${
                          msg.read 
                            ? 'bg-white border-transparent hover:bg-slate-50' 
                            : 'bg-blue-50 border-blue-100 hover:bg-blue-100/50 shadow-sm'
                        }`}
                      >
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${msg.read ? 'bg-transparent' : 'bg-blue-600'}`}></div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm ${msg.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                              {msg.sender}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                               <Clock size={10} />
                               {new Date(msg.timestamp).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {msg.content}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
