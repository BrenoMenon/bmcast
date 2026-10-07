import React, { useState } from 'react';
import {
  Monitor,
  Plus,
  Play,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tv,
} from 'lucide-react';
import { Screen, Playlist, ScreenOrientation } from '../../types/signage';
import { useTheme } from '../../context/ThemeContext';

interface ScreensManagerProps {
  screens: Screen[];
  playlists: Playlist[];
  onSaveScreen: (screen: Screen) => void;
  onDeleteScreen: (id: string) => void;
  onLaunchPlayer: (slug: string) => void;
}

export const ScreensManager: React.FC<ScreensManagerProps> = ({
  screens,
  playlists,
  onSaveScreen,
  onDeleteScreen,
  onLaunchPlayer,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [orientation, setOrientation] = useState<ScreenOrientation>('landscape');
  const [activePlaylistId, setActivePlaylistId] = useState(playlists[0]?.id || '');

  const handleOpenModal = (sc?: Screen) => {
    if (sc) {
      setEditingScreen(sc);
      setName(sc.name);
      setLocation(sc.location);
      setOrientation(sc.orientation);
      setActivePlaylistId(sc.activePlaylistId);
    } else {
      setEditingScreen(null);
      setName(`TV Sala ${screens.length + 1}`);
      setLocation('Salão Principal');
      setOrientation('landscape');
      setActivePlaylistId(playlists[0]?.id || '');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `tv-${Date.now()}`;

    const sc: Screen = {
      id: editingScreen?.id || `scr-${Date.now()}`,
      name: name.trim() || 'TV Conectada',
      location: location.trim() || 'Principal',
      slug: editingScreen?.slug || slugBase,
      pairingCode: editingScreen?.pairingCode || `TV-${Math.floor(1000 + Math.random() * 9000)}`,
      activePlaylistId: activePlaylistId || playlists[0]?.id || '',
      status: 'online',
      resolution: '1080p',
      orientation,
      aspectRatio: orientation === 'landscape' ? '16:9' : '9:16',
      lastPing: new Date().toISOString(),
      pairedAt: editingScreen?.pairedAt || new Date().toISOString(),
    };

    onSaveScreen(sc);
    setIsModalOpen(false);
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}?screen=${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
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
            Monitores & Telas Conectadas
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Gerencie aparelhos de TV, Smart TVs ou computadores vinculados à transmissão
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Conectar Nova TV</span>
        </button>
      </div>

      {/* Screen Cards Grid */}
      {screens.length === 0 ? (
        <div
          className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${
            isDark
              ? 'bg-[#131b2e] border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-500 shadow-xs'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Nenhuma tela configurada
            </h3>
            <p className="text-xs max-w-sm mx-auto mt-1">
              Adicione uma tela para gerar o link e o código de pareamento para sua Smart TV ou computador.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
            >
              Conectar Primeira TV
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((sc) => {
            const isLandscape = sc.orientation === 'landscape';
            const activePlaylist = playlists.find((p) => p.id === sc.activePlaylistId);

            return (
              <div
                key={sc.id}
                className={`border rounded-2xl p-4 space-y-3.5 transition-all shadow-xs ${
                  isDark
                    ? 'bg-[#131b2e] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-[#0b1120] border-slate-800 text-sky-400' : 'bg-slate-50 border-slate-200 text-sky-600'
                      }`}
                    >
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-xs sm:text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {sc.name}
                      </h3>
                      <div className="text-[11px] text-slate-400">{sc.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Conectada</span>
                  </div>
                </div>

                {/* Specs */}
                <div
                  className={`grid grid-cols-2 gap-2 p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-[#0b1120] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-slate-400 text-[10px]">Formato:</span>
                    <div className={`font-semibold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {isLandscape ? '16:9 Horizontal' : '9:16 Vertical'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Pareamento:</span>
                    <div className={`font-bold mt-0.5 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {sc.pairingCode || 'TV-1001'}
                    </div>
                  </div>
                  <div className={`col-span-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="text-slate-400 text-[10px]">Programação:</span>
                    <div className={`font-semibold mt-0.5 truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {activePlaylist?.name || 'Principal'} ({activePlaylist?.items.length || 0} slides)
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopyLink(sc.slug)}
                    className={`flex-1 py-2 px-3 border text-xs font-semibold rounded-full transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDark
                        ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    {copiedSlug === sc.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-sky-500" />
                        <span className="text-sky-600 dark:text-sky-400 font-bold">Copiado</span>
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
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Abrir TV</span>
                  </button>

                  <button
                    onClick={() => handleOpenModal(sc)}
                    className={`p-2 border rounded-full transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteScreen(sc.id)}
                    className={`p-2 border rounded-full transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#152033] hover:bg-rose-500/10 border-slate-700 text-slate-400 hover:text-rose-400'
                        : 'bg-slate-50 hover:bg-rose-50 border-slate-300 text-slate-500 hover:text-rose-600'
                    }`}
                    title="Excluir TV"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border transition-colors ${
              isDark
                ? 'bg-[#0f172a] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingScreen ? 'Editar Configurações da TV' : 'Conectar Nova TV'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nome da Tela
                </label>
                <div className="p-0.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: TV Principal - Salão"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-colors focus:outline-none focus:border-sky-500 ${
                      isDark
                        ? 'bg-[#0b1120] border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Localização
                </label>
                <div className="p-0.5">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Balcão / Recepção"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-colors focus:outline-none focus:border-sky-500 ${
                      isDark
                        ? 'bg-[#0b1120] border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Orientação da TV
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : isDark
                        ? 'bg-[#0b1120] text-slate-400 border-slate-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    16:9 Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : isDark
                        ? 'bg-[#0b1120] text-slate-400 border-slate-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    9:16 Vertical
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Programação Vinculada
                </label>
                <select
                  value={activePlaylistId}
                  onChange={(e) => setActivePlaylistId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-colors ${
                    isDark
                      ? 'bg-[#0b1120] border-slate-700 text-white focus:border-sky-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                  }`}
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id} className={isDark ? 'bg-[#0f172a]' : 'bg-white'}>
                      {pl.name} ({pl.items.length} slides)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
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
