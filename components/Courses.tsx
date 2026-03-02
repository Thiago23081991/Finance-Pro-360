import React, { useState } from 'react';
import { Play, Lock, Clock, CheckCircle, GraduationCap } from 'lucide-react';
import { AppConfig } from '../types';
import { PremiumLock } from './PremiumLock';

interface CoursesProps {
    config: AppConfig;
    onNavigateToSettings: () => void;
    userEmail?: string;
}

export const Courses: React.FC<CoursesProps> = ({ config, userEmail }) => {
    const [activeModule, setActiveModule] = useState<number | null>(null);

    // Check if license is active (covers premium, annual, semiannual)
    if (config.licenseStatus !== 'active') {
        return <PremiumLock config={config} userEmail={userEmail} userId={config.userId} />;
    }

    const modules = [
        {
            id: 1,
            title: "Módulo 1: Mentalidade De Riqueza",
            description: "Aprenda a mentalidade correta e os pilares para construir um patrimônio sólido.",
            duration: "07:39",
            videoUrl: "/videos/Modulo1.mp4",
            thumbnail: "bg-emerald-900"
        },
        {
            id: 2,
            title: "Módulo 2: Finanças Sem Medo",
            description: "Como multiplicar seu dinheiro com segurança e rentabilidade acima da inflação.",
            duration: "06:17",
            videoUrl: "/videos/Modulo2.mp4",
            thumbnail: "bg-blue-900"
        },
        {
            id: 3,
            title: "Módulo 3: Colocando Minhas Finanças Em Ordem",
            description: "O guia definitivo para organizar sua vida financeira do zero e retomar o controle.",
            duration: "12:00",
            videoUrl: "/videos/Colocando_as_Finanças_em_Ordem.mp4",
            thumbnail: "bg-purple-900"
        }
    ];

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <GraduationCap className="text-brand-gold" />
                        Finance Academy
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Domine suas finanças com nossas aulas exclusivas.</p>
                </div>
            </header>

            <div className="grid gap-6">
                {modules.map((module) => (
                    <div key={module.id} className="group relative bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 transform hover:-translate-y-1">
                        {activeModule === module.id ? (
                            <div className="aspect-video bg-black relative">
                                <video
                                    src={module.videoUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                >
                                    Seu navegador não suporta vídeos HTML5.
                                </video>
                                <button
                                    onClick={() => setActiveModule(null)}
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md transition-colors border border-white/20"
                                >
                                    Fechar Aula
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row cursor-pointer h-full" onClick={() => setActiveModule(module.id)}>
                                <div className={`w-full md:w-80 h-48 md:h-auto ${module.thumbnail} relative overflow-hidden shrink-0`}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center transform group-hover:scale-110 shadow-xl transition-all duration-300">
                                            <Play fill="currentColor" size={28} className="translate-x-0.5" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider">
                                        {module.duration}
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-white dark:bg-slate-800/50">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-[10px] font-black tracking-widest text-brand-gold uppercase bg-brand-gold/10 px-2 py-1 rounded shadow-sm border border-brand-gold/20">Módulo {module.id}</span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-brand-blue dark:group-hover:text-brand-gold transition-colors tracking-tight">{module.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-6">
                                        {module.description}
                                    </p>
                                    <div className="mt-auto">
                                        <span className="inline-flex items-center gap-2 bg-slate-50 group-hover:bg-brand-blue text-slate-700 group-hover:text-white dark:bg-slate-900/50 dark:group-hover:bg-brand-gold dark:text-slate-300 dark:group-hover:text-slate-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 group-hover:border-transparent">
                                            <Play size={16} /> Assistir Aula
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white text-center md:text-left">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                            <Lock size={20} className="text-slate-400" />
                            Módulo 4: Investimentos no Exterior
                        </h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            Este módulo está em produção e será liberado em breve para todos os assinantes Premium.
                        </p>
                    </div>
                    <button disabled className="bg-slate-700 text-slate-400 px-6 py-3 rounded-xl font-bold cursor-not-allowed opacity-70">
                        Em Breve
                    </button>
                </div>
            </div>
        </div>
    );
};
