import React, { useState, useEffect } from 'react';
import {
  X,
  Tv,
  Copy,
  Check,
  Play,
  ExternalLink,
  QrCode,
  Smartphone,
  Monitor,
  HelpCircle,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { Screen } from '../../types/signage';
import { qrService } from '../../services/qrService';

interface ConnectTVModalProps {
  isOpen: boolean;
  onClose: () => void;
  screens: Screen[];
  selectedScreenSlug: string;
  onSelectScreenSlug: (slug: string) => void;
  onLaunchPlayer: (slug: string) => void;
}

export const ConnectTVModal: React.FC<ConnectTVModalProps> = ({
  isOpen,
  onClose,
  screens,
  selectedScreenSlug,
  onSelectScreenSlug,
  onLaunchPlayer,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'link' | 'guide'>('link');

  const activeScreen =
    screens.find((s) => s.slug === selectedScreenSlug) ||
    screens[0] || {
      id: 'default',
      name: 'TV Principal 1',
      slug: 'tv-principal',
      location: 'Salão',
      orientation: 'landscape',
      pairingCode: 'TV-1001',
    };

  const tvUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}?screen=${activeScreen.slug}`
      : `https://bmcast.app?screen=${activeScreen.slug}`;

  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      try {
        const dataUrl = await qrService.generateDataUrl(tvUrl, '#000000', '#ffffff');
        if (!isCancelled) {
          setQrCodeDataUrl(dataUrl);
        }
      } catch (e) {
        console.error('Erro ao gerar QR Code da TV:', e);
      }
    };

    if (isOpen) {
      generate();
    }

    return () => {
      isCancelled = true;
    };
  }, [tvUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tvUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenNewTab = () => {
    window.open(tvUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-blue-950/40 to-transparent border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Conectar com Telões ou Smart TVs
              </h3>
              <p className="text-xs text-slate-400">
                Acesse o link direto ou aponte a câmera para iniciar a transmissão contínua
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

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'link'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Link Direto & QR Code
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Como Conectar na sua Marca de TV
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'link' ? (
            <div className="space-y-6">
              {/* Screen Selector if multiple */}
              {screens.length > 1 && (
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-200">Escolha a TV a conectar:</span>
                    <p className="text-[11px] text-slate-400">Cada tela pode ter seu próprio link e programação.</p>
                  </div>
                  <select
                    value={activeScreen.slug}
                    onChange={(e) => onSelectScreenSlug(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {screens.map((sc) => (
                      <option key={sc.id} value={sc.slug}>
                        {sc.name} ({sc.location}) - {sc.orientation === 'landscape' ? '16:9' : '9:16'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Main Connecting Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-800/40 border border-slate-700/80 rounded-3xl p-5 sm:p-6">
                {/* QR Code Container */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl text-center space-y-2">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code da TV"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                      Gerando QR...
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-slate-900">
                    Aponte a câmera da TV ou celular
                  </p>
                </div>

                {/* Info and Actions */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] font-bold text-blue-400 mb-2">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Transmissão Instantânea 24/7</span>
                    </div>

                    <h4 className="text-lg font-bold text-white tracking-tight">
                      {activeScreen.name}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Código de Pareamento Rápido:{' '}
                      <strong className="text-blue-400 font-extrabold text-sm tracking-wider">
                        {activeScreen.pairingCode || 'TV-1001'}
                      </strong>
                    </p>
                  </div>

                  {/* URL Box with Copy Icon BEFORE text */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Link Direto do Player da TV:
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-mono truncate select-all">
                        {tvUrl}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Link da TV</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Launch Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchPlayer(activeScreen.slug);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Transmissão Agora</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenNewTab}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-full border border-slate-700 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Testar em Nova Aba</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Guide Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <span>Smart TVs Samsung (Tizen)</span>
                </h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>No controle da TV, abra a barra de aplicativos e clique em <strong>Internet</strong> (ou Navegador Web).</li>
                  <li>Na barra de endereço do navegador da TV, digite o link copiado ou aponte o celular pro QR Code.</li>
                  <li>Clique no ícone de <strong>Tela Cheia</strong> para esconder a barra de navegação. A TV rodará os slides 24 horas por dia!</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <span>Smart TVs LG (webOS)</span>
                </h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Pressione o botão Home do controle Magic Remote e abra o app <strong>Navegador da Web</strong>.</li>
                  <li>Digite a URL da sua tela. O sistema carrega seus slides, tempo e letreiro instantaneamente.</li>
                  <li>Toque no botão de maximizar para rodar em tela cheia sem interrupções.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Android TV / Google TV / Fire Stick / TV Box</span>
                </h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Na Google Play Store da TV, instale o navegador <strong>Chrome</strong> ou <strong>TV Bro</strong>.</li>
                  <li>Acesse o link da tela ou defina-o como página inicial do navegador para iniciar automaticamente ao ligar a TV.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span>Computador / Mini PC ligado via Cabo HDMI</span>
                </h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Abra o link no navegador Chrome ou Edge.</li>
                  <li>Pressione a tecla <strong>F11</strong> no teclado para ativar a Tela Cheia nativa.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Dúvidas? Suas alterações no painel aparecem na TV em menos de 1 segundo.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-full transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
