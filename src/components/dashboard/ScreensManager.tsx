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
      activePlaylistId: activePlaylistId || playlists[0]?.id || 'default',
      isOnline: true,
      lastPing: new Date().toISOString(),
      pairingCode: editingScreen?.pairingCode || `BM-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onSaveScreen(screenData);
    setIsModalOpen(false);
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/tv/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Subheader & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#25334a]">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Monitores e Telas Conectadas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie múltiplos displays, links diretos e orientações (16:9 / 9:16)
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-95 text-[#042f2e] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Conectar Nova TV</span>
        </button>
      </div>

      {/* Screens Grid */}
      {screens.length === 0 ? (
        <div className="p-10 text-center bg-[#151f32] border border-dashed border-[#25334a] rounded-3xl">
          <p className="text-xs text-slate-400">Nenhuma tela cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((sc) => {
            const isLandscape = sc.orientation === 'landscape';
            const activePlaylist = playlists.find((p) => p.id === sc.activePlaylistId);

            return (
              <div
                key={sc.id}
                className="bg-[#151f32] border border-[#25334a] rounded-2xl p-4 sm:p-5 space-y-4 transition-all hover:border-[#384b6c] shadow-sm flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#0d131f] border border-[#25334a] text-[#2dd4bf]">
                      {isLandscape ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xs sm:text-sm">{sc.name}</h3>
                      <p className="text-[11px] text-slate-400">{sc.location}</p>
                    </div>
                  </div>

                  {/* Clean Status Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2dd4bf]/10 border border-[#2dd4bf]/25 text-[11px] font-semibold text-[#2dd4bf]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]"></span>
                    <span>Conectada</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#0d131f] rounded-xl border border-[#25334a] text-xs">
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
                  <div className="col-span-2 pt-2 border-t border-[#25334a]">
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
                    className="flex-1 py-2 px-3.5 bg-[#1e293b] hover:bg-[#27364d] text-slate-200 hover:text-white text-xs font-semibold rounded-full border border-[#2d3d57] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copiedSlug === sc.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2dd4bf]" />
                        <span className="text-[#2dd4bf] font-bold">Copiado</span>
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
                    className="flex-1 py-2 px-3.5 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-95 text-[#042f2e] text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Abrir TV</span>
                  </button>

                  <button
                    onClick={() => handleOpenModal(sc)}
                    className="p-2 bg-[#1e293b] hover:bg-[#27364d] text-slate-300 hover:text-white rounded-full border border-[#2d3d57] transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {screens.length > 1 && (
                    <button
                      onClick={() => onDeleteScreen(sc.id)}
                      className="p-2 bg-[#1e293b] hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full border border-[#2d3d57] hover:border-red-500/40 transition-colors cursor-pointer"
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
          <div className="w-full max-w-sm bg-[#151f32] border border-[#25334a] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {editingScreen ? 'Editar Configurações da TV' : 'Conectar Nova TV'}
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
                  className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
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
                        ? 'bg-[#2dd4bf] text-[#042f2e] border-[#2dd4bf] shadow-sm'
                        : 'bg-[#0d131f] text-slate-400 border-[#25334a]'
                    }`}
                  >
                    16:9 Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-[#2dd4bf] text-[#042f2e] border-[#2dd4bf] shadow-sm'
                        : 'bg-[#0d131f] text-slate-400 border-[#25334a]'
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
                  className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#25334a] rounded-xl text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id} className="bg-[#151f32]">
                      {pl.name} ({pl.items.length} slides)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#25334a] flex items-center justify-end gap-2.5">
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
                className="px-5 py-2 bg-[#2dd4bf] hover:bg-[#20b8a4] text-[#042f2e] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
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
