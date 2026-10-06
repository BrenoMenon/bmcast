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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#121520] border border-[#22293C] rounded-2xl p-6 overflow-hidden shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive
                ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#0A0D15] hover:bg-[#181D2B] rounded-lg border border-[#22293C] transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20'
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
