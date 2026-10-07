import React from 'react';
import {
  Clock,
  Plus,
  Play,
  Edit3,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Tv,
} from 'lucide-react';
import { Playlist, MediaItem } from '../../types/signage';
import { useTheme } from '../../context/ThemeContext';

interface PlaylistEditorProps {
  playlist: Playlist;
  mediaList: MediaItem[];
  onUpdatePlaylist: (updatedPlaylist: Playlist) => void;
  onEditSlide: (item: MediaItem) => void;
  onDuplicateSlide: (playlistId: string, itemId: string) => void;
  onCreateNewSlide: () => void;
  onLaunchPlayer: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  cardapio: 'Cardápio',
  promo: 'Oferta',
  aviso: 'Comunicado',
  mural: 'Mural',
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const totalSeconds = playlist.items.reduce(
    (acc, it) => acc + (it.durationSeconds || 12),
    0
  );

  const formatTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder}s`;
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= playlist.items.length) return;

    const newItems = [...playlist.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIdx, 0, moved);

    const reordered = newItems.map((item, idx) => ({ ...item, order: idx }));
    onUpdatePlaylist({ ...playlist, items: reordered });
  };

  const handleDurationChange = (itemId: string, newSeconds: number) => {
    const valid = Math.max(3, Math.min(300, newSeconds));
    const newItems = playlist.items.map((it) =>
      it.id === itemId ? { ...it, durationSeconds: valid } : it
    );
    onUpdatePlaylist({ ...playlist, items: newItems });
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = playlist.items.filter((it) => it.id !== itemId);
    const reordered = newItems.map((it, idx) => ({ ...it, order: idx }));
    onUpdatePlaylist({ ...playlist, items: reordered });
  };

  return (
    <div className="space-y-4">
      {/* Subheader */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Grade de Transmissão da TV
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {playlist.items.length} slides na rotação contínua · Tempo de ciclo total:{' '}
            <strong className={isDark ? 'text-sky-400' : 'text-sky-700'}>{formatTotalTime(totalSeconds)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreateNewSlide}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Slide</span>
          </button>

          <button
            onClick={onLaunchPlayer}
            className={`flex items-center gap-1.5 px-4 py-2 border active:scale-95 text-xs font-bold rounded-full transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-sky-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-xs'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ver na TV</span>
          </button>
        </div>
      </div>

      {/* Slide Items List */}
      <div className="space-y-2.5">
        {playlist.items.length === 0 ? (
          <div
            className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${
              isDark
                ? 'bg-[#131b2e] border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-500 shadow-xs'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nenhum slide programado
              </h3>
              <p className="text-xs max-w-sm mx-auto mt-1">
                Sua programação está limpa. Crie seu primeiro slide personalizado ou adicione itens da biblioteca para exibir na TV.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onCreateNewSlide}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
              >
                Criar Primeiro Slide
              </button>
            </div>
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
                className={`border rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                  isDark
                    ? 'bg-[#131b2e] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Reorder, Thumbnail, and Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col items-center justify-center shrink-0 text-slate-400">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-sky-500 disabled:opacity-20 cursor-pointer transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {index + 1}
                    </span>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === playlist.items.length - 1}
                      className="p-1 hover:text-sky-500 disabled:opacity-20 cursor-pointer transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-20 h-14 sm:w-24 sm:h-14 bg-black rounded-xl overflow-hidden shrink-0 border border-slate-800">
                    {media?.url ? (
                      <img
                        src={media.thumbnail || media.url}
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-500">
                        Slide
                      </div>
                    )}
                  </div>

                  {/* Slide Title and Metadata */}
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.customTitle || media?.title || 'Slide sem título'}
                    </h3>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 mt-1">
                      <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{catLabel}</span>
                      <span>·</span>
                      {brandCfg?.showBrand ? (
                        <span className="text-sky-600 dark:text-sky-400 font-medium">Marca: {brandCfg.brandName || 'Ativa'}</span>
                      ) : (
                        <span className="text-slate-500">Marca oculta</span>
                      )}
                      <span>·</span>
                      {qrCfg?.showQrCode ? (
                        <span className="text-sky-600 dark:text-sky-400 font-medium">
                          {qrCfg.qrCodeType === 'custom_upload' ? 'QR Real' : 'QR Link'}
                        </span>
                      ) : (
                        <span className="text-slate-500">Sem QR</span>
                      )}
                      {overlayCfg?.pricePromo && (
                        <>
                          <span>·</span>
                          <span className="text-amber-500 dark:text-amber-400 font-bold font-mono">
                            {overlayCfg.pricePromo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Duration & Actions */}
                <div className={`flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  {/* Duration input */}
                  <div
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs ${
                      isDark
                        ? 'bg-[#0b1120] border-slate-700 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min={3}
                      max={120}
                      value={item.durationSeconds || 12}
                      onChange={(e) =>
                        handleDurationChange(item.id, parseInt(e.target.value) || 12)
                      }
                      className={`w-8 bg-transparent text-center font-bold focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
                    />
                    <span className="text-[10px] text-slate-400">s</span>
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
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 border text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                    title="Editar Marca, QR Code e Oferta"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Personalizar</span>
                  </button>

                  {/* Duplicar Slide */}
                  <button
                    onClick={() => onDuplicateSlide(playlist.id, item.id)}
                    className={`p-2 border rounded-full transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                    title="Duplicar Slide"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-500" />
                  </button>

                  {/* Remover da Playlist */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className={`p-2 border rounded-full transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#152033] hover:bg-rose-500/10 border-slate-700 text-slate-400 hover:text-rose-400'
                        : 'bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-500 hover:text-rose-600'
                    }`}
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
