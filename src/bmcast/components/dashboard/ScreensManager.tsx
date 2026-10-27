import React, { useEffect, useState } from 'react';
import {
  Plus,
  Play,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Trash2,
  Edit2,
  Link2,
  X,
} from 'lucide-react';
import { Screen, Playlist } from '../../types/signage';
import { supabaseService } from '../../services/supabaseClient';
import { storageService } from '../../services/storageService';

interface ScreensManagerProps {
  screens: Screen[];
  playlists: Playlist[];
  onSaveScreen: (screen: Screen) => void;
  onDeleteScreen: (screenId: string) => void;
  onLaunchPlayer: (slug: string) => void;
  autoOpenCreateTrigger?: number | undefined;
}

const sanitizeShortSlug = (raw: string): string =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 14);

export const ScreensManager: React.FC<ScreensManagerProps> = ({
  screens,
  playlists,
  onSaveScreen,
  onDeleteScreen,
  onLaunchPlayer,
  autoOpenCreateTrigger,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [shortSlug, setShortSlug] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [location, setLocation] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [activePlaylistId, setActivePlaylistId] = useState('');

  const hostDisplay =
    typeof window !== 'undefined' ? window.location.host : 'seusite.com';

  const handleOpenModal = async (screen?: Screen) => {
    if (screen) {
      setEditingScreen(screen);
      setName(screen.name);
      setShortSlug(screen.slug);
      setPairingCode((screen.pairingCode || '').replace(/\D/g, '').slice(0, 4) || '1024');
      setLocation(screen.location);
      setOrientation(screen.orientation);
      setActivePlaylistId(screen.activePlaylistId);
      setIsModalOpen(true);
    } else {
      setEditingScreen(null);
      setName('');
      setLocation('');
      setOrientation('landscape');
      setActivePlaylistId(playlists[0]?.id || 'default');
      const generated = await storageService.generateUniqueShortSlug('tv');
      setShortSlug(generated.slug);
      setPairingCode(generated.pairingCode);
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (autoOpenCreateTrigger && autoOpenCreateTrigger > 0) {
      void handleOpenModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreateTrigger]);

  const handleSave = async () => {
    if (!name.trim()) return;

    let cleanSlug = sanitizeShortSlug(shortSlug);
    let cleanCode = pairingCode.replace(/\D/g, '').slice(0, 4);

    if (!cleanSlug || !cleanCode) {
      const generated = await storageService.generateUniqueShortSlug('tv');
      if (!cleanSlug) cleanSlug = generated.slug;
      if (!cleanCode) cleanCode = generated.pairingCode;
    }

    const duplicateOther = screens.some(
      (s) => s.id !== editingScreen?.id && s.slug.toLowerCase() === cleanSlug.toLowerCase()
    );
    if (duplicateOther) {
      const generated = await storageService.generateUniqueShortSlug(cleanSlug);
      cleanSlug = generated.slug;
    }

    const screenData: Screen = {
      id: editingScreen?.id || `screen-${Date.now()}`,
      name: name.trim(),
      slug: cleanSlug,
      location: location.trim() || 'Principal',
      orientation,
      aspectRatio: orientation === 'landscape' ? '16:9' : '9:16',
      resolution: editingScreen?.resolution || '1080p',
      status: 'online',
      activePlaylistId: activePlaylistId || playlists[0]?.id || 'default',
      lastPing: new Date().toISOString(),
      pairedAt: editingScreen?.pairedAt || new Date().toISOString(),
      pairingCode: cleanCode,
    };

    onSaveScreen(screenData);
    setIsModalOpen(false);
  };

  const handleCopyLink = (id: string, slug: string) => {
    const url = supabaseService.buildScreenShareUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Monitores e Telas Conectadas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Links curtos sem símbolos para digitar rápido no controle da Smart TV
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex h-10 sm:h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-2xl sm:rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Cadastrar Nova TV</span>
        </button>
      </div>

      {screens.length === 0 ? (
        <div className="rounded-3xl sm:rounded-[2rem] border border-dashed border-border bg-card p-8 sm:p-10 text-center space-y-3 shadow-xs">
          <p className="text-xs text-muted-foreground">Nenhuma TV cadastrada ainda.</p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cadastrar Primeira TV</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((sc) => {
            const isLandscape = sc.orientation === 'landscape';
            const activePlaylist = playlists.find((p) => p.id === sc.activePlaylistId);
            const numericCode = (sc.pairingCode || '').replace(/\D/g, '').slice(0, 4) || sc.slug;
            const shortReadableUrl = `${hostDisplay}/${sc.slug}`;

            return (
              <div
                key={sc.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs hover:border-primary/45 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                      {isLandscape ? (
                        <Monitor className="h-4 w-4" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {sc.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {sc.location} · {isLandscape ? '16:9 Horizontal' : '9:16 Vertical'}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Ativa</span>
                  </span>
                </div>

                {/* Simplified Short TV Link + 4-Digit Numeric Code */}
                <div className="rounded-2xl border border-border bg-muted/45 p-3.5 space-y-2.5 text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Link2 className="h-3 w-3 text-primary" />
                      <span>Link curto para digitar na TV:</span>
                    </span>
                    <div className="mt-1 truncate font-mono text-xs sm:text-sm font-bold text-primary">
                      {shortReadableUrl}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border/80 pt-2.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Código Rápido TV</span>
                      <div className="mt-0.5 font-mono text-sm font-extrabold tracking-widest text-foreground">
                        {numericCode}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Slides na Grade</span>
                      <div className="mt-0.5 truncate font-semibold text-foreground">
                        {activePlaylist?.items.length || 0} slides
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(sc.id, sc.slug)}
                    className="flex flex-1 h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/60 px-2.5 sm:px-3 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer whitespace-nowrap min-w-0"
                  >
                    {copiedId === sc.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-bold text-primary">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">Copiar Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchPlayer(sc.slug)}
                    className="flex flex-1 h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 sm:px-3.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer whitespace-nowrap min-w-0"
                  >
                    <Play className="h-3 w-3 fill-current shrink-0" />
                    <span className="truncate">Abrir TV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenModal(sc)}
                    className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-foreground hover:bg-muted transition cursor-pointer shrink-0"
                    title="Editar TV e Link Curto"
                    aria-label="Editar TV"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {screens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteScreen(sc.id)}
                      className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition cursor-pointer shrink-0"
                      title="Excluir"
                      aria-label="Excluir TV"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create TV Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-[2rem] border border-border bg-card p-5 sm:p-6 text-card-foreground space-y-4 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold tracking-tight text-foreground">
                {editingScreen ? 'Configurar TV e Link Curto' : 'Cadastrar Nova TV'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Nome da Tela
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TV Balcão"
                  className="w-full rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Atalho Curto da TV (fácil de digitar no controle)
                </label>
                <div className="flex items-center rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 focus-within:border-primary focus-within:bg-card transition">
                  <span className="max-w-[52%] truncate text-xs text-muted-foreground select-none mr-0.5">
                    {hostDisplay}/
                  </span>
                  <input
                    type="text"
                    value={shortSlug}
                    onChange={(e) => setShortSlug(sanitizeShortSlug(e.target.value))}
                    placeholder="tv1"
                    className="min-w-0 flex-1 bg-transparent font-mono text-base sm:text-xs font-bold text-primary focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Use apenas letras ou números curtos (ex: <strong>tv1</strong>, <strong>loja</strong>, <strong>sala</strong>). Código numérico:{' '}
                  <strong className="font-mono text-foreground">{pairingCode}</strong>
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Ambiente / Localização
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Salão Principal"
                  className="w-full rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Orientação da TV
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                      orientation === 'landscape'
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    16:9 Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                      orientation === 'portrait'
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    9:16 Vertical
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Grade Vinculada
                </label>
                <select
                  value={activePlaylistId}
                  onChange={(e) => setActivePlaylistId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base sm:text-xs text-foreground focus:border-primary focus:bg-card focus:outline-none transition"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id} className="bg-card text-foreground">
                      {pl.name} ({pl.items.length} slides)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border pt-3.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-initial rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer"
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
