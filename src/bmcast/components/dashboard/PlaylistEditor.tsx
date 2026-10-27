import React from 'react';
import {
  Plus,
  Clock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit3,
  Tv,
} from 'lucide-react';
import {
  Playlist,
  MediaItem,
  SlideCategoryType,
} from '../../types/signage';

interface PlaylistEditorProps {
  playlist: Playlist;
  mediaList: MediaItem[];
  onUpdatePlaylist: (updated: Playlist) => void;
  onEditSlide: (item: MediaItem) => void;
  onDuplicateSlide: (playlistId: string, itemId: string) => void;
  onCreateNewSlide: () => void;
  onLaunchPlayer: () => void;
}

const CATEGORY_LABELS: Record<SlideCategoryType, string> = {
  cardapio: 'Cardápio',
  promo: 'Promoção',
  aviso: 'Informativo',
  mural: 'Mural / Foto',
};

export const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  playlist,
  mediaList,
  onUpdatePlaylist,
  onEditSlide,
  onDuplicateSlide,
  onCreateNewSlide,
  onLaunchPlayer,
}) => {
  const totalDurationSeconds = playlist.items.reduce(
    (acc, cur) => acc + (cur.durationSeconds || 12),
    0
  );

  const formatTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder > 0 ? `${remainder}s` : ''}`;
  };

  const handleDurationChange = (itemId: string, duration: number) => {
    const items = playlist.items.map((i) =>
      i.id === itemId ? { ...i, durationSeconds: Math.max(3, duration) } : i
    );
    onUpdatePlaylist({ ...playlist, items });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlist.items.length) return;

    const items = [...playlist.items];
    const [moved] = items.splice(index, 1);
    if (!moved) return;
    items.splice(targetIndex, 0, moved);

    const reordered = items.map((item, idx) => ({ ...item, order: idx }));
    onUpdatePlaylist({ ...playlist, items: reordered });
  };

  const handleRemoveItem = (itemId: string) => {
    const items = playlist.items.filter((i) => i.id !== itemId);
    onUpdatePlaylist({ ...playlist, items });
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Grade de Transmissão Ativa na TV
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>{playlist.items.length} slides na sequência</span>
            <span aria-hidden="true">·</span>
            <span>
              Ciclo:{' '}
              <strong className="font-semibold text-foreground tabular-nums">
                {formatTotalTime(totalDurationSeconds)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCreateNewSlide}
            className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-2xl sm:rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Novo Slide</span>
          </button>
          <button
            type="button"
            onClick={onLaunchPlayer}
            className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-2xl sm:rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
          >
            <Tv className="h-4 w-4 text-primary shrink-0" />
            <span>Abrir TV</span>
          </button>
        </div>
      </div>

      {/* Playlist Items */}
      <div className="space-y-3">
        {playlist.items.length === 0 ? (
          <div className="rounded-3xl sm:rounded-[2rem] border border-dashed border-border bg-card p-6 sm:p-10 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Tv className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Sua grade está limpa</h3>
            <p className="mx-auto mb-5 mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Envie suas próprias artes, fotos ou comunicados para iniciar a exibição na Smart TV.
            </p>
            <button
              type="button"
              onClick={onCreateNewSlide}
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer"
            >
              Criar Primeiro Slide
            </button>
          </div>
        ) : (
          playlist.items.map((item, index) => {
            const media = mediaList.find((m) => m.id === item.mediaId);
            const category = media?.category || 'cardapio';
            const catLabel = CATEGORY_LABELS[category] || 'Slide';

            const brandCfg = item.brandConfig || media?.brandConfig;
            const qrCfg = item.qrConfig || media?.qrConfig;
            const overlayCfg = item.categoryOverlay || media?.categoryOverlay;
            const fitMode = overlayCfg?.imageFit || 'cover';

            return (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-3xl border border-border bg-card p-3.5 sm:p-4 shadow-xs hover:border-primary/40 transition"
              >
                {/* Left: Reorder, High-Clarity Thumbnail, and Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className="flex flex-col items-center justify-center shrink-0 text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted hover:text-foreground disabled:opacity-25 cursor-pointer transition"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-foreground tabular-nums leading-none py-0.5">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === playlist.items.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted hover:text-foreground disabled:opacity-25 cursor-pointer transition"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-16 w-24 sm:w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-zinc-950">
                    {media?.url ? (
                      <img
                        src={media.url}
                        alt={media.title}
                        loading="lazy"
                        className={`h-full w-full ${
                          fitMode === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center px-1.5 text-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: brandCfg?.accentColor || '#2563EB' }}
                      >
                        Arte Texto
                      </div>
                    )}
                  </div>

                  {/* Titles & Unboxed Metadata */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="truncate text-xs sm:text-sm font-bold text-foreground">
                      {item.customTitle || overlayCfg?.headline || media?.title || 'Slide da TV'}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/85">{catLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.durationSeconds || 12}s</span>
                      {qrCfg?.showQrCode && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-primary">QR ativo</span>
                        </>
                      )}
                      {overlayCfg?.pricePromo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {overlayCfg.pricePromo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Duration & Actions (Responsive row on mobile, zero horizontal overflow) */}
                <div className="flex items-center justify-between md:justify-end gap-2 border-t border-border pt-2.5 md:border-t-0 md:pt-0">
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <input
                      type="number"
                      min={3}
                      max={120}
                      value={item.durationSeconds || 12}
                      onChange={(e) =>
                        handleDurationChange(item.id, parseInt(e.target.value, 10) || 12)
                      }
                      aria-label="Duração em segundos"
                      className="w-9 bg-transparent text-center text-sm sm:text-xs font-bold text-foreground focus:outline-none tabular-nums"
                    />
                    <span className="text-[11px]">s</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (media) {
                          onEditSlide({
                            ...media,
                            brandConfig: item.brandConfig || media.brandConfig,
                            qrConfig: item.qrConfig || media.qrConfig,
                            categoryOverlay: item.categoryOverlay || media.categoryOverlay,
                            durationDefault: item.durationSeconds || media.durationDefault,
                          });
                        }
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                      title="Editar Slide"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="sm:hidden">Editar</span>
                      <span className="hidden sm:inline">Personalizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateSlide(playlist.id, item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-foreground hover:bg-muted transition cursor-pointer"
                      title="Duplicar Slide"
                      aria-label="Duplicar Slide"
                    >
                      <Copy className="h-3.5 w-3.5 text-primary" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                      title="Remover da grade"
                      aria-label="Remover da grade"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
