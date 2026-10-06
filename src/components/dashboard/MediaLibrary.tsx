import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Plus, Trash2, Eye, Link as LinkIcon, 
  Film, Image as ImageIcon, Layout, Sparkles, Check,
  Store, AlertCircle, Palette
} from 'lucide-react';
import { MediaItem, MediaType } from '../../types/signage';
import { storageService } from '../../services/storageService';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { BrandLayoutCustomizerModal, PRESET_TEMPLATES, LayoutTemplate } from './BrandLayoutCustomizerModal';

interface MediaLibraryProps {
  media: MediaItem[];
  onRefresh: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ media, onRefresh }) => {
  const [activeView, setActiveView] = useState<'images' | 'templates'>('images');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reliable delete modal state
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Brand layout customizer modal
  const [customizerOpen, setCustomizerOpen] = useState<boolean>(false);
  const [selectedTemplateForCustomizer, setSelectedTemplateForCustomizer] = useState<LayoutTemplate>(PRESET_TEMPLATES[0]);

  const [urlForm, setUrlForm] = useState({
    title: '',
    url: '',
    type: 'image' as MediaType,
    durationDefault: 10,
    category: 'promo' as 'promo' | 'cardapio' | 'aviso' | 'institucional',
  });

  const filteredMedia = media.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isImage && !isVideo) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        await storageService.addMedia({
          title: file.name.replace(/\.[^/.]+$/, ''),
          type: isVideo ? 'video' : 'image',
          url: base64Url,
          thumbnail: isImage ? base64Url : undefined,
          durationDefault: isVideo ? 15 : 10,
          category: 'promo',
          dimensions: isVideo ? 'Vídeo HD' : 'Imagem HD',
          fileSize: fileSizeMB,
        });

        onRefresh();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSaveUrlMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlForm.title.trim() || !urlForm.url.trim()) return;

    await storageService.addMedia({
      title: urlForm.title,
      type: urlForm.type,
      url: urlForm.url,
      thumbnail: urlForm.type === 'image' ? urlForm.url : undefined,
      durationDefault: Number(urlForm.durationDefault) || 10,
      category: urlForm.category,
      dimensions: 'Link Externo',
      fileSize: 'Cloud URL',
    });

    setIsUrlModalOpen(false);
    setUrlForm({
      title: '',
      url: '',
      type: 'image',
      durationDefault: 10,
      category: 'promo',
    });
    onRefresh();
  };

  // 100% working delete function
  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;
    setIsDeleting(true);
    const idToDelete = mediaToDelete.id;
    try {
      await storageService.deleteMedia(idToDelete);
      if (previewMedia?.id === idToDelete) {
        setPreviewMedia(null);
      }
    } finally {
      setIsDeleting(false);
      setMediaToDelete(null);
      onRefresh();
    }
  };

  const handleOpenCustomizer = (tpl: LayoutTemplate) => {
    setSelectedTemplateForCustomizer(tpl);
    setCustomizerOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">
            Biblioteca Visual & Criação de Layouts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Exiba suas fotos limpas ou escolha modelos prontos para personalizar com o nome da sua marca.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Main View Toggle: Imagens vs Ideias de Layouts */}
          <div className="flex items-center bg-[#0E131F] border border-[#1E293B] rounded-xl p-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('images')}
              className={`flex-1 sm:flex-initial justify-center px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'images'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Fotos & Vídeos ({media.length})</span>
            </button>

            <button
              onClick={() => setActiveView('templates')}
              className={`flex-1 sm:flex-initial justify-center px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'templates'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Modelos da Marca</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCustomizer(PRESET_TEMPLATES[0])}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold transition"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Personalizar Marca</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: IDEIAS DE LAYOUTS PARA A EMPRESA PERSONALIZAR */}
      {activeView === 'templates' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-400" />
                <span>Modelos Profissionais de Layouts de Sinalização</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Escolha qualquer modelo abaixo. Você pode editar o nome da sua empresa, colocar seus pratos, produtos, preços e salvar diretamente como imagem para passar na Smart TV.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="bm-card p-5 space-y-3.5 flex flex-col justify-between hover:border-blue-500/60 transition group"
              >
                <div className="space-y-2.5">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/40">
                      {tpl.category}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Proporção 16:9 Full HD
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                    {tpl.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tpl.description}
                  </p>

                  {/* Mock Preview Frame */}
                  <div className="aspect-video w-full rounded-lg bg-black/80 border border-slate-800 p-3 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ backgroundColor: tpl.defaultAccent }}
                          className="w-2 h-2 rounded-full"
                        />
                        <span className="text-[10px] font-bold text-white uppercase truncate">
                          {tpl.placeholderBrand}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400">12:30</span>
                    </div>

                    <div className="space-y-1.5 py-1">
                      <div className="flex items-center justify-between text-[10px] p-1.5 rounded bg-slate-900/50 border border-slate-800">
                        <span className="text-slate-300">Item / Produto</span>
                        <span className="text-emerald-400 font-bold shrink-0 ml-1">R$ 0,00</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] p-1.5 rounded bg-slate-900/50 border border-slate-800">
                        <span className="text-slate-300">Item / Produto</span>
                        <span className="text-emerald-400 font-bold shrink-0 ml-1">R$ 0,00</span>
                      </div>
                    </div>

                    <div className="text-[8px] text-slate-500 border-t border-slate-800 pt-1 truncate">
                      📢 Avisos aos clientes • WhatsApp & Redes Sociais
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end">
                  <button
                    onClick={() => handleOpenCustomizer(tpl)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Personalizar com Minha Marca</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SOMENTE AS IMAGENS LIMPAS (SEM POLUIÇÃO) */}
      {activeView === 'images' && (
        <div className="space-y-5 animate-fade-in">
          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bm-card p-6 border-2 border-dashed transition-all cursor-pointer text-center ${
              isDragging
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-slate-800 hover:border-blue-500/80 bg-[#0A0D15]'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-900/40 flex items-center justify-center text-blue-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">
                  Arraste e solte fotos ou vídeos aqui (ou clique para buscar)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Suporta PNG, JPG, WEBP e MP4 em alta definição. Sincronizado instantaneamente.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUrlModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-semibold border border-[#232F46] transition flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                  <span>Adicionar por URL Externa</span>
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Subheader Filters */}
          <div className="flex items-center justify-between gap-4 border-b border-[#1E293B] pb-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({media.length})
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  filterType === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Imagens ({media.filter((m) => m.type === 'image').length})
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  filterType === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vídeos ({media.filter((m) => m.type === 'video').length})
              </button>
            </div>

            <span className="text-slate-400 text-xs">
              {filteredMedia.length} arquivos salvos
            </span>
          </div>

          {/* Empty State */}
          {media.length === 0 ? (
            <div className="bm-card p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#111726] border border-[#1E293B] flex items-center justify-center text-slate-400">
                <ImageIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-white">
                  Nenhuma imagem ou vídeo salvo ainda
                </h3>
                <p className="text-xs text-slate-400">
                  Faça upload de fotos do seu comércio ou escolha um dos nossos modelos prontos de layouts.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Fazer Upload de Foto
                </button>
                <button
                  onClick={() => setActiveView('templates')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-blue-300 text-xs font-semibold border border-[#232F46]"
                >
                  Ver Modelos com Minha Marca
                </button>
              </div>
            </div>
          ) : (
            /* PURE IMAGE CARDS (Clean Visual Grid) */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="bm-card-interactive overflow-hidden flex flex-col justify-between group"
                >
                  {/* Aspect Video Image Preview */}
                  <div
                    onClick={() => setPreviewMedia(item)}
                    className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-950">
                        <video src={item.url} muted className="w-full h-full object-cover" />
                        <Film className="w-6 h-6 text-slate-400 absolute" />
                      </div>
                    ) : (
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Duration badge */}
                    <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-[11px] font-bold text-white shadow">
                      {item.durationDefault}s
                    </span>
                  </div>

                  {/* Clean bottom information & guaranteed working delete button */}
                  <div className="p-3">
                    <h4
                      className="text-xs font-bold text-white truncate cursor-pointer hover:text-blue-300"
                      title={item.title}
                      onClick={() => setPreviewMedia(item)}
                    >
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{item.type === 'video' ? 'Vídeo' : 'Imagem'}</span>
                      <span>·</span>
                      <span>{item.fileSize || 'Alta Definição'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#1E293B]">
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Imagem</span>
                      </button>

                      {/* Working delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMediaToDelete(item);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Excluir Mídia Permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* URL Import Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bm-card w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <h3 className="text-sm font-bold text-white">
                Adicionar Mídia por URL
              </h3>
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUrlMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título Identificador *
                </label>
                <input
                  type="text"
                  required
                  value={urlForm.title}
                  onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                  placeholder="Ex: Foto Prato Especial, Promoção"
                  className="bm-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Direta da Imagem ou Vídeo (HTTPS) *
                </label>
                <input
                  type="url"
                  required
                  value={urlForm.url}
                  onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="bm-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={urlForm.type}
                    onChange={(e) => setUrlForm({ ...urlForm, type: e.target.value as MediaType })}
                    className="bm-input w-full px-3 py-2 text-xs"
                  >
                    <option value="image">Imagem Estática</option>
                    <option value="video">Vídeo (MP4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duração Padrão (segundos)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="180"
                    value={urlForm.durationDefault}
                    onChange={(e) => setUrlForm({ ...urlForm, durationDefault: Number(e.target.value) })}
                    className="bm-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Salvar Mídia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal with Direct Delete Option */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bm-card w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3.5 border-b border-[#1E293B] bg-[#0E131F]">
              <span className="text-xs font-bold text-white truncate max-w-md">
                {previewMedia.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const item = previewMedia;
                    setPreviewMedia(null);
                    setMediaToDelete(item);
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 transition"
                  title="Excluir Mídia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Mídia</span>
                </button>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="text-xs px-2.5 py-1 rounded bg-[#141B2B] text-slate-300 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              {previewMedia.type === 'video' ? (
                <video src={previewMedia.url} controls autoPlay className="max-h-[65vh] w-auto" />
              ) : (
                <img src={previewMedia.url} alt={previewMedia.title} className="max-h-[65vh] w-auto object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Brand Layout Customizer Modal */}
      <BrandLayoutCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        onSuccess={() => {
          setActiveView('images');
          onRefresh();
        }}
        initialTemplate={selectedTemplateForCustomizer}
      />

      {/* Reliable in-app delete modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(mediaToDelete)}
        title="Excluir Mídia"
        message={`Deseja realmente remover o arquivo "${mediaToDelete?.title}" da biblioteca? Ele será desvinculado de todas as playlists.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMediaToDelete(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
