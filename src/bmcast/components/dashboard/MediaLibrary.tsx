import React, { useState, useRef } from 'react';
import {
  Plus,
  Upload,
  Search,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Utensils,
  Flame,
  Megaphone,
} from 'lucide-react';
import {
  MediaItem,
  SlideCategoryType,
} from '../../types/signage';
import { qrService } from '../../services/qrService';

interface MediaLibraryProps {
  mediaList: MediaItem[];
  onOpenNewSlideModal: (preselectedCategory?: SlideCategoryType) => void;
  onEditSlide: (item: MediaItem) => void;
  onDeleteSlide: (id: string) => void;
  onAddToPlaylist: (item: MediaItem) => void;
}

const CATEGORIES_FILTER: { id: 'all' | SlideCategoryType; label: string; icon: any }[] = [
  { id: 'all', label: 'Todos os Slides', icon: ImageIcon },
  { id: 'cardapio', label: 'Cardápio', icon: Utensils },
  { id: 'promo', label: 'Promoção', icon: Flame },
  { id: 'aviso', label: 'Informativo', icon: Megaphone },
  { id: 'mural', label: 'Mural de Fotos', icon: ImageIcon },
];

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaList,
  onOpenNewSlideModal,
  onEditSlide,
  onDeleteSlide,
  onAddToPlaylist,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | SlideCategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dropzoneInputRef = useRef<HTMLInputElement | null>(null);

  const filteredMedia = mediaList.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandConfig?.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryOverlay?.headline?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      console.error('Erro no upload:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subheader & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Biblioteca de Mídias
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mediaList.length} itens cadastrados organizados por categoria
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <input
            type="file"
            ref={dropzoneInputRef}
            onChange={handleQuickUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => dropzoneInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-full border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Upload de Foto</span>
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
        {/* Clean Segmented Rounded Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl md:rounded-full border border-slate-200 dark:border-slate-700/80">
          {CATEGORIES_FILTER.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
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
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Media Cards or Blank Canvas State */}
      {filteredMedia.length === 0 ? (
        <div className="space-y-6">
          {mediaList.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Sua biblioteca começa 100% em branco!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nenhum dado ou imagem de teste cadastrado. Cadastre os slides da sua empresa: adicione textos, preços, cores de fundo ou envie suas próprias fotos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onOpenNewSlideModal(undefined)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Slide em Branco</span>
                </button>
                <button
                  onClick={() => dropzoneInputRef.current?.click()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm rounded-full border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Upload da Sua Foto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-white dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum slide encontrado nesta categoria ou busca.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-sky-600 dark:text-sky-400 hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
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
                className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden transition-all hover:border-sky-500/50 flex flex-col justify-between shadow-sm"
              >
                {/* Media Image / Clean Background Preview */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                  {item.thumbnail || item.url ? (
                    <img
                      src={item.thumbnail || item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
                      style={{ backgroundColor: brandCfg?.accentColor || '#0284c7' }}
                    >
                      <span className="text-white font-extrabold text-sm line-clamp-2">
                        {overlay?.headline || item.title}
                      </span>
                    </div>
                  )}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-semibold">
                    {item.durationDefault || 12}s
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {overlay?.headline || item.title}
                    </h3>

                    {/* Metadata with dot separators */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="capitalize">{item.category}</span>
                      <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                      <span>{brandCfg?.showBrand ? brandCfg.brandName || 'Com Marca' : 'Sem Marca'}</span>
                      {qrCfg?.showQrCode && (
                        <>
                          <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                          <span className="text-sky-600 dark:text-sky-300 font-medium">QR</span>
                        </>
                      )}
                    </div>

                    {overlay?.pricePromo && (
                      <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {overlay.pricePromo}
                      </div>
                    )}
                  </div>

                  {/* Actions - Rounded buttons */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onAddToPlaylist(item)}
                      className="flex-1 py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      + Programação
                    </button>

                    <button
                      onClick={() => onEditSlide(item)}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteSlide(item.id)}
                      className="p-2 rounded-full bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
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
    </div>
  );
};
