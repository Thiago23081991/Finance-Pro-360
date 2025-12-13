
import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Lock, Crown, CheckCircle, PlayCircle, BookOpen, Clock, BarChart, ArrowLeft, Star, MonitorPlay } from 'lucide-react';

interface CoursesProps {
    config: AppConfig;
    onNavigateToSettings: () => void;
}

// Mock Data for Courses
const COURSES = [
    {
        id: 1,
        title: "Domine suas Finanças",
        description: "O guia definitivo para sair das dívidas e organizar seu orçamento mensal.",
        duration: "4h 30m",
        level: "Iniciante",
        modules: 12,
        color: "bg-emerald-500",
        thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560eb3e?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: 2,
        title: "Investindo do Zero",
        description: "Aprenda a fazer seu dinheiro trabalhar por você. Renda fixa, CDBs e Tesouro.",
        duration: "6h 15m",
        level: "Intermediário",
        modules: 18,
        color: "bg-blue-500",
        thumbnail: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: 3,
        title: "Mestre da Renda Variável",
        description: "Estratégias avançadas para investir em Ações e Fundos Imobiliários (FIIs).",
        duration: "8h 00m",
        level: "Avançado",
        modules: 24,
        color: "bg-purple-500",
        thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: 4,
        title: "Planejamento de Aposentadoria",
        description: "Como garantir um futuro tranquilo utilizando o poder dos juros compostos.",
        duration: "3h 45m",
        level: "Todos",
        modules: 8,
        color: "bg-amber-500",
        thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=600"
    }
];

export const Courses: React.FC<CoursesProps> = ({ config, onNavigateToSettings }) => {
    const isPremium = config.licenseStatus === 'active';
    const [activeCourse, setActiveCourse] = useState<typeof COURSES[0] | null>(null);

    // --- PREMIUM LOCK SCREEN ---
    if (!isPremium) {
        return (
            <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                <div className="text-center max-w-lg z-10 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-amber-600 dark:text-amber-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-center gap-2">
                        Finance Academy <Crown size={24} className="text-amber-500" />
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Desbloqueie nossa plataforma de <strong>Educação Financeira</strong> exclusiva para membros Premium.
                    </p>
                    <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Cursos Completos:</strong> Do básico ao avançado em investimentos.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Material Prático:</strong> Planilhas e templates exclusivos.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <span><strong>Certificado:</strong> Certificado de conclusão para cada curso.</span>
                        </li>
                    </ul>
                    <button 
                        onClick={onNavigateToSettings}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105"
                    >
                        Desbloquear Academy
                    </button>
                </div>
            </div>
        );
    }

    // --- COURSE PLAYER VIEW ---
    if (activeCourse) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
                    <button 
                        onClick={() => setActiveCourse(null)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{activeCourse.title}</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Módulo 1: Introdução</span>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Video Area */}
                    <div className="flex-1 bg-black flex flex-col items-center justify-center relative group p-6 lg:p-0">
                         {/* Placeholder for Video */}
                         <div className="absolute inset-0 bg-slate-900 opacity-50"></div>
                         <div className="z-10 text-center">
                             <MonitorPlay size={64} className="text-white opacity-80 mb-4 mx-auto" />
                             <h3 className="text-white font-bold text-xl mb-2">Aula 01: O Início da Jornada</h3>
                             <p className="text-slate-300 text-sm">Clique para iniciar a reprodução</p>
                             <button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2 mx-auto">
                                <PlayCircle size={20} /> Assistir Aula
                             </button>
                         </div>
                    </div>

                    {/* Sidebar / Playlist */}
                    <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">Conteúdo do Curso</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><BookOpen size={12}/> {activeCourse.modules} Aulas</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock size={12}/> {activeCourse.duration}</span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <button key={i} className="w-full p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-start gap-3 group">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                                        {i === 1 ? <PlayCircle size={14} /> : i}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${i === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {i === 1 ? 'Introdução ao Tema' : `Módulo ${i}: Conceitos Práticos`}
                                        </p>
                                        <span className="text-xs text-slate-400">15 min</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- COURSES GRID VIEW ---
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Finance Academy (Em Construção)</h2>
                    <p className="text-blue-100 max-w-xl">
                        Aprimore seus conhecimentos financeiros com cursos exclusivos. Da organização básica aos investimentos avançados.
                    </p>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {COURSES.map(course => (
                    <div key={course.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group flex flex-col">
                        <div className="h-40 overflow-hidden relative">
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-3 left-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase text-white ${course.color}`}>
                                    {course.level}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{course.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                            
                            <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                                <span className="flex items-center gap-1"><BookOpen size={14}/> {course.modules} Aulas</span>
                                <span className="flex items-center gap-1"><Clock size={14}/> {course.duration}</span>
                            </div>

                            <button 
                                onClick={() => setActiveCourse(course)}
                                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <PlayCircle size={18} />
                                Começar Agora
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
