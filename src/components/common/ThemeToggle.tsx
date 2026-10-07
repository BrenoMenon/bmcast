import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-white shadow-xs'
          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
      } ${className}`}
      title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      aria-label="Alternar tema claro e escuro"
    >
      {/* 
        Zero yellow: crisp white/slate stroke only as requested by user
      */}
      {isDark ? (
        <Sun className="w-4 h-4 text-white stroke-[2]" />
      ) : (
        <Moon className="w-4 h-4 text-slate-800 stroke-[2]" />
      )}
    </button>
  );
};
