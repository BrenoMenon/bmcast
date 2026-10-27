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
import { supabaseService } from '../../services/supabaseClient';

interface MediaLibraryProps {
  mediaList: MediaItem[];
  onOpenNewSlideModal: (preselectedCategory?: SlideCategoryType) => void;
  onEditSlide: (item: MediaItem) => void;
  onDeleteSlide: (id: string) => void;
  onAddToPlaylist: (item: MediaItem) => void;
}

const CATEGORIES_FILTER: {
  id: 'all' | SlideCategoryType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'all', label: 'Todos', icon: ImageIcon },
  { id: 'cardapio', label: 'Cardápio', icon: Utensils },
  { id: 'promo', label: 'Promoção', icon: Flame },
  { id: 'aviso', label: 'Avisos', icon: Megaphone },
  { id: 'mural', label: 'Mural / Foto', icon: ImageIcon },
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
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    try {
      const cloudUrl = await supabaseService.uploadAsset(file, 'library');
      const finalUrl = cloudUrl || (await qrService.fileToDataUrl(file));
      const cat = selectedCategory === 'all' ? 'cardapio' : selectedCategory;
      const newItem: MediaItem = {
        id: `slide-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'image',
        url: finalUrl,
        thumbnail: finalUrl,
        durationDefault: 12,
        category: cat,
        createdAt: new Date().toISOString(),
        dimensions: '1920x1080',
      };
      onEditSlide(newItem);
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Subheader & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Biblioteca de Mídias da Sua Conta
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mediaList.length === 0
              ? 'Nenhuma mídia cadastrada ainda'
              : `${mediaList.length} ${mediaList.length === 1 ? 'mídia salva' : 'mídias salvas'} em alta definição`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={dropzoneInputRef}
            onChange={handleQuickUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => dropzoneInputRef.current?.click()}
            className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-2xl sm:rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
          >
            <Upload className="h-4 w-4 text-primary shrink-0" />
            <span>{isUploading ? 'Enviando...' : 'Subir Foto'}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onOpenNewSlideModal(selectedCategory === 'all' ? undefined : selectedCategory)
            }
            className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-2xl sm:rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Novo Slide</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (clean horizontal scroll on mobile) & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="-mx-1 px-1 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES_FILTER.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs transition whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nos seus slides..."
            className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition"
          />
        </div>
      </div>

      {/* Grid of Media Cards */}
      {filteredMedia.length === 0 ? (
        <div className="space-y-6">
          {mediaList.length === 0 ? (
            <div className="rounded-3xl sm:rounded-[2rem] border border-border bg-card p-6 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <ImageIcon className="h-7 w-7" />
              </div>

              <div className="mx-auto max-w-md space-y-1.5">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground">
                  Sua conta está limpa e pronta para uso
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Cadastre suas próprias artes, fotos, cardápios ou comunicados. Tudo o que você criar ficará salvo exclusivamente na sua conta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenNewSlideModal(undefined)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-primary px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Criar Primeiro Slide</span>
                </button>
                <button
                  type="button"
                  onClick={() => dropzoneInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border border-border bg-muted/60 px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-primary shrink-0" />
                  <span>Enviar Foto do Dispositivo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 sm:p-10 text-center">
              <p className="text-xs text-muted-foreground">
                Nenhum slide encontrado nesta categoria ou busca.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
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
            const fitMode = overlay?.imageFit || 'cover';

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card shadow-xs hover:border-primary/45 transition"
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-950 flex items-center justify-center">
                  {item.url ? (
                    <>
                      {fitMode === 'contain' && (
                        <img
                          src={item.url}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-lg"
                        />
                      )}
                      <img
                        src={item.url}
                        alt={item.title}
                        loading="lazy"
                        className={`relative z-10 h-full w-full ${
                          fitMode === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    </>
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center p-3 text-center"
                      style={{ backgroundColor: brandCfg?.accentColor || '#2563EB' }}
                    >
                      <span className="line-clamp-2 text-sm font-extrabold text-white">
                        {overlay?.headline || item.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <h3 className="truncate text-xs sm:text-sm font-bold text-foreground">
                      {overlay?.headline || item.title}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="capitalize">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.durationDefault || 12}s</span>
                      {qrCfg?.showQrCode && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-primary">QR</span>
                        </>
                      )}
                    </div>

                    {overlay?.pricePromo && (
                      <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {overlay.pricePromo}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => onAddToPlaylist(item)}
                      className="flex-1 h-9 rounded-xl border border-border bg-muted/60 px-3 text-xs font-semibold whitespace-nowrap text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      + Exibir na TV
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditSlide(item)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-primary hover:bg-muted transition cursor-pointer"
                      title="Editar"
                      aria-label="Editar slide"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSlide(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                      title="Excluir"
                      aria-label="Excluir slide"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
