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
  Sparkles,
} from 'lucide-react';
import {
  MediaItem,
  SlideCategoryType,
} from '../../types/signage';
import { qrService } from '../../services/qrService';
import { READY_STOCK_IMAGES } from '../../data/readyStockImages';

interface MediaLibraryProps {
  mediaList: MediaItem[];
  onOpenNewSlideModal: (preselectedCategory?: SlideCategoryType, stockImageId?: string) => void;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Biblioteca de Mídias
          </h2>
          <p className="text-xs text-slate-400 mt-1">
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
            onClick={() => onOpenNewSlideModal(undefined)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
            title="Explorar biblioteca de fotos e modelos prontos"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Modelos Prontos</span>
          </button>
          <button
            onClick={() => dropzoneInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-full border border-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Upload de Foto</span>
          </button>
          <button
            onClick={() => onOpenNewSlideModal(selectedCategory === 'all' ? undefined : selectedCategory)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Slide</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Clean Segmented Rounded Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-full border border-slate-700/80 overflow-x-auto">
          {CATEGORIES_FILTER.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md'
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
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Media Cards or Rich Ready Models Showcase */}
      {filteredMedia.length === 0 ? (
        <div className="space-y-6">
          {mediaList.length === 0 ? (
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Banco de Imagens & Modelos Prontos</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Sua biblioteca está vazia e pronta para você começar!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Não precisa tirar fotos agora: escolha um dos modelos abaixo com fotos em Full HD gratuitas, preços e textos profissionais já montados para colocar na TV em 1 clique, ou clique em Novo Slide para enviar sua imagem.
                </p>
              </div>

              {/* Showcase Grid of Popular Ready Models */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {READY_STOCK_IMAGES.slice(0, 6).map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group bg-slate-900 border border-slate-700/80 hover:border-blue-500/60 rounded-2xl overflow-hidden transition-all shadow-md flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img
                        src={tpl.url}
                        alt={tpl.label}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-white uppercase border border-white/10">
                        {tpl.suggestedBadge}
                      </span>
                      {tpl.suggestedPricePromo && (
                        <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-xs font-black text-white shadow">
                          {tpl.suggestedPricePromo}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {tpl.suggestedHeadline}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {tpl.suggestedSubheadline}
                        </p>
                      </div>

                      <button
                        onClick={() => onOpenNewSlideModal(tpl.category, tpl.id)}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Criar Slide com Este Modelo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  Mais de 20 modelos prontos de lanches, pizzas, cafés, açaí, carnes, barbearia e avisos.
                </span>
                <button
                  onClick={() => onOpenNewSlideModal(undefined)}
                  className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Ver Todos os Modelos no Personalizador →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl">
              <p className="text-xs text-slate-400">Nenhum slide encontrado nesta categoria ou busca.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 rounded-full bg-slate-800 text-xs text-blue-400 hover:text-white"
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
                className="bg-slate-800/70 border border-slate-700/80 rounded-2xl overflow-hidden transition-all hover:border-blue-500/50 flex flex-col justify-between shadow-sm"
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
                      <div className="mt-2 text-xs font-bold text-emerald-400">
                        {overlay.pricePromo}
                      </div>
                    )}
                  </div>

                  {/* Actions - Rounded buttons */}
                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onAddToPlaylist(item)}
                      className="flex-1 py-1.5 px-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      + Programação
                    </button>

                    <button
                      onClick={() => onEditSlide(item)}
                      className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-white transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteSlide(item.id)}
                      className="p-2 rounded-full bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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
