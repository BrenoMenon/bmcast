import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bm-card w-full max-w-sm p-5 space-y-4 shadow-2xl relative border-rose-900/40">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-md flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Excluindo...' : 'Excluir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
