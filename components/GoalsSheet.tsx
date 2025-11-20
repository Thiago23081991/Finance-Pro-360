import React, { useState } from 'react';
import { Goal } from '../types';
import { formatCurrency, formatPercent, generateId, getStatusColor } from '../utils';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface GoalsSheetProps {
  goals: Goal[];
  onAdd: (g: Goal) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, val: number) => void; // Simplified update for current val
}

export const GoalsSheet: React.FC<GoalsSheetProps> = ({ goals, onAdd, onDelete, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');

    const handleSave = () => {
        if(!name || !target) return;
        const targetVal = parseFloat(target);
        const currentVal = parseFloat(current) || 0;

        const newGoal: Goal = {
            id: generateId(),
            userId: 'temp', // Placeholder, handled by App controller
            name,
            targetValue: targetVal,
            currentValue: currentVal,
            status: currentVal >= targetVal ? 'Concluída' : 'Em andamento'
        };
        onAdd(newGoal);
        setName('');
        setTarget('');
        setCurrent('');
        setIsAdding(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="font-semibold text-slate-700">Metas Financeiras</h2>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    Nova Meta
                </button>
            </div>

            {/* Add Row */}
            {isAdding && (
                 <div className="p-4 bg-blue-50 border-b border-blue-100 grid grid-cols-12 gap-3 items-end animate-fade-in">
                    <div className="col-span-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nome da Meta</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Valor Alvo</label>
                        <input type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Valor Atual</label>
                        <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" />
                    </div>
                    <div className="col-span-2 flex gap-2">
                         <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"><Save size={16} /></button>
                         <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"><X size={16} /></button>
                    </div>
                 </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Nome da Meta</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Valor Alvo</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Valor Atual</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">% Concluído</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {goals.map(g => {
                             const percent = (g.currentValue / g.targetValue) * 100;
                             const status = percent >= 100 ? 'Concluída' : 'Em andamento';
                             return (
                                 <tr key={g.id} className="hover:bg-slate-50 transition-colors group">
                                     <td className="py-3 px-6 text-sm font-medium text-slate-700">{g.name}</td>
                                     <td className="py-3 px-6 text-sm text-slate-600 font-mono">{formatCurrency(g.targetValue)}</td>
                                     <td className="py-3 px-6 text-sm text-slate-600 font-mono">
                                         {/* Editable cell simplified */}
                                         <input 
                                            type="number" 
                                            className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-24 text-right"
                                            value={g.currentValue}
                                            onChange={(e) => onUpdate(g.id, parseFloat(e.target.value))}
                                         />
                                     </td>
                                     <td className="py-3 px-6 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-right">{formatPercent(percent)}</span>
                                            <div className="w-24 bg-slate-200 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${Math.min(percent, 100)}%`}}></div>
                                            </div>
                                        </div>
                                     </td>
                                     <td className="py-3 px-6 text-sm">
                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                             {status}
                                         </span>
                                     </td>
                                     <td className="py-3 px-6 text-center">
                                        <button 
                                            onClick={() => onDelete(g.id)}
                                            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                     </td>
                                 </tr>
                             );
                         })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};