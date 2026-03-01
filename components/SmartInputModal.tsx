import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, ArrowRight, Loader2, AlertCircle, Mic, Camera as CameraIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GeminiService } from '../services/GeminiService';
import { Transaction } from '../types';

interface SmartInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Partial<Transaction>) => void;
    categories: string[];
}

export const SmartInputModal: React.FC<SmartInputModalProps> = ({ isOpen, onClose, onSave, categories }) => {
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [parsedData, setParsedData] = useState<Partial<Transaction> | null>(null);
    const [error, setError] = useState('');

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognition.start();
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        setIsProcessing(true);
        setError('');

        try {
            const result = await GeminiService.parseTransaction(inputText);
            setParsedData(result);
        } catch (err) {
            console.error(err);
            setError('Não foi possível entender o texto. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCamera = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 60,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera
            });

            if (image.base64String) {
                setIsProcessing(true);
                setError('');
                const result = await GeminiService.analyzeReceipt(image.base64String);
                setParsedData(result);
            }
        } catch (error: any) {
            console.error(error);
            if (error.message !== 'User cancelled photos app') {
                setError('Erro ao capturar imagem ou IA indisponível.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        if (parsedData) {
            onSave(parsedData);
            handleReset();
            onClose();
        }
    };

    const handleReset = () => {
        setInputText('');
        setParsedData(null);
        setError('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-md w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black flex items-center gap-2">
                                        <Sparkles className="text-yellow-300" />
                                        Smart Input
                                    </h2>
                                    <p className="text-violet-100 text-sm mt-1">Cole mensagens do banco ou textos como "Gastei 50 no almoço".</p>
                                </div>
                                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {!parsedData ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Digite ou fale: 'Mercado 200 reais'..."
                                            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 focus:border-violet-500 focus:ring-0 outline-none resize-none text-lg transition-colors"
                                            autoFocus
                                        />
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button
                                                onClick={handleCamera}
                                                className="p-3 bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-600 rounded-full shadow-md transition-all"
                                                title="Tirar foto de Recibo/Boleto"
                                            >
                                                <CameraIcon size={20} />
                                            </button>
                                            <button
                                                onClick={startListening}
                                                className={`p-3 rounded-full shadow-md transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-violet-600'}`}
                                                title="Falar"
                                            >
                                                <Mic size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                                            <AlertCircle size={16} /> {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!inputText.trim() || isProcessing}
                                        className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-violet-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        {isProcessing ? 'Analisando...' : 'Analisar com IA'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl">
                                        <div className="text-center mb-4">
                                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 mx-auto rounded-full flex items-center justify-center mb-2">
                                                <Check size={24} />
                                            </div>
                                            <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Entendi! Confere se está certo?</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Valor</label>
                                                <input
                                                    type="number"
                                                    value={parsedData.amount}
                                                    onChange={e => setParsedData({ ...parsedData, amount: parseFloat(e.target.value) })}
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded font-mono font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                                <input
                                                    type="date"
                                                    value={parsedData.date}
                                                    onChange={e => setParsedData({ ...parsedData, date: e.target.value })}
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                                                <input
                                                    type="text"
                                                    value={parsedData.description}
                                                    onChange={e => setParsedData({ ...parsedData, description: e.target.value })}
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                                                <select
                                                    value={parsedData.category}
                                                    onChange={e => setParsedData({ ...parsedData, category: e.target.value })}
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded"
                                                >
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleReset}
                                            className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                        >
                                            Tentar Outro
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            Confirmar <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
