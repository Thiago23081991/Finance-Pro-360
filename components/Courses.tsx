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

    if (config.planType !== 'premium') {
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
                    <div key={module.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
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
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm transition-colors"
                                >
                                    Fechar Aula
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                <div
                                    className={`w-full md:w-64 h-36 ${module.thumbnail} rounded-xl flex items-center justify-center shrink-0 relative group cursor-pointer`}
                                    onClick={() => setActiveModule(module.id)}
                                >
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                        <Play fill="currentColor" size={20} className="ml-1" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                                        {module.duration}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Módulo {module.id}</span>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-1">{module.title}</h3>
                                        </div>
                                        {/* Future implementation: Check if watched */}
                                        {/* <CheckCircle className="text-slate-300 dark:text-slate-700" size={20} /> */}
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        {module.description}
                                    </p>

                                    <button
                                        onClick={() => setActiveModule(module.id)}
                                        className="inline-flex items-center gap-2 text-brand-blue dark:text-brand-gold font-bold text-sm hover:underline"
                                    >
                                        <Play size={14} />
                                        Assistir Agora
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white text-center md:text-left">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                            <Lock size={20} className="text-slate-400" />
                            Módulo 3: Investimentos no Exterior
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
