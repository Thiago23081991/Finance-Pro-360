
import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface LogoProps {
  className?: string; // Classes para tamanho da imagem (ex: w-8 h-8)
  showText?: boolean; // Se deve mostrar o texto "FINANCE PRO 360" ao lado
  textClassName?: string; // Classes para cor do texto
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-10 h-10", 
  showText = true, 
  textClassName = "text-slate-800 dark:text-white" 
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-3 select-none">
      {!imgError ? (
        <img 
          src="/logo.png" 
          alt="Finance Pro 360" 
          className={`${className} object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        // Fallback: Ícone moderno caso a imagem não exista
        <div className={`${className} bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20`}>
          <TrendingUp size="50%" />
        </div>
      )}

      {showText && (
         <div className="flex flex-col justify-center">
            <span className={`font-black text-lg leading-none tracking-tight ${textClassName}`}>FINANCE</span>
            <span className="text-[10px] font-bold leading-none text-emerald-500 uppercase tracking-[0.25em]">PRO 360</span>
         </div>
      )}
    </div>
  );
};
