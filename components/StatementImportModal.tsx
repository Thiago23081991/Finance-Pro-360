import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, X, AlertCircle, Loader2, ArrowRight, Save } from 'lucide-react';
import { Transaction, AppConfig } from '../types';
import { generateId, formatCurrency } from '../utils';

interface StatementImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (transactions: Transaction[]) => Promise<void>;
    config: AppConfig;
}

interface ImportedTransaction {
    id: string; // Temporário
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    selected: boolean;
}

export const StatementImportModal: React.FC<StatementImportModalProps> = ({ isOpen, onClose, onImport, config }) => {
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [importedData, setImportedData] = useState<ImportedTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const parseOFX = (content: string): ImportedTransaction[] => {
        const transactions: ImportedTransaction[] = [];
        const transRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
        let match;

        while ((match = transRegex.exec(content)) !== null) {
            const block = match[1];
            const amountMatch = block.match(/<TRNAMT>([-0-9.]+)/);
            const dateMatch = block.match(/<DTPOSTED>([0-9]+)/);
            const memoMatch = block.match(/<MEMO>(.*)/);

            if (amountMatch && dateMatch && memoMatch) {
                const amount = parseFloat(amountMatch[1]);
                const dateStr = dateMatch[1].substring(0, 8); // YYYYMMDD
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);

                transactions.push({
                    id: generateId(),
                    date: `${year}-${month}-${day}`,
                    description: memoMatch[1].trim(),
                    amount: Math.abs(amount),
                    type: amount < 0 ? 'expense' : 'income',
                    category: amount < 0 ? 'Outros' : 'Outra Receita', // Categoria padrão inicial
                    selected: true
                });
            }
        }
        return transactions;
    };

    const parseCSV = (content: string): ImportedTransaction[] => {
        // Implementação básica de CSV (Data, Descrição, Valor)
        // Assumindo formato simples ou tentando inferir
        const lines = content.split(/\r?\n/);
        const transactions: ImportedTransaction[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || i === 0) continue; // Pular header simples

            // Tenta detectar separador (; ou ,)
            const parts = line.includes(';') ? line.split(';') : line.split(',');

            // Heurística básica: tenta achar data e valor
            // Geralmente: Data, Descricao, Valor OU Data, Valor, Descricao
            if (parts.length >= 3) {
                // Tentar identificar colunas (simplificado)
                const date = parts[0];
                const desc = parts[1];
                const valueStr = parts[parts.length - 1]; // Valor geralmente é o último ou penúltimo

                // Limpeza básica de valor
                const cleanValue = valueStr.replace(/[R$\s]/g, '').replace(',', '.');
                const amount = parseFloat(cleanValue);

                if (!isNaN(amount)) {
                    transactions.push({
                        id: generateId(),
                        date: new Date().toISOString().split('T')[0], // Fallback se data falhar parse, idealmente parsear 'date'
                        description: desc,
                        amount: Math.abs(amount),
                        type: amount < 0 ? 'expense' : 'income',
                        category: amount < 0 ? 'Outros' : 'Outra Receita',
                        selected: true
                    });
                }
            }
        }
        return transactions;
    };

    const handleProcessFile = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            const text = await file.text();
            let parsed: ImportedTransaction[] = [];

            if (file.name.toLowerCase().endsWith('.ofx')) {
                parsed = parseOFX(text);
            } else if (file.name.toLowerCase().endsWith('.csv')) {
                parsed = parseCSV(text);
            } else {
                throw new Error("Formato não suportado. Use .OFX ou .CSV");
            }

            if (parsed.length === 0) throw new Error("Nenhuma transação encontrada no arquivo.");

            setImportedData(parsed);
            setStep('preview');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const toImport = importedData.filter(t => t.selected);
        if (toImport.length === 0) {
            setError("Selecione pelo menos uma transação.");
            return;
        }

        setLoading(true); // Reutilizando estado de loading
        // Converter para Transaction real
        const finalTransactions: Transaction[] = toImport.map(t => ({
            id: generateId(), // Novo ID pra garantir
            userId: '', // Será preenchido pelo App ou DBService
            type: t.type,
            amount: t.amount,
            category: t.category,
            date: t.date,
            description: t.description,
            paymentMethod: 'Débito', // Default
            status: 'completed'
        }));

        try {
            await onImport(finalTransactions);
            onClose();
            // Resetar
            setStep('upload');
            setFile(null);
            setImportedData([]);
        } catch (e: any) {
            setError("Erro ao salvar: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md w-full max-w-3xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Importar Extrato</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Suporta arquivos OFX e CSV</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {step === 'upload' ? (
                        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".ofx,.csv"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <div className="text-center">
                                    <FileText size={48} className="mx-auto text-blue-500 mb-4" />
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{file.name}</p>
                                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                    <button
                                        className="mt-4 text-sm text-rose-500 font-bold hover:underline"
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    >
                                        Remover arquivo
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                    <p className="text-lg font-bold text-slate-600 dark:text-slate-300">Clique para selecionar</p>
                                    <p className="text-sm text-slate-400 mt-1">ou arraste seu arquivo aqui</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300">Pré-visualização ({importedData.length} transações)</h3>
                                <div className="text-xs text-slate-500">Verifique e categorise antes de salvar.</div>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                                        <tr>
                                            <th className="p-3 w-10 text-center"><input type="checkbox" checked={importedData.every(t => t.selected)} onChange={(e) => setImportedData(prev => prev.map(t => ({ ...t, selected: e.target.checked })))} /></th>
                                            <th className="p-3">Data</th>
                                            <th className="p-3">Descrição</th>
                                            <th className="p-3">Categoria</th>
                                            <th className="p-3 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                        {importedData.map((t, idx) => (
                                            <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!t.selected ? 'opacity-50' : ''}`}>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={t.selected}
                                                        onChange={() => setImportedData(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item))}
                                                    />
                                                </td>
                                                <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{t.description}</td>
                                                <td className="p-3">
                                                    <select
                                                        value={t.category}
                                                        onChange={(e) => setImportedData(prev => prev.map((item, i) => i === idx ? { ...item, category: e.target.value } : item))}
                                                        className="bg-slate-50 dark:bg-slate-800 border-none rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {(t.type === 'income' ? config.incomeCategories : config.expenseCategories).map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className={`p-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount, config.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm rounded-lg flex items-center gap-2 animate-shake">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                    {step === 'upload' ? (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleProcessFile}
                                disabled={!file || loading}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                Processar Arquivo
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep('upload')} className="px-5 py-2.5 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">
                                Voltar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || importedData.filter(t => t.selected).length === 0}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Importar {importedData.filter(t => t.selected).length} Transações
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
