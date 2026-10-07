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
  onSave?: (updated: TickerConfig) => void;
  onSaveTicker?: (updated: TickerConfig) => void;
}

const PRESET_MESSAGES = [
  'Peça pelo nosso WhatsApp ou retire no balcão com agilidade! Consulte nossas promoções.',
  'Conecte-se ao nosso Wi-Fi gratuito escaneando o QR Code na tela. Seja bem-vindo!',
  'Horário de funcionamento: Seg a Sex das 09h às 22h | Sáb e Dom das 11h às 23h.',
];

export const TickerSettingsModal: React.FC<TickerSettingsModalProps> = ({
  isOpen,
  onClose,
  ticker,
  onSave,
  onSaveTicker,
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Letreiro Rolante da TV
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Faixa de comunicados em tempo real no rodapé da TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div>
              <div className="text-xs font-semibold text-white">Exibir Letreiro na TV</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ativa a faixa rolante inferior da TV</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Etiqueta de Destaque
            </label>
            <input
              type="text"
              value={accentTitle}
              onChange={(e) => setAccentTitle(e.target.value)}
              placeholder="Ex: AVISO AO VIVO"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-blue-500 font-semibold transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Texto do Letreiro
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o texto que irá rodar na TV..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
              Sugestões Rápidas:
            </label>
            <div className="space-y-1.5">
              {PRESET_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(msg)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer truncate"
                >
                  "{msg}"
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1.5">
              Velocidade do Texto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    speed === spd
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {spd === 'slow' ? 'Suave' : spd === 'normal' ? 'Normal' : 'Rápido'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Letreiro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
