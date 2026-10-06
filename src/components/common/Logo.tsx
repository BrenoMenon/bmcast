import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-13 w-13 rounded-2xl',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const subSizes = {
    sm: 'text-[8px]',
    md: 'text-[9.5px]',
    lg: 'text-xs',
  };

  const shouldShowText = showText;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Formal Corporate Broadcast Insignia - Clean TV/Display Geometry, No green ball */}
      <div
        className={`grid shrink-0 place-items-center bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-[#2dd4bf] border border-[#334155] shadow-sm ${iconDimensions[size]}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[58%] w-[58%]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Professional Display Frame with Broadcast Wave */}
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <path d="M7 10l3-3 4 5 3-3" stroke="#2dd4bf" strokeWidth="1.8" />
        </svg>
      </div>

      {shouldShowText && (
        <div className="flex min-w-0 flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-white ${titleSizes[size]}`}>
              BM CAST
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#2dd4bf] text-[#042f2e] tracking-wider uppercase">
              PRO
            </span>
          </div>
          {showSubtitle && (
            <span className={`font-medium text-slate-400 mt-1 tracking-wider uppercase ${subSizes[size]}`}>
              Sinalização Digital
            </span>
          )}
        </div>
      )}
    </div>
  );
};
