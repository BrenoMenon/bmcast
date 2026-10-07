import React, { useState } from 'react';
import {
  Plus,
  Play,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Trash2,
  Edit2,
  Wifi,
} from 'lucide-react';
import { Screen, Playlist } from '../../types/signage';

interface ScreensManagerProps {
  screens: Screen[];
  playlists: Playlist[];
  onSaveScreen: (screen: Screen) => void;
  onDeleteScreen: (screenId: string) => void;
  onLaunchPlayer: (slug: string) => void;
}

export const ScreensManager: React.FC<ScreensManagerProps> = ({
  screens,
  playlists,
  onSaveScreen,
  onDeleteScreen,
  onLaunchPlayer,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [activePlaylistId, setActivePlaylistId] = useState('');

  const handleOpenModal = (screen?: Screen) => {
    if (screen) {
      setEditingScreen(screen);
      setName(screen.name);
      setLocation(screen.location);
      setOrientation(screen.orientation);
      setActivePlaylistId(screen.activePlaylistId);
    } else {
      setEditingScreen(null);
      setName('');
      setLocation('');
      setOrientation('landscape');
      setActivePlaylistId(playlists[0]?.id || 'default');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const slug =
      editingScreen?.slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') ||
      `tv-${Date.now()}`;

    const screenData: Screen = {
      id: editingScreen?.id || `screen-${Date.now()}`,
      name: name.trim(),
      slug,
      location: location.trim() || 'Principal',
      orientation,
      aspectRatio: orientation === 'landscape' ? '16:9' : '9:16',
      resolution: editingScreen?.resolution || '1080p',
      status: 'online',
      activePlaylistId: activePlaylistId || playlists[0]?.id || 'default',
      lastPing: new Date().toISOString(),
      pairedAt: editingScreen?.pairedAt || new Date().toISOString(),
      pairingCode: editingScreen?.pairingCode || `TV-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onSaveScreen(screenData);
    setIsModalOpen(false);
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}?screen=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Subheader & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Monitores e Telas Conectadas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie múltiplos displays, links diretos e orientações (16:9 Horizontal / 9:16 Vertical)
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova TV</span>
        </button>
      </div>

      {/* Screens Grid */}
      {screens.length === 0 ? (
        <div className="p-10 text-center bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl space-y-3">
          <p className="text-xs text-slate-400">Nenhuma TV cadastrada ainda.</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Primeira TV</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((sc) => {
            const isLandscape = sc.orientation === 'landscape';
            const activePlaylist = playlists.find((p) => p.id === sc.activePlaylistId);

            return (
              <div
                key={sc.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4 transition-all hover:border-blue-500/50 shadow-sm flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-blue-400">
                      {isLandscape ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xs sm:text-sm">{sc.name}</h3>
                      <p className="text-[11px] text-slate-400">{sc.location}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] font-semibold text-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>Conectada</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Formato:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {isLandscape ? '16:9 Horizontal' : '9:16 Vertical'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Pareamento:</span>
                    <div className="font-bold text-white mt-0.5">
                      {sc.pairingCode || 'TV-1001'}
                    </div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-400 text-[10px]">Programação:</span>
                    <div className="font-semibold text-slate-200 mt-0.5 truncate">
                      {activePlaylist?.name || 'Padrão'} ({activePlaylist?.items.length || 0} slides)
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopyLink(sc.slug)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-full border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copiedSlug === sc.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-400 font-bold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onLaunchPlayer(sc.slug)}
                    className="flex-1 py-2 px-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Abrir TV</span>
                  </button>

                  <button
                    onClick={() => handleOpenModal(sc)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {screens.length > 1 && (
                    <button
                      onClick={() => onDeleteScreen(sc.id)}
                      className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full border border-slate-700 hover:border-red-500/40 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {editingScreen ? 'Editar Configurações da TV' : 'Cadastrar Nova TV'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Nome da Tela
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TV Principal - Salão"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Recepção / Balcão"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Orientação da TV
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    16:9 Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    9:16 Vertical
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Programação Vinculada
                </label>
                <select
                  value={activePlaylistId}
                  onChange={(e) => setActivePlaylistId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id} className="bg-slate-900">
                      {pl.name} ({pl.items.length} slides)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
              >
                Salvar TV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
