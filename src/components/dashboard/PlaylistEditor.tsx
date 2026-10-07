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
  mural: 'Mural de Fotos',
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
      {/* Action Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            Grade de Transmissão Ativa na TV
          </h2>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
            <span>{playlist.items.length} slides</span>
            <span className="text-slate-600">·</span>
            <span>
              Ciclo total:{' '}
              <strong className="text-white font-semibold">
                {formatTotalTime(totalDurationSeconds)}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCreateNewSlide}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Slide</span>
          </button>
          <button
            onClick={onLaunchPlayer}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-full transition-all cursor-pointer"
          >
            <Tv className="w-4 h-4 text-blue-400" />
            <span>Ver na TV</span>
          </button>
        </div>
      </div>

      {/* Playlist Items */}
      <div className="space-y-3">
        {playlist.items.length === 0 ? (
          <div className="p-10 text-center bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Nenhum slide programado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Crie seu primeiro slide com foto, categoria, personalização da marca e QR Code para começar.
            </p>
            <button
              onClick={onCreateNewSlide}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
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

            return (
              <div
                key={item.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 transition-all hover:border-blue-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
              >
                {/* Left: Reorder, Thumbnail, and Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col items-center justify-center shrink-0 text-slate-500">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-300">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === playlist.items.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-20 h-14 sm:w-24 sm:h-14 bg-black rounded-xl overflow-hidden shrink-0 border border-slate-700">
                    {media?.url ? (
                      <img
                        src={media.thumbnail || media.url}
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 text-[10px]">
                        Sem foto
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-black/80 text-[9px] font-bold text-white border border-white/10">
                      {catLabel}
                    </span>
                  </div>

                  {/* Titles & Meta */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                        {item.customTitle || overlayCfg?.headline || media?.title || 'Slide Sem Título'}
                      </h4>

                      {overlayCfg?.badgeText && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white tracking-wide uppercase"
                          style={{ backgroundColor: overlayCfg.accentColor || '#2563EB' }}
                        >
                          {overlayCfg.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                      <span>{item.durationSeconds || 12}s</span>

                      <span aria-hidden="true" className="text-slate-600">·</span>

                      {brandCfg?.showBrand ? (
                        <span className="text-blue-400 font-medium">Marca: {brandCfg.brandName || 'Ativa'}</span>
                      ) : (
                        <span className="text-slate-500">Marca oculta</span>
                      )}

                      <span aria-hidden="true" className="text-slate-600">·</span>

                      {qrCfg?.showQrCode ? (
                        <span className="text-sky-300 font-medium">
                          {qrCfg.qrCodeType === 'custom_upload' ? 'QR Real' : 'QR Link'}
                        </span>
                      ) : (
                        <span className="text-slate-500">Sem QR</span>
                      )}

                      {overlayCfg?.pricePromo && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-emerald-400 font-bold">{overlayCfg.pricePromo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Duration & Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/80">
                  {/* Duration input */}
                  <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min={3}
                      max={120}
                      value={item.durationSeconds || 12}
                      onChange={(e) =>
                        handleDurationChange(item.id, parseInt(e.target.value) || 12)
                      }
                      className="w-8 bg-transparent text-center font-bold text-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">s</span>
                  </div>

                  {/* Personalizar Slide */}
                  <button
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
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
                    title="Editar Marca, QR Code e Oferta"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Personalizar</span>
                  </button>

                  {/* Duplicar Slide */}
                  <button
                    onClick={() => onDuplicateSlide(playlist.id, item.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
                    title="Duplicar Slide como nova variação"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                  </button>

                  {/* Remover da Playlist */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full border border-slate-700 hover:border-red-500/40 transition-colors cursor-pointer"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
