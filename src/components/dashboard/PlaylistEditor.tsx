import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, Plus, Trash2, ArrowUp, ArrowDown, 
  Clock, Tv, Check, Film, Image as ImageIcon,
  LayoutGrid, List, Play, Pause, Eye, Sparkles,
  ChevronLeft, ChevronRight, X, Maximize2
} from 'lucide-react';
import { Playlist, Screen, MediaItem, PlaylistItem } from '../../types/signage';
import { storageService } from '../../services/storageService';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface PlaylistEditorProps {
  screens: Screen[];
  playlists: Playlist[];
  media: MediaItem[];
  onRefresh: () => void;
  onOpenPlayer: (slug: string) => void;
}

export const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  screens,
  playlists,
  media,
  onRefresh,
  onOpenPlayer,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    playlists[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'mural' | 'list'>('mural');
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);

  // Live Mural Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(true);

  // In-app delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [targetScreenId, setTargetScreenId] = useState(screens[0]?.id || '');
  const [batchToast, setBatchToast] = useState<string | null>(null);

  const activePlaylist = useMemo(() => {
    return playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  }, [playlists, selectedPlaylistId]);

  const totalDurationSeconds = useMemo(() => {
    if (!activePlaylist) return 0;
    return activePlaylist.items.reduce((acc, item) => acc + (item.durationSeconds || 10), 0);
  }, [activePlaylist]);

  // Slides with resolved media
  const resolvedSlides = useMemo(() => {
    if (!activePlaylist) return [];
    return activePlaylist.items
      .map((item) => {
        const m = media.find((med) => med.id === item.mediaId);
        return {
          ...item,
          media: m,
        };
      })
      .filter((item): item is typeof item & { media: MediaItem } => Boolean(item.media));
  }, [activePlaylist, media]);

  // Auto-slide effect in preview modal
  useEffect(() => {
    if (!isPreviewModalOpen || !isPreviewPlaying || resolvedSlides.length <= 1) return;
    const currentSlide = resolvedSlides[previewIndex] || resolvedSlides[0];
    const duration = (currentSlide?.durationSeconds || 10) * 1000;

    const timer = setTimeout(() => {
      setPreviewIndex((prev) => (prev + 1) % resolvedSlides.length);
    }, Math.max(2000, duration));

    return () => clearTimeout(timer);
  }, [isPreviewModalOpen, isPreviewPlaying, previewIndex, resolvedSlides]);

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const items = [...activePlaylist.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const updatedItems = items.map((item, i) => ({ ...item, order: i }));
    await storageService.savePlaylist({
      ...activePlaylist,
      items: updatedItems,
    });
    onRefresh();
  };

  const handleUpdateDuration = async (itemId: string, newSec: number) => {
    if (!activePlaylist) return;
    const clamped = Math.max(2, Math.min(300, newSec));
    const updatedItems = activePlaylist.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, durationSeconds: clamped };
      }
      return item;
    });

    await storageService.savePlaylist({
      ...activePlaylist,
      items: updatedItems,
    });
    onRefresh();
  };

  const handleBatchDuration = async (seconds: number) => {
    if (!activePlaylist || activePlaylist.items.length === 0) return;
    const updatedItems = activePlaylist.items.map((item) => ({
      ...item,
      durationSeconds: seconds,
    }));
    await storageService.savePlaylist({
      ...activePlaylist,
      items: updatedItems,
    });
    onRefresh();
    setBatchToast(`Tempo de todos os ${activePlaylist.items.length} slides definido para ${seconds} segundos!`);
    setTimeout(() => setBatchToast(null), 2500);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!activePlaylist) return;
    const updatedItems = activePlaylist.items
      .filter((item) => item.id !== itemId)
      .map((item, i) => ({ ...item, order: i }));

    try {
      await storageService.savePlaylist({
        ...activePlaylist,
        items: updatedItems,
      });
    } finally {
      onRefresh();
    }
  };

  const handleAddMediaToPlaylist = async (mediaItem: MediaItem) => {
    if (!activePlaylist) return;
    const newItem: PlaylistItem = {
      id: `pi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      mediaId: mediaItem.id,
      durationSeconds: mediaItem.durationDefault || 10,
      order: activePlaylist.items.length,
      customTitle: mediaItem.title,
    };

    await storageService.savePlaylist({
      ...activePlaylist,
      items: [...activePlaylist.items, newItem],
    });
    setIsAddMediaModalOpen(false);
    onRefresh();
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPlay: Playlist = {
      id: `play-${Date.now()}`,
      name: newPlaylistName,
      description: newPlaylistDesc || 'Mural de slides para TV',
      screenId: targetScreenId,
      items: [],
      updatedAt: new Date().toISOString(),
    };

    await storageService.savePlaylist(newPlay);

    if (targetScreenId) {
      const screenObj = screens.find((s) => s.id === targetScreenId);
      if (screenObj) {
        await storageService.updateScreen({
          ...screenObj,
          activePlaylistId: newPlay.id,
        });
      }
    }

    setSelectedPlaylistId(newPlay.id);
    setIsCreatePlaylistOpen(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    onRefresh();
  };

  const handleAssignToScreen = async (screenId: string) => {
    if (!activePlaylist) return;
    const target = screens.find((s) => s.id === screenId);
    if (target) {
      await storageService.updateScreen({
        ...target,
        activePlaylistId: activePlaylist.id,
      });
      await storageService.savePlaylist({
        ...activePlaylist,
        screenId,
      });
      onRefresh();
    }
  };

  const handleConfirmDeletePlaylist = async () => {
    if (!activePlaylist) return;
    setIsDeleting(true);
    const idToDelete = activePlaylist.id;
    try {
      await storageService.deletePlaylist(idToDelete);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      const remaining = playlists.filter((p) => p.id !== idToDelete);
      setSelectedPlaylistId(remaining[0]?.id || '');
      onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <span>Mural de Imagens & Playlists de Slides</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize a ordem visual dos slides, tempo de exibição de cada imagem e pré-visualize na TV.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {playlists.length > 0 && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-[#111726] border border-[#1E293B] rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-400 font-medium">Mural / Playlist:</span>
                <select
                  value={selectedPlaylistId || activePlaylist?.id || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer flex-1"
                >
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0E1422] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 rounded-xl border border-[#1E293B] bg-[#111726] text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                title="Excluir este mural"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCreatePlaylistOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Playlist</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {batchToast && (
        <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-600 text-blue-200 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{batchToast}</span>
        </div>
      )}

      {/* Empty State */}
      {playlists.length === 0 ? (
        <div className="bm-card p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#111726] border border-[#1E293B] flex items-center justify-center text-slate-400">
            <Layers className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-white">
              Nenhum mural de slides criado
            </h3>
            <p className="text-xs text-slate-400">
              Crie uma playlist para montar o mural de fotos que passará nas suas Smart TVs.
            </p>
          </div>
          <button
            onClick={() => setIsCreatePlaylistOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Mural</span>
          </button>
        </div>
      ) : activePlaylist ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main 2 Cols: Mural Gallery & Slide Sequence */}
          <div className="lg:col-span-2 space-y-4">
            {/* Top Toolbar: View switcher, Duration, Preview */}
            <div className="bm-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{activePlaylist.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                      {activePlaylist.items.length} slides
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{activePlaylist.description}</p>
                </div>

                {/* View Mode Toggle: Mural Grid vs List */}
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <div className="flex rounded-lg bg-[#07090F] p-0.5 border border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => setViewMode('mural')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                        viewMode === 'mural'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Visualização em Mural de Imagens"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Mural</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Visualização em Lista Sequencial"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Lista</span>
                    </button>
                  </div>

                  {activePlaylist.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewIndex(0);
                        setIsPreviewModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition cursor-pointer"
                      title="Pré-visualizar na TV"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver na TV</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsAddMediaModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Slide</span>
                  </button>
                </div>
              </div>

              {/* BATCH DURATION BAR (Personalize slide mural duration for all items) */}
              {activePlaylist.items.length > 0 && (
                <div className="pt-2 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Tempo em lote para todos os slides:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[5, 8, 10, 15, 30].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => handleBatchDuration(sec)}
                          className="px-2 py-0.5 rounded bg-[#101726] hover:bg-blue-600 text-slate-300 hover:text-white border border-[#1E293B] text-[11px] font-bold transition cursor-pointer"
                          title={`Aplicar ${sec} segundos a todos os slides`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    Ciclo total: <strong className="text-white">{totalDurationSeconds}s</strong>
                  </div>
                </div>
              )}
            </div>

            {/* MURAL / SLIDES VIEW */}
            {activePlaylist.items.length === 0 ? (
              <div className="bm-card p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#111726] border border-[#1E293B] flex items-center justify-center text-slate-400 mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Mural Vazio</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Este mural ainda não tem fotos ou vídeos. Adicione imagens da biblioteca para criar seu slideshow de TV.
                </p>
                <button
                  onClick={() => setIsAddMediaModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Selecionar Fotos da Biblioteca
                </button>
              </div>
            ) : viewMode === 'mural' ? (
              /* MURAL GALLERY GRID (Mural Visual de Fotos) */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {activePlaylist.items.map((item, index) => {
                  const mediaItem = media.find((m) => m.id === item.mediaId);
                  if (!mediaItem) return null;

                  return (
                    <div
                      key={item.id}
                      className="bm-card-interactive p-3 rounded-2xl flex flex-col justify-between space-y-2.5 relative group border border-[#1E293B] hover:border-blue-500/60"
                    >
                      {/* Image Thumbnail with Overlay Badges */}
                      <div 
                        onClick={() => {
                          setPreviewIndex(index);
                          setIsPreviewModalOpen(true);
                        }}
                        className="relative aspect-video rounded-xl bg-black overflow-hidden border border-[#1A2234] cursor-pointer group-hover:shadow-md transition"
                      >
                        {mediaItem.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950">
                            <Film className="w-6 h-6 text-slate-400" />
                          </div>
                        ) : (
                          <img
                            src={mediaItem.thumbnail || mediaItem.url}
                            alt={item.customTitle || mediaItem.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        {/* Slide order badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-black text-white border border-white/10 flex items-center gap-1">
                          <span>#{index + 1}</span>
                        </div>

                        {/* Quick preview icon */}
                        <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="p-2 rounded-full bg-blue-600 text-white shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </span>
                        </div>

                        {/* Duration pill overlay */}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-bold">
                          {item.durationSeconds}s
                        </div>
                      </div>

                      {/* Title & Type */}
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate" title={item.customTitle || mediaItem.title}>
                          {item.customTitle || mediaItem.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {mediaItem.type === 'video' ? 'Vídeo' : 'Imagem Slide'}
                        </span>
                      </div>

                      {/* Slide Controls: Duration & Reorder */}
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#1E293B]">
                        {/* Duration Changer */}
                        <div className="flex items-center bg-[#07090F] border border-[#1E293B] rounded-lg px-1.5 py-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateDuration(item.id, item.durationSeconds - 2)}
                            className="text-slate-400 hover:text-white px-1 font-bold cursor-pointer"
                            title="Diminuir tempo"
                          >
                            -
                          </button>
                          <span className="px-1.5 text-blue-400 font-bold text-[11px]">
                            {item.durationSeconds}s
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateDuration(item.id, item.durationSeconds + 2)}
                            className="text-slate-400 hover:text-white px-1 font-bold cursor-pointer"
                            title="Aumentar tempo"
                          >
                            +
                          </button>
                        </div>

                        {/* Reorder and Delete */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Mover para esquerda / antes"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === activePlaylist.items.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Mover para direita / depois"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remover do mural"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2">
                {activePlaylist.items.map((item, index) => {
                  const mediaItem = media.find((m) => m.id === item.mediaId);
                  if (!mediaItem) return null;

                  return (
                    <div
                      key={item.id}
                      className="bm-card-interactive p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-slate-400 font-bold w-5 text-center">
                          {index + 1}
                        </span>

                        <div className="relative w-16 h-11 rounded bg-black overflow-hidden shrink-0 border border-[#1E293B]">
                          {mediaItem.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-950">
                              <Film className="w-4 h-4 text-slate-400" />
                            </div>
                          ) : (
                            <img
                              src={mediaItem.thumbnail || mediaItem.url}
                              alt={mediaItem.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {item.customTitle || mediaItem.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {mediaItem.type === 'video' ? 'Vídeo' : 'Imagem'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Duration adjuster */}
                        <div className="flex items-center bg-[#0E1422] border border-[#1E293B] rounded px-2 py-0.5 text-xs">
                          <button
                            onClick={() => handleUpdateDuration(item.id, item.durationSeconds - 2)}
                            className="text-slate-400 hover:text-white px-1.5 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-blue-400 font-bold">
                            {item.durationSeconds}s
                          </span>
                          <button
                            onClick={() => handleUpdateDuration(item.id, item.durationSeconds + 2)}
                            className="text-slate-400 hover:text-white px-1.5 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Reorder */}
                        <div className="flex items-center">
                          <button
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === activePlaylist.items.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove item */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition cursor-pointer"
                          title="Remover slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: TV Binding & Live Player Shortcut */}
          <div className="space-y-4">
            <div className="bm-card p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <span>Vincular à Smart TV</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Selecione qual TV deve exibir este mural de slides continuamente:
              </p>

              {screens.length === 0 ? (
                <p className="text-xs text-slate-400">Cadastre uma TV na aba Telas primeiro.</p>
              ) : (
                <div className="space-y-1.5">
                  {screens.map((s) => {
                    const isLinked = s.activePlaylistId === activePlaylist.id;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                          isLinked
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-[#0E1422] border-[#1E293B] text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleAssignToScreen(s.id)}
                          className="flex items-center gap-2 truncate text-left flex-1 cursor-pointer"
                        >
                          <span className="truncate font-semibold">{s.name}</span>
                          {isLinked && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenPlayer(s.slug)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1 cursor-pointer"
                          title="Abrir reprodutor de TV desta tela"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full text-center text-xs text-rose-400 hover:text-rose-300 hover:underline py-1.5 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir este mural</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* LIVE MURAL PREVIEW MODAL */}
      {isPreviewModalOpen && resolvedSlides.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl rounded-2xl bg-[#090D18] border border-[#1E293B] shadow-2xl p-4 sm:p-6 space-y-4 flex flex-col text-slate-100 max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Pré-visualização do Mural na TV
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Slide {previewIndex + 1} de {resolvedSlides.length} • Tempo: {resolvedSlides[previewIndex]?.durationSeconds}s
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isPreviewPlaying ? 'bg-blue-600 text-white' : 'bg-[#151D30] text-slate-300'
                  }`}
                >
                  {isPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPreviewPlaying ? 'Pausar' : 'Reproduzir'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#141B2B] transition cursor-pointer"
                  aria-label="Fechar prévia"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated TV Display Frame */}
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-[#1E293B] shadow-2xl flex items-center justify-center">
              {resolvedSlides[previewIndex]?.media.type === 'video' ? (
                <video
                  src={resolvedSlides[previewIndex]?.media.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={resolvedSlides[previewIndex]?.media.thumbnail || resolvedSlides[previewIndex]?.media.url}
                  alt="Slide preview"
                  className="w-full h-full object-cover transition-all duration-500"
                />
              )}

              {/* Prev / Next overlays */}
              <button
                type="button"
                onClick={() => setPreviewIndex((prev) => (prev - 1 + resolvedSlides.length) % resolvedSlides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewIndex((prev) => (prev + 1) % resolvedSlides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Bottom slide indicator bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
                {resolvedSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === previewIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Quick slide jumper in preview */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {resolvedSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  className={`w-16 h-10 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer relative ${
                    idx === previewIndex ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-[#1E293B] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={slide.media.thumbnail || slide.media.url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 px-1 text-[8px] bg-black/80 font-bold text-white">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Media Modal */}
      {isAddMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#090D18] border border-[#1E293B] shadow-2xl p-6 sm:p-7 space-y-4 max-h-[88vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Adicionar Imagens ao Mural de Slides
                  </h3>
                  <p className="text-xs text-slate-400">
                    Clique em qualquer foto ou vídeo para inserir nesta playlist.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddMediaModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#141B2B] transition cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {media.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-[#1E293B] rounded-2xl p-6">
                  Nenhuma mídia disponível. Envie fotos ou vídeos na aba Biblioteca primeiro.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddMediaToPlaylist(item)}
                      className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] hover:border-blue-500 hover:bg-[#0D1322] cursor-pointer transition text-left group"
                    >
                      <div className="aspect-video bg-black rounded-lg mb-2 overflow-hidden relative">
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                          {item.durationDefault}s
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h5>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {item.dimensions || 'Alta Resolução'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {isCreatePlaylistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#090D18] border border-[#1E293B] shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Criar Novo Mural / Playlist
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina o nome da grade de exibição.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreatePlaylistOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#141B2B] transition cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="bm-label">
                  Nome do Mural / Playlist *
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ex: Mural Principal, Promoções do Dia, Vitrine"
                  className="bm-input"
                />
              </div>

              <div>
                <label className="bm-label">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Ex: Slideshow de fotos e vídeos dos produtos"
                  className="bm-input"
                />
              </div>

              {screens.length > 0 && (
                <div>
                  <label className="bm-label">
                    Vincular Imediatamente à Smart TV
                  </label>
                  <select
                    value={targetScreenId}
                    onChange={(e) => setTargetScreenId(e.target.value)}
                    className="bm-input"
                  >
                    <option value="">Não vincular agora</option>
                    {screens.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePlaylistOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E293B] hover:bg-[#141B2B] text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Criar Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Excluir Playlist"
        message={`Tem certeza que deseja excluir "${activePlaylist?.name}"? Esta ação removerá a grade de slides desta TV.`}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeletePlaylist}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
