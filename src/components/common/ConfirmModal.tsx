import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 overflow-hidden shadow-2xl border transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-bold mb-1 tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </h3>
            <p
              className={`text-xs leading-relaxed mb-4 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {description}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
