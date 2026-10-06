import React, { useState, useMemo } from 'react';
import { 
  Layers, Plus, Trash2, ArrowUp, ArrowDown, 
  Clock, Tv, Check, Film, Image as ImageIcon
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
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);

  // In-app delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [targetScreenId, setTargetScreenId] = useState(screens[0]?.id || '');

  const activePlaylist = useMemo(() => {
    return playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  }, [playlists, selectedPlaylistId]);

  const totalDurationSeconds = useMemo(() => {
    if (!activePlaylist) return 0;
    return activePlaylist.items.reduce((acc, item) => acc + (item.durationSeconds || 10), 0);
  }, [activePlaylist]);

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
      description: newPlaylistDesc || 'Grade de exibição sequencial',
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

  // 100% reliable delete without window.confirm
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
          <h2 className="text-base font-bold text-white">
            Montagem de Playlists e Ordem da TV
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina a ordem dos slides e o tempo em segundos que cada imagem ou vídeo fica na tela.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {playlists.length > 0 && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-[#111726] border border-[#1E293B] rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-400 font-medium">Playlist:</span>
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
                className="p-2 rounded-xl border border-[#1E293B] bg-[#111726] text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                title="Excluir esta playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCreatePlaylistOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Playlist</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {playlists.length === 0 ? (
        <div className="bm-card p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#111726] border border-[#1E293B] flex items-center justify-center text-slate-400">
            <Layers className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-white">
              Nenhuma playlist criada
            </h3>
            <p className="text-xs text-slate-400">
              Crie uma playlist para organizar as fotos e vídeos que passarão nas suas Smart TVs.
            </p>
          </div>
          <button
            onClick={() => setIsCreatePlaylistOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeira Playlist</span>
          </button>
        </div>
      ) : activePlaylist ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main 2 Cols: Timeline sequence */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bm-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">{activePlaylist.name}</h3>
                <p className="text-xs text-slate-400">{activePlaylist.description}</p>
              </div>

              {/* REFINED MODERN TYPOGRAPHY FOR CICLO (Fixes Image 1 font issue!) */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1422] border border-[#1E293B] text-xs text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Duração do Ciclo: <strong className="text-white font-semibold">{totalDurationSeconds}s</strong> ({activePlaylist.items.length} slides)</span>
                </div>

                <button
                  onClick={() => setIsAddMediaModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-blue-300 hover:text-white border border-[#232F46] text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Slide</span>
                </button>
              </div>
            </div>

            {/* Sequence list */}
            {activePlaylist.items.length === 0 ? (
              <div className="bm-card p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Esta playlist ainda não contém mídias vinculadas.
                </p>
                <button
                  onClick={() => setIsAddMediaModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Selecionar da Biblioteca
                </button>
              </div>
            ) : (
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
                            className="text-slate-400 hover:text-white px-1.5 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-blue-400 font-bold">
                            {item.durationSeconds}s
                          </span>
                          <button
                            onClick={() => handleUpdateDuration(item.id, item.durationSeconds + 2)}
                            className="text-slate-400 hover:text-white px-1.5 font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Reorder */}
                        <div className="flex items-center">
                          <button
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === activePlaylist.items.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove item guaranteed */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
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

          {/* Right Column: TV Binding */}
          <div className="space-y-4">
            <div className="bm-card p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <span>Vincular à Smart TV</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Selecione qual TV deve exibir esta playlist continuamente:
              </p>

              {screens.length === 0 ? (
                <p className="text-xs text-slate-400">Cadastre uma TV na aba Telas primeiro.</p>
              ) : (
                <div className="space-y-1.5">
                  {screens.map((s) => {
                    const isLinked = s.activePlaylistId === activePlaylist.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleAssignToScreen(s.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition ${
                          isLinked
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-[#0E1422] border-[#1E293B] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        {isLinked && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full text-center text-xs text-rose-400 hover:text-rose-300 hover:underline py-1.5 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir esta playlist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Select Media Modal */}
      {isAddMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bm-card w-full max-w-2xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <h3 className="text-sm font-bold text-white">
                Escolher Mídia para Adicionar à Playlist
              </h3>
              <button
                onClick={() => setIsAddMediaModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {media.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma mídia disponível. Envie fotos ou vídeos na aba Biblioteca primeiro.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddMediaToPlaylist(item)}
                      className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B] hover:border-blue-500 cursor-pointer transition text-left"
                    >
                      <div className="aspect-video bg-black rounded mb-2 overflow-hidden">
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                      <span className="text-[11px] text-slate-400">Duração: {item.durationDefault}s</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bm-card w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <h3 className="text-sm font-bold text-white">Criar Nova Playlist</h3>
              <button
                onClick={() => setIsCreatePlaylistOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Playlist *
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ex: Grade Almoço, Destaques da Semana"
                  className="bm-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Ex: Fotos de cardápio e combos com preços"
                  className="bm-input w-full px-3 py-2"
                />
              </div>

              {screens.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vincular à TV
                  </label>
                  <select
                    value={targetScreenId}
                    onChange={(e) => setTargetScreenId(e.target.value)}
                    className="bm-input w-full px-3 py-2"
                  >
                    <option value="">Não vincular agora</option>
                    {screens.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsCreatePlaylistOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Criar Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reliable In-app delete playlist modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Excluir Playlist"
        message={`Tem certeza que deseja excluir a playlist "${activePlaylist?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDeletePlaylist}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
