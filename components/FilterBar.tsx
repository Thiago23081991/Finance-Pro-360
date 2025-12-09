
import React from 'react';
import { FilterState, Tab, AppConfig } from '../types';
import { MONTH_NAMES } from '../constants';
import { Filter } from 'lucide-react';

interface FilterBarProps {
    filter: FilterState;
    setFilter: (f: FilterState) => void;
    activeTab: Tab;
    config: AppConfig;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filter, setFilter, activeTab, config }) => (
    <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 shadow-sm transition-colors">
            <Filter size={14} className="text-slate-400 dark:text-slate-500 mr-2"/>
            <select 
              value={filter.month} 
              onChange={e => setFilter({...filter, month: parseInt(e.target.value)})}
              className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
                {MONTH_NAMES.map((m, i) => <option key={i} value={i} className="dark:bg-slate-800">{m}</option>)}
            </select>
            <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
            <select 
              value={filter.year} 
              onChange={e => setFilter({...filter, year: parseInt(e.target.value)})}
              className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y} className="dark:bg-slate-800">{y}</option>)}
            </select>
        </div>
        
        {activeTab === 'controle' && (
          <>
              <select 
                  value={filter.category} 
                  onChange={e => setFilter({...filter, category: e.target.value})}
                  className="bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 text-sm cursor-pointer hidden md:block transition-colors"
              >
                  <option value="Todas" className="dark:bg-slate-800">Todas Categorias</option>
                  {config.categories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
              </select>
               <select 
                  value={filter.paymentMethod} 
                  onChange={e => setFilter({...filter, paymentMethod: e.target.value})}
                  className="bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 text-sm cursor-pointer hidden md:block transition-colors"
              >
                  <option value="Todas" className="dark:bg-slate-800">Todos Pagamentos</option>
                  {config.paymentMethods.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
              </select>
          </>
        )}
    </div>
);
