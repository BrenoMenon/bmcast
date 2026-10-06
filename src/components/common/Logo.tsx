import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, className = '' }) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-sm font-extrabold',
    md: 'text-base font-black',
    lg: 'text-xl font-black',
    xl: 'text-2xl font-black',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Precision Modern Emblem: Beveled Display with Dynamic Signal Wave - No green dot */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions[size]} group`}>
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#111A2E] via-[#0C1220] to-[#060A14] border border-[#223250] shadow-lg shadow-blue-950/40 flex items-center justify-center p-1.5 relative overflow-hidden transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-blue-500/20">
          <svg
            className="w-full h-full"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="emblemGradPrimary" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="waveGradAccent" x1="0" y1="0" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>

            {/* Smart Screen Outer Frame */}
            <rect
              x="2.5"
              y="3.5"
              width="27"
              height="20"
              rx="4.5"
              fill="#060912"
              stroke="#1E293B"
              strokeWidth="1.5"
            />

            {/* Bold Stylized BM Digital Monogram */}
            <path
              d="M7 7.5H13C14.7 7.5 15.8 8.4 15.8 9.8C15.8 10.8 15.1 11.6 14.1 11.9C15.4 12.2 16.3 13.2 16.3 14.7C16.3 16.3 15 17.5 13.1 17.5H7V7.5Z"
              fill="url(#emblemGradPrimary)"
            />
            {/* Display Cutouts */}
            <rect x="9.5" y="9.2" width="3.2" height="1.8" rx="0.5" fill="#060912" />
            <rect x="9.5" y="13.4" width="3.6" height="2" rx="0.5" fill="#060912" />

            {/* Signal Cast Radiant Waves */}
            <path
              d="M19 8.5C21.8 10 23.5 12.8 23.5 16C23.5 19.2 21.8 22 19 23.5"
              stroke="url(#waveGradAccent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M19 12C20.4 13 21.3 14.4 21.3 16C21.3 17.6 20.4 19 19 20"
              stroke="#60A5FA"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* Radiant Focal Core */}
            <circle cx="18.5" cy="16" r="1.5" fill="#93C5FD" />

            {/* Modern TV Pedestal */}
            <path
              d="M11 27.5H21M16 23.5V27.5"
              stroke="#334155"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1 leading-none tracking-tight">
          <span className={`text-white font-black tracking-tight ${titleSizes[size]}`}>
            BM
          </span>
          <span className={`bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent font-black tracking-tight ${titleSizes[size]}`}>
            CAST
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase mt-0.5 leading-none">
            Digital Signage
          </span>
        )}
      </div>
    </div>
  );
};
