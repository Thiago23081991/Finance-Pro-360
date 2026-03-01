import React, { useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, Lock, Loader2 } from 'lucide-react';
import { NativeBiometric } from 'capacitor-native-biometric';

interface BiometricGateProps {
    children: React.ReactNode;
    requireBiometrics: boolean;
}

export const BiometricGate: React.FC<BiometricGateProps> = ({ children, requireBiometrics }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!requireBiometrics);
    const [isChecking, setIsChecking] = useState(requireBiometrics);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!requireBiometrics) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
        }

        performBiometricAuth();
    }, [requireBiometrics]);

    const performBiometricAuth = async () => {
        setIsChecking(true);
        setError(null);
        try {
            const result = await NativeBiometric.isAvailable();

            if (!result.isAvailable) {
                // If not available, we bypass or throw error depending on strictness.
                // For now, let's bypass if device doesn't have it, or user hasn't set it up.
                console.warn('Biometria não disponível no dispositivo.');
                setIsAuthenticated(true);
                return;
            }

            await NativeBiometric.verifyIdentity({
                reason: "Autentique-se para acessar o Finance Pro 360",
                title: "Acesso Seguro",
                subtitle: "Use sua biometria para continuar",
                description: "Precisamos confirmar sua identidade para acessar seus dados financeiros."
            });

            setIsAuthenticated(true);
        } catch (e: any) {
            console.error("Biometric error", e);
            setError("Erro ao solicitar biometria ou cancelado.");
        } finally {
            setIsChecking(false);
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center text-white p-6">
            <div className="w-24 h-24 bg-indigo-600/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                {isChecking ? (
                    <Loader2 size={48} className="text-indigo-400 animate-spin" />
                ) : (
                    <Fingerprint size={48} className="text-indigo-400" />
                )}
            </div>

            <h1 className="text-2xl font-bold mb-2 text-center">App Bloqueado</h1>
            <p className="text-slate-400 text-center mb-8 max-w-xs">
                {isChecking
                    ? "Verificando identidade..."
                    : "Toque abaixo para desbloquear o aplicativo com sua biometria."}
            </p>

            {error && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-2 rounded-lg mb-8">
                    <ShieldAlert size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {!isChecking && (
                <button
                    onClick={performBiometricAuth}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-900/50 active:scale-95"
                >
                    <Lock size={20} />
                    Desbloquear
                </button>
            )}
        </div>
    );
};
