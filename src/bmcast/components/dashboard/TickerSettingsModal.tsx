import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Radio,
} from 'lucide-react';
import { TickerConfig } from '../../types/signage';

interface TickerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: TickerConfig;
  onSave?: ((updated: TickerConfig) => void) | undefined;
  onSaveTicker?: ((updated: TickerConfig) => void) | undefined;
  setupHint?: string | undefined;
}

export const TickerSettingsModal: React.FC<TickerSettingsModalProps> = ({
  isOpen,
  onClose,
  ticker,
  onSave,
  onSaveTicker,
  setupHint,
}) => {
  const [enabled, setEnabled] = useState(ticker.enabled);
  const [text, setText] = useState(ticker.text);
  const [speed, setSpeed] = useState(ticker.speed || 'normal');
  const [accentTitle, setAccentTitle] = useState(ticker.accentTitle || 'COMUNICADO');

  useEffect(() => {
    if (isOpen) {
      setEnabled(ticker.enabled);
      setText(ticker.text);
      setSpeed(ticker.speed || 'normal');
      setAccentTitle(ticker.accentTitle || 'COMUNICADO');
    }
  }, [isOpen, ticker]);

  const handleSave = () => {
    const updated: TickerConfig = {
      ...ticker,
      enabled,
      text: text.trim(),
      speed,
      accentTitle: accentTitle.trim(),
    };
    (onSave || onSaveTicker)?.(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-[2rem] border border-border bg-card p-5 sm:p-6 text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Radio className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight text-foreground truncate">
                Letreiro Rolante da TV
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Faixa de comunicados no rodapé da tela
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {setupHint && (
            <p className="rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-2.5 text-xs font-semibold text-primary">
              {setupHint}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-3.5">
            <div>
              <div className="text-xs font-bold text-foreground">Exibir Letreiro na TV</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Ativa a faixa de texto contínua no rodapé
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Etiqueta de Destaque
            </label>
            <input
              type="text"
              value={accentTitle}
              onChange={(e) => setAccentTitle(e.target.value)}
              placeholder="Ex: AVISO"
              className="w-full rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base sm:text-xs font-bold uppercase text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none transition"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Seu Texto Personalizado
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva a mensagem que deseja exibir no rodapé da sua TV..."
              className="w-full rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none transition"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Velocidade de Leitura
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`rounded-2xl border py-2.5 text-xs font-bold transition cursor-pointer ${
                    speed === spd
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {spd === 'slow' ? 'Suave' : spd === 'normal' ? 'Normal' : 'Rápido'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>Salvar Letreiro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
