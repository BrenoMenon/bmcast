import React, { useState } from 'react';
import { 
  Tv, Copy, Check, Plus, Edit2, Trash2, 
  MapPin, PlayCircle, Layout, Sparkles
} from 'lucide-react';
import { Screen, Playlist, ScreenOrientation, TVLayoutMode } from '../../types/signage';
import { storageService } from '../../services/storageService';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface ScreensManagerProps {
  screens: Screen[];
  playlists: Playlist[];
  onOpenPlayer: (slug: string) => void;
  onRefresh: () => void;
}

export const ScreensManager: React.FC<ScreensManagerProps> = ({
  screens,
  playlists,
  onOpenPlayer,
  onRefresh,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);

  // In-app delete confirmation state (no window.confirm!)
  const [screenToDelete, setScreenToDelete] = useState<Screen | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    slug: '',
    resolution: '1080p' as '1080p' | '4K' | '720p',
    orientation: 'landscape' as ScreenOrientation,
    activePlaylistId: '',
    layoutMode: 'clean_media' as TVLayoutMode,
    brandName: '',
    brandSlogan: '',
    notes: '',
  });

  const getPlayerUrl = (slug: string) => {
    if (typeof window === 'undefined') return `/play/${slug}`;
    return `${window.location.origin}/?screen=${slug}`;
  };

  const handleCopyLink = (slug: string) => {
    const url = getPlayerUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  };

  const handleOpenModal = (screenToEdit?: Screen) => {
    if (screenToEdit) {
      setEditingScreen(screenToEdit);
      setFormData({
        name: screenToEdit.name,
        location: screenToEdit.location,
        slug: screenToEdit.slug,
        resolution: screenToEdit.resolution,
        orientation: screenToEdit.orientation,
        activePlaylistId: screenToEdit.activePlaylistId,
        layoutMode: screenToEdit.layoutMode || 'clean_media',
        brandName: screenToEdit.brandName || '',
        brandSlogan: screenToEdit.brandSlogan || '',
        notes: screenToEdit.notes || '',
      });
    } else {
      setEditingScreen(null);
      setFormData({
        name: '',
        location: '',
        slug: '',
        resolution: '1080p',
        orientation: 'landscape',
        activePlaylistId: playlists[0]?.id || '',
        layoutMode: 'clean_media',
        brandName: '',
        brandSlogan: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingScreen) {
      await storageService.updateScreen({
        ...editingScreen,
        name: formData.name,
        location: formData.location,
        slug: formData.slug || editingScreen.slug,
        resolution: formData.resolution,
        orientation: formData.orientation,
        activePlaylistId: formData.activePlaylistId,
        layoutMode: formData.layoutMode,
        brandName: formData.brandName,
        brandSlogan: formData.brandSlogan,
        notes: formData.notes,
      });
    } else {
      await storageService.addScreen({
        name: formData.name,
        location: formData.location,
        slug: formData.slug,
        resolution: formData.resolution,
        orientation: formData.orientation,
        activePlaylistId: formData.activePlaylistId,
        notes: formData.notes,
      });
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!screenToDelete) return;
    setIsDeleting(true);
    const id = screenToDelete.id;
    try {
      await storageService.deleteScreen(id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setScreenToDelete(null);
      if (editingScreen?.id === id) {
        setIsModalOpen(false);
      }
      onRefresh();
    }
  };

  const getLayoutLabel = (mode?: TVLayoutMode) => {
    switch (mode) {
      case 'corporate_split':
        return 'Corporativo (75/25)';
      case 'menu_brand':
        return 'Cardápio com Marca';
      case 'promo_qr':
        return 'Promocional com QR Code';
      case 'clean_media':
      default:
        return 'Somente Imagens Limpas';
    }
  };

  return (
    <div className="space-y-5">
      {/* Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">
            Smart TVs e Terminais Conectados
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os displays do seu comércio e copie o link direto para rodar na TV.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova TV</span>
        </button>
      </div>

      {/* Empty State */}
      {screens.length === 0 ? (
        <div className="bm-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#111726] border border-[#1E293B] flex items-center justify-center text-blue-400">
            <Tv className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-bold text-white">
              Nenhuma TV cadastrada ainda
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dê um nome ao seu aparelho (ex: TV Salão ou TV Balcão) para gerar a URL de transmissão.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira TV</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((screen) => {
            const assignedPlaylist = playlists.find((p) => p.id === screen.activePlaylistId);
            const isCopied = copiedSlug === screen.slug;

            return (
              <div
                key={screen.id}
                className="bm-card-interactive p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Status row */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-emerald-400">Online</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 text-xs">{screen.resolution}</span>
                    </div>

                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-[#111726] border border-[#1E293B]">
                      {screen.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
                    </span>
                  </div>

                  {/* Device Info */}
                  <div className="py-4 space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {screen.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{screen.location}</span>
                    </div>
                  </div>

                  {/* Layout & Playlist meta */}
                  <div className="space-y-2 mb-4">
                    <div className="px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#1A2234] text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Layout Selecionado
                      </span>
                      <div className="flex items-center gap-1.5 text-blue-300 font-medium">
                        <Layout className="w-3.5 h-3.5 text-blue-400" />
                        <span>{getLayoutLabel(screen.layoutMode)}</span>
                      </div>
                    </div>

                    <div className="px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#1A2234] text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Playlist Ativa
                      </span>
                      <span className="font-medium text-slate-200 truncate block">
                        {assignedPlaylist ? assignedPlaylist.name : 'Nenhuma playlist vinculada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="pt-3 border-t border-[#1E293B] space-y-2">
                  <button
                    onClick={() => onOpenPlayer(screen.slug)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] border border-[#232F46] text-slate-200 text-xs font-semibold transition"
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Iniciar Player da TV</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(screen.slug)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                        isCopied
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-[#0E131F] hover:bg-[#141B2B] border-[#1E2738] text-slate-300'
                      }`}
                      title="Copiar URL para o navegador da Smart TV"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar Link da TV</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenModal(screen)}
                      className="p-1.5 rounded-lg border border-[#1E2738] bg-[#0E131F] text-slate-400 hover:text-white hover:bg-[#141B2B] transition"
                      title="Editar Propriedades & Layout"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setScreenToDelete(screen)}
                      className="p-1.5 rounded-lg border border-[#1E2738] bg-[#0E131F] text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Excluir TV"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastrar / Editar Tela */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bm-card w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2738]">
              <h3 className="text-sm font-bold text-white">
                {editingScreen ? 'Editar Informações & Layout da TV' : 'Cadastrar Nova Smart TV'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScreen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Dispositivo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: TV Principal Salão, Menu Balcão"
                  className="bm-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Localização *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Salão de Clientes, Parede Superior"
                  className="bm-input w-full px-3 py-2"
                />
              </div>

              {/* Layout Selector (User requirement) */}
              <div className="p-3.5 rounded-xl bg-[#0A0E17] border border-[#1A2234] space-y-2">
                <label className="block text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5" />
                  <span>Estilo de Layout da Exibição</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Escolha como a imagem e a marca da sua empresa serão exibidas na TV:
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, layoutMode: 'clean_media' })}
                    className={`p-2.5 rounded-lg border text-left text-xs transition ${
                      formData.layoutMode === 'clean_media'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                        : 'bg-[#111726] border-[#1E293B] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-bold">1. Apenas Imagens</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">100% tela cheia limpa, só a foto/vídeo da empresa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, layoutMode: 'menu_brand' })}
                    className={`p-2.5 rounded-lg border text-left text-xs transition ${
                      formData.layoutMode === 'menu_brand'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                        : 'bg-[#111726] border-[#1E293B] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-bold">2. Cardápio com Marca</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Cabeçalho com a sua logo/nome + imagens</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, layoutMode: 'corporate_split' })}
                    className={`p-2.5 rounded-lg border text-left text-xs transition ${
                      formData.layoutMode === 'corporate_split'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                        : 'bg-[#111726] border-[#1E293B] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-bold">3. Corporativo (75/25)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Slide principal + relógio, clima e letreiro rodapé</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, layoutMode: 'promo_qr' })}
                    className={`p-2.5 rounded-lg border text-left text-xs transition ${
                      formData.layoutMode === 'promo_qr'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                        : 'bg-[#111726] border-[#1E293B] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-bold">4. Promo com QR Code</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Destaque de produto + QR code para WhatsApp/Wi-Fi</span>
                  </button>
                </div>
              </div>

              {/* Brand Personalization */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Empresa / Loja
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Ex: Burger Prime, Padaria Central"
                    className="bm-input w-full px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slogan / Subtítulo da Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brandSlogan}
                    onChange={(e) => setFormData({ ...formData, brandSlogan: e.target.value })}
                    placeholder="Ex: Os melhores cortes artesanais"
                    className="bm-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Identificador de URL (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="tv-salao"
                    className="bm-input w-full px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Orientação
                  </label>
                  <select
                    value={formData.orientation}
                    onChange={(e) => setFormData({ ...formData, orientation: e.target.value as ScreenOrientation })}
                    className="bm-input w-full px-3 py-2"
                  >
                    <option value="landscape">Horizontal (16:9)</option>
                    <option value="portrait">Vertical / Totem (9:16)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resolução
                  </label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value as any })}
                    className="bm-input w-full px-3 py-2"
                  >
                    <option value="1080p">Full HD (1080p)</option>
                    <option value="4K">Ultra HD (4K)</option>
                    <option value="720p">HD (720p)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Playlist Ativa
                  </label>
                  <select
                    value={formData.activePlaylistId}
                    onChange={(e) => setFormData({ ...formData, activePlaylistId: e.target.value })}
                    className="bm-input w-full px-3 py-2"
                  >
                    <option value="">Nenhuma playlist vinculada</option>
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
                {editingScreen ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScreenToDelete(editingScreen);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir esta TV</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    {editingScreen ? 'Salvar Alterações' : 'Cadastrar TV'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app reliable delete modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(screenToDelete)}
        title="Excluir Smart TV"
        message={`Deseja realmente desvincular e excluir a tela "${screenToDelete?.name}"? Esta ação removerá o link exclusivo desta TV.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setScreenToDelete(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
