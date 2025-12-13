
import React from 'react';

interface LogoProps {
  className?: string; // Classes para tamanho do container (ex: w-10 h-10)
  showText?: boolean; // Se deve mostrar o texto "FINANCE PRO 360" ao lado
  textClassName?: string; // Classes para cor do texto principal
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-10 h-10", 
  showText = true, 
  textClassName = "text-slate-800 dark:text-white" 
}) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${className} relative flex-shrink-0`}>
        {/* Logo Vetorial Nativo - Elimina necessidade de imagens externas */}
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-md hover:scale-105 transition-transform duration-300">
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FCD34D" /> {/* Amber 300 */}
              <stop offset="50%" stopColor="#F59E0B" /> {/* Amber 500 */}
              <stop offset="100%" stopColor="#B45309" /> {/* Amber 700 */}
            </linearGradient>
            <linearGradient id="shadowGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
               <stop offset="0%" stopColor="#D97706" />
               <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          
          {/* Base do Emblema (Moeda/Círculo) */}
          <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" />
          <circle cx="50" cy="50" r="45" stroke="url(#shadowGradient)" strokeWidth="2" strokeOpacity="0.3" />

          {/* Anel interno sutil representando 360 graus */}
          <path d="M85 50 A 35 35 0 1 1 50 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" fill="none"/>

          {/* Gráfico de Barras Moderno */}
          <rect x="28" y="55" width="12" height="20" rx="3" fill="white" fillOpacity="0.85" />
          <rect x="44" y="40" width="12" height="35" rx="3" fill="white" />
          <rect x="60" y="25" width="12" height="50" rx="3" fill="white" />

          {/* Seta de Tendência de Crescimento (Atravessando e subindo) */}
          <path d="M22 68 Q 45 75, 82 22" stroke="url(#shadowGradient)" strokeWidth="4" strokeLinecap="round" />
          <path d="M82 22 L70 24 L80 34 Z" fill="url(#shadowGradient)" />
        </svg>
      </div>

      {showText && (
         <div className="flex flex-col justify-center">
            <span className={`font-black text-lg leading-none tracking-tight ${textClassName}`}>FINANCE</span>
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold leading-none text-amber-500 uppercase tracking-[0.25em]">PRO</span>
                <span className="text-[10px] font-bold leading-none opacity-60 uppercase tracking-widest" style={{ color: 'inherit' }}>360</span>
            </div>
         </div>
      )}
    </div>
  );
};
