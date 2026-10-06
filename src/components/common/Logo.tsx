import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, className = '' }) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 
        CHARISMATIC BM CAST BRAND ICON:
        Dynamic dual-display cast symbol with radiant signal geometry.
        Bold, modern, commercial, memorable - zero AI slop, zero boring minimalism.
      */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions[size]} group`}>
        {/* Layered Cast Device Icon with Vibrant Depth */}
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1E2638] via-[#121624] to-[#0A0D17] border border-[#2D374E] shadow-lg shadow-blue-950/40 flex items-center justify-center p-2 relative overflow-hidden transition-all duration-300 group-hover:border-blue-500/60 group-hover:shadow-blue-500/20">
          {/* Subtle Ambient Backlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-500/20 pointer-events-none" />

          {/* Precision Broadcast Cast Geometry */}
          <svg
            className="w-full h-full relative z-10"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Primary TV Display Contour */}
            <rect
              x="3"
              y="5"
              width="26"
              height="18"
              rx="4"
              stroke="#F8FAFC"
              strokeWidth="2"
              className="drop-shadow"
            />
            {/* Signal Broadcast Arcs (The "Cast" signature) */}
            <path
              d="M7 19a5 5 0 0 1 5-5"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M7 15a9 9 0 0 1 9-9"
              stroke="#60A5FA"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Transmission Origin Core */}
            <circle cx="7" cy="19" r="1.5" fill="#38BDF8" />

            {/* Smart TV Stand Base */}
            <path
              d="M11 27h10M16 23v4"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Live Broadcast Pulse Node */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-[#0A0D17]" />
        </span>
      </div>

      {/* High-Impact Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-white ${titleSizes[size]}`}>
            BM
          </span>
          <span className={`font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent ${titleSizes[size]}`}>
            CAST
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1 leading-none">
            Smart TV Signage
          </span>
        )}
      </div>
    </div>
  );
};
