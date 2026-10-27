import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  isDestructive?: boolean | undefined;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`shrink-0 rounded-2xl p-2.5 ${
              isDestructive
                ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
                : 'bg-primary/15 text-primary ring-1 ring-primary/30'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-bold tracking-tight text-foreground">{title}</h3>
            <p className="mb-5 text-xs leading-relaxed text-muted-foreground">{description}</p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-border bg-muted/70 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-full px-5 py-2 text-xs font-bold shadow-xs transition cursor-pointer ${
                  isDestructive
                    ? 'bg-destructive text-destructive-foreground hover:opacity-95'
                    : 'bg-primary text-primary-foreground hover:opacity-95'
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
