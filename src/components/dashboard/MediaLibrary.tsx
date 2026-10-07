import React, { useState, useRef } from 'react';
import {
  Upload,
  Plus,
  Search,
  Edit3,
  Trash2,
  FolderOpen,
  Link as LinkIcon,
  Check,
  X,
} from 'lucide-react';
import { MediaItem, SlideCategoryType } from '../../types/signage';
import { qrService } from '../../services/qrService';
import { useTheme } from '../../context/ThemeContext';

interface MediaLibraryProps {
  mediaList: MediaItem[];
  onOpenNewSlideModal: (category?: SlideCategoryType) => void;
  onEditSlide: (item: MediaItem) => void;
  onDeleteSlide: (id: string) => void;
  onAddToPlaylist: (item: MediaItem) => void;
}

const CATEGORIES_FILTER: { id: SlideCategoryType | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos os Slides' },
  { id: 'cardapio', label: 'Cardápio / Produtos' },
  { id: 'promo', label: 'Ofertas' },
  { id: 'aviso', label: 'Avisos' },
  { id: 'mural', label: 'Institucional' },
];

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaList,
  onOpenNewSlideModal,
  onEditSlide,
  onDeleteSlide,
  onAddToPlaylist,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<SlideCategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  const filteredMedia = mediaList.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandConfig?.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryOverlay?.headline?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [isPasteUrlOpen, setIsPasteUrlOpen] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');

  const handleConfirmPasteUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedUrl.trim()) return;
    const cat = selectedCategory === 'all' ? 'cardapio' : selectedCategory;
    const newItem: MediaItem = {
      id: `slide-${Date.now()}`,
      title: pastedTitle.trim() || 'Imagem da Web',
      type: 'image',
      url: pastedUrl.trim(),
      thumbnail: pastedUrl.trim(),
      durationDefault: 12,
      category: cat,
      createdAt: new Date().toISOString(),
    };
    onEditSlide(newItem);
    setPastedUrl('');
    setPastedTitle('');
    setIsPasteUrlOpen(false);
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      const cat = selectedCategory === 'all' ? 'cardapio' : selectedCategory;
      const newItem: MediaItem = {
        id: `slide-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'image',
        url: dataUrl,
        thumbnail: dataUrl,
        durationDefault: 12,
        category: cat,
        createdAt: new Date().toISOString(),
      };
      onEditSlide(newItem);
    } catch (err) {
      console.error('Erro no upload rápido:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subheader & Controls */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Biblioteca de Mídias
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {mediaList.length} itens cadastrados organizados por categoria
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={dropzoneInputRef}
            onChange={handleQuickUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => dropzoneInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
            }`}
          >
            <Upload className="w-4 h-4 text-sky-500" />
            <span>Upload de Imagem</span>
          </button>

          <button
            onClick={() => setIsPasteUrlOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-cyan-400" />
            <span>Colar URL</span>
          </button>

          <button
            onClick={() => onOpenNewSlideModal(selectedCategory === 'all' ? undefined : selectedCategory)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Slide</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Segmented Filter */}
        <div
          className={`flex items-center gap-1.5 p-1 rounded-full border overflow-x-auto ${
            isDark ? 'bg-[#152033] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {CATEGORIES_FILTER.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white font-medium'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou produto..."
            className={`w-full pl-10 pr-4 py-2 border rounded-full text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
              isDark
                ? 'bg-[#0b1120] border-slate-800 text-white placeholder-slate-500 focus:border-sky-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'
            }`}
          />
        </div>
      </div>

      {/* Grid of Media Cards or Blank Slate Empty State */}
      {filteredMedia.length === 0 ? (
        <div
          className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${
            isDark
              ? 'bg-[#131b2e] border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-500 shadow-xs'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Nenhum slide cadastrado
            </h3>
            <p className="text-xs max-w-sm mx-auto mt-1">
              Sua biblioteca está em branco e pronta. Crie slides com fotos, títulos e preços para transmitir na TV.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onOpenNewSlideModal()}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
            >
              Criar Primeiro Slide
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => {
            const brandCfg = item.brandConfig;
            const qrCfg = item.qrConfig;
            const overlay = item.categoryOverlay;

            return (
              <div
                key={item.id}
                className={`border rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-xs ${
                  isDark
                    ? 'bg-[#131b2e] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Media Image */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-semibold border border-white/10 font-mono">
                    {item.durationDefault || 12}s
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {overlay?.headline || item.title}
                    </h3>

                    {/* Metadata with dot separators */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <span className="capitalize">{item.category}</span>
                      <span>·</span>
                      <span>{brandCfg?.showBrand ? brandCfg.brandName || 'Com Marca' : 'Sem Marca'}</span>
                      {qrCfg?.showQrCode && (
                        <>
                          <span>·</span>
                          <span className="text-sky-600 dark:text-sky-400 font-semibold">QR</span>
                        </>
                      )}
                    </div>

                    {overlay?.pricePromo && (
                      <div className="mt-2 text-xs font-bold text-amber-500 dark:text-amber-400 font-mono">
                        {overlay.pricePromo}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`pt-3 border-t flex items-center justify-between gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button
                      onClick={() => onAddToPlaylist(item)}
                      className={`flex-1 py-1.5 px-3 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      + Programação
                    </button>
                    <button
                      onClick={() => onEditSlide(item)}
                      className={`p-2 rounded-full border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-sky-400'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-sky-600'
                      }`}
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSlide(item.id)}
                      className={`p-2 rounded-full border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#152033] hover:bg-rose-500/10 border-slate-700 text-slate-400 hover:text-rose-400'
                          : 'bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-500 hover:text-rose-600'
                      }`}
                      title="Excluir"
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

      {/* Modal para Colar URL Direta */}
      {isPasteUrlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors ${
            isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-sky-400" />
                <span>Colar URL de Imagem</span>
              </h3>
              <button
                onClick={() => setIsPasteUrlOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPasteUrl} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">
                  Link / URL da Imagem *
                </label>
                <div className="p-0.5">
                  <input
                    type="url"
                    required
                    value={pastedUrl}
                    onChange={(e) => setPastedUrl(e.target.value)}
                    placeholder="https://exemplo.com/minha-imagem.jpg"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono transition-colors focus:outline-none focus:border-sky-500 ${
                      isDark ? 'bg-[#090d16] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">
                  Título ou Nome do Slide (Opcional)
                </label>
                <div className="p-0.5">
                  <input
                    type="text"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    placeholder="Ex: Oferta Especial ou Foto do Produto"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-colors focus:outline-none focus:border-sky-500 ${
                      isDark ? 'bg-[#090d16] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {pastedUrl && (
                <div className="aspect-video w-full rounded-xl border border-slate-700 overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={pastedUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasteUrlOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Adicionar à Biblioteca</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
