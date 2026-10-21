import React from 'react';
import iconUrl from '@/assets/bmcast-icon.png';
const iconAsset = { url: iconUrl };

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | undefined;
  showSubtitle?: boolean | undefined;
  showText?: boolean | undefined;
  className?: string | undefined;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, showText = true, className = '' }) => {
  const icon = { sm: 'h-8 w-8 rounded-xl', md: 'h-10 w-10 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }[size];
  const title = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }[size];
  const sub = { sm: 'text-[8px]', md: 'text-[9.5px]', lg: 'text-[11px]' }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={iconAsset.url}
        alt="BM CAST"
        width={56}
        height={56}
        className={`keep-dark shrink-0 object-cover shadow-md ring-1 ring-blue-500/30 ${icon}`}
      />
      {showText && (
        <div className="flex min-w-0 flex-col justify-center leading-none">
          <span className={`whitespace-nowrap font-extrabold tracking-tight ${title}`}>
            <span className="text-slate-900 dark:text-white">BM</span>{' '}
            <span className="text-sky-500">CAST</span>
          </span>
          {showSubtitle && (
            <span className={`mt-1 whitespace-nowrap font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ${sub}`}>
              Digital Signage
            </span>
          )}
        </div>
      )}
    </div>
  );
};
