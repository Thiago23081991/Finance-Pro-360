import React from 'react';

interface LogoProps {
  className?: string; // Classes para tamanho do container (ex: w-10 h-10)
  showText?: boolean; // Se deve mostrar o texto "FINANCE PRO 360" ao lado
  textClassName?: string; // Classes para cor do texto principal
}

export const Logo: React.FC<LogoProps> = ({
  className = "h-10 w-auto",
  showText = true,
  textClassName = "text-slate-800 dark:text-white"
}) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${className} relative flex-shrink-0 flex items-center justify-center`}>
        <img
          src="/logo.png"
          alt="Finance Pro 360 Logo"
          className="h-full w-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback visual caso a imagem não seja encontrada na pasta public
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-black text-lg leading-none tracking-tight ${textClassName}`}>FINANCE</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold leading-none text-brand-gold uppercase tracking-[0.25em]">PRO</span>
            <span className="text-[10px] font-bold leading-none opacity-60 uppercase tracking-widest" style={{ color: 'inherit' }}>360</span>
          </div>
        </div>
      )}
    </div>
  );
};

