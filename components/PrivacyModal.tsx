
import React from 'react';
import { X, ShieldCheck, Lock, FileText, Database } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-md flex flex-col max-h-[90vh] relative animate-fade-in border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Política de Privacidade e LGPD</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sua segurança e transparência em primeiro lugar.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-6">
            
            <section>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Database size={16} className="text-blue-500" /> 1. Dados Coletados
                </h3>
                <p>
                    Para o funcionamento do <strong>Finance Pro 360</strong>, coletamos apenas os dados estritamente necessários:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                    <li><strong>E-mail:</strong> Utilizado exclusivamente para autenticação (login) e recuperação de senha.</li>
                    <li><strong>Dados Financeiros:</strong> Transações (receitas e despesas), metas e categorias inseridas voluntariamente por você para gerar os relatórios.</li>
                    <li><strong>Preferências:</strong> Configurações de tema (claro/escuro) e personalizações de categorias.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-500" /> 2. Finalidade do Tratamento
                </h3>
                <p>
                    Seus dados são utilizados única e exclusivamente para:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>Fornecer a visualização de dashboards e gráficos financeiros.</li>
                    <li>Armazenar seu histórico financeiro de forma segura na nuvem (Supabase).</li>
                    <li>Permitir o backup e exportação das suas informações.</li>
                </ul>
                <p className="mt-2 font-semibold text-rose-500">
                    Nós NÃO vendemos, compartilhamos ou utilizamos seus dados financeiros para publicidade.
                </p>
            </section>

            <section>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-500" /> 3. Seus Direitos (LGPD)
                </h3>
                <p>
                    Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                    <li><strong>Acesso:</strong> Visualizar todos os dados que temos sobre você (disponível no Dashboard e Exportação).</li>
                    <li><strong>Portabilidade:</strong> Baixar seus dados em formato .CSV ou .JSON a qualquer momento (Menu Configurações).</li>
                    <li><strong>Exclusão (Direito ao Esquecimento):</strong> Solicitar a exclusão completa da sua conta e dados (Menu Configurações {'>'} Segurança).</li>
                </ul>
            </section>

            <section>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">4. Armazenamento e Segurança</h3>
                <p>
                    Seus dados são armazenados em servidores seguros fornecidos pelo <strong>Supabase</strong>, utilizando criptografia em trânsito (HTTPS/SSL) e em repouso. Embora utilizemos as melhores práticas de segurança, nenhum sistema é 100% imune a ataques cibernéticos.
                </p>
            </section>

             <section>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">5. Alterações nesta Política</h3>
                <p>
                    Reservamo-nos o direito de atualizar esta política. Notificaremos sobre mudanças significativas através do próprio aplicativo.
                </p>
            </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end">
            <button 
                onClick={onClose}
                className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
            >
                Entendi
            </button>
        </div>
      </div>
    </div>
  );
};
