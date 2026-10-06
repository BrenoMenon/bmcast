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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#25334a]">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Biblioteca de Mídias
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mediaList.length} itens cadastrados organizados por categoria
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={dropzoneInputRef}
            onChange={handleQuickUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => dropzoneInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1e293b] hover:bg-[#27364d] text-slate-200 hover:text-white text-xs font-medium rounded-full border border-[#2d3d57] transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Upload de Imagem</span>
          </button>
          <button
            onClick={() => onOpenNewSlideModal(selectedCategory === 'all' ? undefined : selectedCategory)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-95 text-[#042f2e] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Slide</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Clean Segmented Rounded Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#151f32] rounded-full border border-[#25334a] overflow-x-auto">
          {CATEGORIES_FILTER.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#2dd4bf] text-[#042f2e] font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white font-medium'
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
            className="w-full pl-10 pr-4 py-2 bg-[#0d131f] border border-[#25334a] rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
          />
        </div>
      </div>

      {/* Grid of Media Cards */}
      {filteredMedia.length === 0 ? (
        <div className="p-10 text-center bg-[#151f32] border border-dashed border-[#25334a] rounded-3xl">
          <p className="text-xs text-slate-400">Nenhum slide encontrado nesta categoria.</p>
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
                className="bg-[#151f32] border border-[#25334a] rounded-2xl overflow-hidden transition-all hover:border-[#384b6c] flex flex-col justify-between shadow-sm"
              >
                {/* Media Image */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-semibold border border-white/10">
                    {item.durationDefault || 12}s
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                      {overlay?.headline || item.title}
                    </h3>

                    {/* Metadata with dot separators */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <span className="capitalize">{item.category}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{brandCfg?.showBrand ? brandCfg.brandName || 'Com Marca' : 'Sem Marca'}</span>
                      {qrCfg?.showQrCode && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-sky-300 font-medium">QR</span>
                        </>
                      )}
                    </div>

                    {overlay?.pricePromo && (
                      <div className="mt-2 text-xs font-bold text-amber-300">
                        {overlay.pricePromo}
                      </div>
                    )}
                  </div>

                  {/* Actions - Rounded buttons */}
                  <div className="pt-3 border-t border-[#25334a] flex items-center justify-between gap-2">
                    <button
                      onClick={() => onAddToPlaylist(item)}
                      className="flex-1 py-1.5 px-3 rounded-full bg-[#1e293b] hover:bg-[#27364d] border border-[#2d3d57] text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      + Programação
                    </button>

                    <button
                      onClick={() => onEditSlide(item)}
                      className="p-2 rounded-full bg-[#1e293b] hover:bg-[#27364d] border border-[#2d3d57] text-[#2dd4bf] hover:text-white transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteSlide(item.id)}
                      className="p-2 rounded-full bg-[#1e293b] hover:bg-red-500/20 border border-[#2d3d57] hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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
