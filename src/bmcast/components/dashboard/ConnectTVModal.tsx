import React, { useState, useEffect } from 'react';
import {
  X,
  Tv,
  Copy,
  Check,
  Play,
  ExternalLink,
  Smartphone,
  Monitor,
  Hash,
  Link2,
} from 'lucide-react';
import { Screen } from '../../types/signage';
import { qrService } from '../../services/qrService';
import { supabaseService } from '../../services/supabaseClient';

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
  const [copiedType, setCopiedType] = useState<'slug' | 'code' | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'link' | 'guide'>('link');

  const activeScreen =
    screens.find((s) => s.slug === selectedScreenSlug) ||
    screens[0] || {
      id: 'default',
      name: 'TV Principal',
      slug: 'tv1',
      location: 'Ambiente Principal',
      orientation: 'landscape' as const,
      pairingCode: '1024',
    };

  const hostDisplay =
    typeof window !== 'undefined' ? window.location.host : 'seusite.com';

  const numericCode =
    (activeScreen.pairingCode || '').replace(/\D/g, '').slice(0, 4) || activeScreen.slug;

  const tvShortUrl = supabaseService.buildScreenShareUrl(activeScreen.slug);
  const tvNumericUrl = supabaseService.buildScreenShareUrl(numericCode);

  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      try {
        const dataUrl = await qrService.generateDataUrl(tvShortUrl, '#000000', '#ffffff');
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
  }, [tvShortUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (url: string, type: 'slug' | 'code') => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex h-[100dvh] sm:h-auto sm:max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-none sm:rounded-[2rem] border-0 sm:border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3.5 sm:px-6 sm:py-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <Tv className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground truncate">
                  Conectar Smart TV ou Totem
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Transmissão otimizada para TVs e Totens com link curto sem símbolos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Clean 2-col Segmented Tabs */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Link Curto &amp; Código
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Passo a Passo na TV
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
          {activeTab === 'link' ? (
            <div className="space-y-4">
              {screens.length > 1 && (
                <div className="rounded-2xl border border-border bg-muted/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-foreground">Selecionar TV:</span>
                    <p className="text-[11px] text-muted-foreground">
                      Cada TV possui seu próprio atalho curto independente.
                    </p>
                  </div>
                  <select
                    value={activeScreen.slug}
                    onChange={(e) => onSelectScreenSlug(e.target.value)}
                    className="rounded-xl border border-border bg-card px-3.5 py-2 text-base sm:text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    {screens.map((sc) => (
                      <option key={sc.id} value={sc.slug} className="bg-card text-foreground">
                        {sc.name} ({sc.orientation === 'landscape' ? '16:9' : '9:16'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center rounded-3xl border border-border bg-muted/35 p-4 sm:p-6">
                {/* High-Clarity QR Code */}
                <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 text-center space-y-2 shadow-sm">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code da TV"
                      className="h-40 w-40 sm:h-44 sm:w-44 object-contain"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center text-xs text-slate-400">
                      Gerando QR...
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-slate-900">
                    Escaneie para abrir direto
                  </p>
                </div>

                {/* Simplified Short URLs for TV Remotes */}
                <div className="md:col-span-7 space-y-4 min-w-0">
                  <div>
                    <h4 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground truncate">
                      {activeScreen.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Escolha a forma mais fácil de abrir no navegador da sua Smart TV:
                    </p>
                  </div>

                  {/* Option 1: Short Slug URL (e.g. dominio.com/tv1) */}
                  <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Link2 className="h-3.5 w-3.5 text-primary" />
                        <span>Opção 1 · Link Curto Direto</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 font-mono text-xs sm:text-sm font-bold text-primary truncate select-all">
                        {hostDisplay}/{activeScreen.slug}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(tvShortUrl, 'slug')}
                        className={`inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer shrink-0 ${
                          copiedType === 'slug'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-primary text-primary-foreground hover:opacity-95'
                        }`}
                      >
                        {copiedType === 'slug' ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Option 2: 4-Digit Numeric Short Link */}
                  <div className="rounded-2xl border border-border bg-card p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Hash className="h-3.5 w-3.5 text-primary" />
                        <span>Opção 2 · Link Curto Numérico</span>
                      </span>
                      <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-foreground truncate select-all">
                          {hostDisplay}/{numericCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(tvNumericUrl, 'code')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shrink-0"
                    >
                      {copiedType === 'code' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span>{copiedType === 'code' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Launch Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchPlayer(activeScreen.slug);
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                      <span>Iniciar Player Agora</span>
                    </button>

                    <a
                      href={tvShortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Abrir em Nova Aba</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-muted/35 p-4 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Tv className="h-4 w-4 text-primary shrink-0" />
                  <span>Smart TVs Samsung e LG</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>
                    Abra o aplicativo <strong>Internet / Navegador Web</strong> na sua Smart TV.
                  </li>
                  <li>
                    Digite apenas <strong className="font-mono text-foreground">{hostDisplay}/{activeScreen.slug}</strong> ou <strong className="font-mono text-foreground">{hostDisplay}/{numericCode}</strong> (sem símbolos complicados).
                  </li>
                  <li>
                    Ative a <strong>Tela Cheia</strong> para transmissão otimizada para TVs e Totens.
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-muted/35 p-4 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                  <span>Android TV, Google TV, Fire TV Stick e TV Box</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>
                    Abra o navegador instalado na TV (como <strong>TV Bro</strong>, <strong>Silk</strong> ou <strong>Chrome</strong>).
                  </li>
                  <li>
                    Digite o atalho curto <strong className="font-mono text-foreground">{hostDisplay}/{activeScreen.slug}</strong> e salve nos favoritos da TV para abrir com 1 clique.
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-muted/35 p-4 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Monitor className="h-4 w-4 text-primary shrink-0" />
                  <span>Totem Digital ou Mini PC via Cabo HDMI</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>Abra o link curto no navegador Chrome ou Edge.</li>
                  <li>Pressione <strong>F11</strong> para entrar em tela cheia limpa em alta resolução.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3.5 sm:px-6 sm:py-4">
          <span className="text-xs text-muted-foreground">
            Alterações feitas no painel atualizam automaticamente na TV.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-card px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
