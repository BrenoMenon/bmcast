import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
} from 'lucide-react';
import { TickerConfig } from '../../types/signage';

interface TickerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: TickerConfig;
  onSave: (updatedTicker: TickerConfig) => void;
}

const PRESET_MESSAGES = [
  'Bem-vindo ao nosso espaço! Peça pelo WhatsApp ou no Balcão • Aceitamos PIX e Cartões.',
  'Super Oferta do Dia: Na compra de qualquer prato ou combo, ganhe uma bebida especial!',
  'Conecte-se ao nosso Wi-Fi Grátis: Aponte a câmera do seu celular para o QR Code na TV.',
  'Horário de Atendimento Especial de Fim de Semana • Espaço climatizado para você e sua família.',
];

export const TickerSettingsModal: React.FC<TickerSettingsModalProps> = ({
  isOpen,
  onClose,
  ticker,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [accentTitle, setAccentTitle] = useState('AVISO AO VIVO');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  useEffect(() => {
    setEnabled(ticker.enabled !== false);
    setAccentTitle(ticker.accentTitle || 'AVISO AO VIVO');
    setText(ticker.text || '');
    setSpeed(ticker.speed || 'normal');
  }, [ticker, isOpen]);

  const handleSave = () => {
    onSave({
      enabled,
      accentTitle: accentTitle.trim() || 'COMUNICADO',
      text: text.trim(),
      speed,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#121520] border border-[#22293C] rounded-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2436]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Letreiro Rolante da TV (Rodapé)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Faixa de comunicados em tempo real na parte inferior da tela
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2436] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
          <div className="flex items-center justify-between p-3 bg-[#0A0D15] rounded-xl border border-[#22293C]">
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
              <div className="w-10 h-5 bg-[#181D2B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">
              Etiqueta de Destaque
            </label>
            <input
              type="text"
              value={accentTitle}
              onChange={(e) => setAccentTitle(e.target.value)}
              placeholder="Ex: AVISO AO VIVO"
              className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white uppercase focus:outline-none focus:border-blue-500 font-semibold transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">
              Texto do Letreiro
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o texto que irá rodar na TV..."
              className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">
              Sugestões Rápidas:
            </label>
            <div className="space-y-1.5">
              {PRESET_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(msg)}
                  className="w-full text-left p-2 rounded-lg bg-[#0A0D15] hover:bg-[#181D2B] border border-[#22293C] text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer truncate"
                >
                  "{msg}"
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1.5">
              Velocidade do Texto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    speed === spd
                      ? 'bg-[#1C2234] text-white border-blue-500 font-semibold shadow-sm'
                      : 'bg-[#0A0D15] text-slate-400 border-[#22293C] hover:text-white'
                  }`}
                >
                  {spd === 'slow' ? 'Suave' : spd === 'normal' ? 'Normal' : 'Rápido'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-[#1E2436] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-600/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
