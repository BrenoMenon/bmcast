import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { TickerConfig } from '../../types/signage';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-md rounded-2xl p-5 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl border transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Letreiro Rolante da TV (Rodapé)
            </h2>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Faixa de comunicados em tempo real na parte inferior da tela
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - com padding horizontal seguro e overflow controlado */}
        <div className="flex-1 overflow-y-auto py-3.5 px-0.5 space-y-3">
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0b1120] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Exibir Letreiro na TV
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ativa a faixa rolante inferior da TV
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Etiqueta de Destaque
            </label>
            <input
              type="text"
              value={accentTitle}
              onChange={(e) => setAccentTitle(e.target.value)}
              placeholder="Ex: AVISO AO VIVO"
              className={`w-full px-3 py-1.5 border rounded-lg text-xs uppercase font-semibold transition-colors box-border ${
                isDark
                  ? 'bg-[#0b1120] border-slate-700 text-white focus:border-sky-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            />
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Texto do Letreiro
            </label>
            <div className="w-full">
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite o texto que irá passar na TV..."
                className={`w-full px-3 py-2 border rounded-lg text-xs transition-colors resize-none box-border block ${
                  isDark
                    ? 'bg-[#0b1120] border-slate-700 text-white focus:border-sky-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sugestões Rápidas:
            </label>
            <div className="space-y-1">
              {PRESET_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(msg)}
                  className={`w-full text-left p-1.5 px-2.5 rounded-lg border text-[11px] transition-colors cursor-pointer truncate box-border ${
                    isDark
                      ? 'bg-[#0b1120] hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  "{msg}"
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Velocidade do Texto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer box-border ${
                    speed === spd
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : isDark
                      ? 'bg-[#0b1120] text-slate-400 border-slate-800 hover:text-white'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {spd === 'slow' ? 'Lenta' : spd === 'normal' ? 'Normal' : 'Rápida'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>
  );
};
