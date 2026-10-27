import React from 'react';
import iconUrl from '@/assets/bmcast-icon.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | undefined;
  showSubtitle?: boolean | undefined;
  showText?: boolean | undefined;
  className?: string | undefined;
  forceLightText?: boolean | undefined;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showText = true,
  className = '',
  forceLightText = false,
}) => {
  const icon = {
    sm: 'h-8 w-8 sm:h-9 sm:w-9 rounded-lg',
    md: 'h-10 w-10 rounded-lg',
    lg: 'h-13 w-13 rounded-xl',
  }[size];
  const title = { sm: 'text-sm sm:text-base', md: 'text-lg', lg: 'text-2xl' }[size];
  const sub = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-[11px]' }[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      <img
        src={iconUrl}
        alt="BM CAST"
        width={52}
        height={52}
        className={`shrink-0 bg-[#0D1420] object-cover shadow-sm ring-1 ring-primary/25 ${icon}`}
      />
      {showText && (
        <div className="flex min-w-0 flex-col justify-center leading-none">
          <span className={`whitespace-nowrap font-extrabold tracking-tight ${title}`}>
            <span className={forceLightText ? 'text-white' : 'text-foreground'}>BM</span>{' '}
            <span className={forceLightText ? 'text-sky-400' : 'text-primary'}>CAST</span>
          </span>
          {showSubtitle && (
            <span
              className={`mt-1 whitespace-nowrap font-medium uppercase tracking-[0.18em] ${
                forceLightText ? 'text-white/65' : 'text-muted-foreground'
              } ${sub}`}
            >
              Digital Signage
            </span>
          )}
        </div>
      )}
    </div>
  );
};
