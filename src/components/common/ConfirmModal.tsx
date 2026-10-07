import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 overflow-hidden shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              isDestructive
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{description}</p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer shadow-md ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
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
