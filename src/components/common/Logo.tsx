import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showText?: boolean;
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showText = true,
  className = '',
  variant = 'auto',
}) => {
  const { theme } = useTheme();
  
  // Se variant for 'dark' (ex: coluna esquerda do Login), é forçado dark sem sumir o "BM".
  // Se variant for 'light', é forçado light. Se 'auto', segue o tema do sistema.
  const effectiveIsDark =
    variant === 'dark' ? true : variant === 'light' ? false : theme === 'dark';

  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  const subSizes = {
    sm: 'text-[7px]',
    md: 'text-[8.5px]',
    lg: 'text-[9.5px]',
  };

  return (
    <div className={`flex items-center gap-3 select-none shrink-0 ${className}`}>
      {/* 
        Emblema Corporativo Formal BM CAST:
        - Design sóbrio, executivo e de alta tecnologia
        - Gradiente formal azul-marinho profundo / safira com borda em sky-400
        - Monograma formal e frame de sinalização digital com precisão milimétrica
      */}
      <div
        className={`relative flex items-center justify-center shrink-0 shadow-sm transition-all duration-200 hover:scale-102 bg-gradient-to-br from-[#0b1b36] via-[#0f284e] to-[#08152c] border border-sky-400/40 text-white shadow-sky-950/30 ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${svgSizes[size]} drop-shadow-xs`}
        >
          {/* Moldura de Tela Formal / Monitor Corporativo */}
          <rect
            x="3"
            y="4"
            width="26"
            height="18"
            rx="3"
            stroke="url(#skyGradient)"
            strokeWidth="1.8"
          />

          {/* Base e Suporte Formal */}
          <path
            d="M11 26h10M16 22v4"
            stroke="url(#skyGradient)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Monograma Formal "BM" com linhas geométricas limpas */}
          {/* Letra B */}
          <path
            d="M8.5 8.5h3.2c1.1 0 1.9.7 1.9 1.7 0 .8-.5 1.4-1.3 1.6.9.2 1.5.9 1.5 1.8 0 1.1-.9 1.8-2.1 1.8H8.5V8.5z"
            fill="white"
          />
          <path
            d="M10 10v1.7h1.4c.5 0 .8-.3.8-.8s-.3-.9-.8-.9H10zm0 2.9v1.9h1.6c.6 0 .9-.4.9-.9 0-.6-.3-1-.9-1H10z"
            fill="#0f284e"
          />

          {/* Letra M */}
          <path
            d="M17 15.4V8.5h1.9l2.1 4.2 2.1-4.2H25v6.9h-1.6v-4.2l-1.8 3.5h-1.1l-1.8-3.5v4.2H17z"
            fill="url(#skyGradient)"
          />

          {/* Ponto de Sinalização / Transmissão Ativa no topo direito */}
          <circle cx="25" cy="7.5" r="1.3" fill="#38bdf8" />

          {/* Definição do gradiente metálico azul celeste corporativo */}
          <defs>
            <linearGradient id="skyGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glow sutil na borda superior para acabamento de luxo */}
        <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-sky-300/50 to-transparent pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${
                effectiveIsDark ? 'text-white' : 'text-slate-900'
              } ${titleSizes[size]}`}
            >
              BM
            </span>
            <span
              className={`font-black tracking-tight ${
                effectiveIsDark ? 'text-sky-400' : 'text-sky-600'
              } ${titleSizes[size]}`}
            >
              CAST
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`font-semibold tracking-[0.2em] uppercase mt-1 ${
                effectiveIsDark ? 'text-slate-400' : 'text-slate-500'
              } ${subSizes[size]}`}
            >
              Sinalização Corporativa
            </span>
          )}
        </div>
      )}
    </div>
  );
};
