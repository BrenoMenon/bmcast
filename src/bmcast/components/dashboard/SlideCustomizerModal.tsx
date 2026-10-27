import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Store,
  Clock,
  Image as ImageIcon,
  Check,
  Utensils,
  Flame,
  Megaphone,
  Eye,
  Sliders,
  Palette,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import {
  MediaItem,
  SlideCategoryType,
  QrCodePosition,
  QrCodeSize,
  BrandPosition,
  SlideBrandConfig,
  SlideQrCodeConfig,
  CategoryOverlayConfig,
  CompanyBrandProfile,
} from '../../types/signage';
import { qrService } from '../../services/qrService';
import { supabaseService } from '../../services/supabaseClient';

interface SlideCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: MediaItem, addToPlaylist: boolean) => void;
  initialItem?: MediaItem | null | undefined;
  initialCategory?: SlideCategoryType | undefined;
  companyProfile: CompanyBrandProfile;
}

const CATEGORIES: {
  id: SlideCategoryType;
  shortTitle: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultAccent: string;
}[] = [
  {
    id: 'cardapio',
    shortTitle: 'Cardápio',
    title: 'Cardápio & Preços',
    icon: Utensils,
    defaultAccent: '#2563EB',
  },
  {
    id: 'promo',
    shortTitle: 'Promoção',
    title: 'Promoção & Ofertas',
    icon: Flame,
    defaultAccent: '#EF4444',
  },
  {
    id: 'aviso',
    shortTitle: 'Avisos',
    title: 'Quadro de Avisos',
    icon: Megaphone,
    defaultAccent: '#10B981',
  },
  {
    id: 'mural',
    shortTitle: 'Mural / Foto',
    title: 'Mural & Institucional',
    icon: ImageIcon,
    defaultAccent: '#8B5CF6',
  },
];

const COLOR_PRESETS = [
  { name: 'Azul Real', hex: '#2563EB' },
  { name: 'Azul Celeste', hex: '#38BDF8' },
  { name: 'Ciano Tech', hex: '#06B6D4' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Laranja Sunset', hex: '#F97316' },
  { name: 'Vermelho Fogo', hex: '#EF4444' },
  { name: 'Rosa Pink', hex: '#EC4899' },
  { name: 'Roxo Neon', hex: '#8B5CF6' },
  { name: 'Dourado Ouro', hex: '#EAB308' },
  { name: 'Grafite Escuro', hex: '#334155' },
];

const inputCls =
  'w-full min-w-0 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition';

export const SlideCustomizerModal: React.FC<SlideCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialItem,
  initialCategory,
  companyProfile,
}) => {
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');
  const [selectedCategory, setSelectedCategory] = useState<SlideCategoryType>('cardapio');
  const [durationSeconds, setDurationSeconds] = useState(12);
  const [addToActivePlaylist, setAddToActivePlaylist] = useState(true);
  const [overlayDarkness, setOverlayDarkness] = useState<number>(0);

  // Brand config
  const [showBrand, setShowBrand] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandPosition, setBrandPosition] = useState<BrandPosition>('top-left');
  const [accentColor, setAccentColor] = useState('#2563EB');

  // Category Overlay config
  const [showOverlayBadge, setShowOverlayBadge] = useState(false);
  const [showPriceTag, setShowPriceTag] = useState(false);
  const [badgeText, setBadgeText] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [priceOriginal, setPriceOriginal] = useState('');
  const [pricePromo, setPricePromo] = useState('');
  const [discountBadge, setDiscountBadge] = useState('');

  // QR Code config
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeType, setQrCodeType] = useState<'generated' | 'custom_upload'>('generated');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeCustomImage, setQrCodeCustomImage] = useState('');
  const [qrCodeLabel, setQrCodeLabel] = useState('');
  const [qrCodePosition, setQrCodePosition] = useState<QrCodePosition>('bottom-right');
  const [qrCodeSize, setQrCodeSize] = useState<QrCodeSize>('medium');

  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    setMobileTab('edit');
    setPreviewImgError(false);

    if (initialItem) {
      setTitle(initialItem.title || '');
      setImageUrl(initialItem.url || '');
      setSelectedCategory(initialItem.category || 'cardapio');
      setDurationSeconds(initialItem.durationDefault || 12);

      const b = initialItem.brandConfig;
      setShowBrand(b ? b.showBrand : Boolean(companyProfile.name));
      setBrandName(b?.brandName || companyProfile.name || '');
      setBrandSlogan(b?.brandSlogan || companyProfile.slogan || '');
      setBrandLogo(b?.brandLogo || companyProfile.logoUrl || '');
      setBrandPosition(b?.brandPosition || 'top-left');
      setAccentColor(b?.accentColor || companyProfile.accentColor || '#2563EB');

      const o = initialItem.categoryOverlay;
      setImageFit(o?.imageFit || 'cover');
      setShowOverlayBadge(o?.showOverlayBadge === true);
      setShowPriceTag(o?.showPriceTag === true);
      setBadgeText(o?.badgeText || '');
      setHeadline(o?.headline || '');
      setSubheadline(o?.subheadline || '');
      setPriceOriginal(o?.priceOriginal || '');
      setPricePromo(o?.pricePromo || '');
      setDiscountBadge(o?.discountPercent || '');
      setOverlayDarkness(o?.overlayOpacity ?? 0);

      const q = initialItem.qrConfig;
      setShowQrCode(q ? q.showQrCode : false);
      setQrCodeType(q?.qrCodeType || 'generated');
      setQrCodeUrl(q?.qrCodeUrl || companyProfile.defaultQrCodeUrl || '');
      setQrCodeCustomImage(q?.qrCodeCustomImage || '');
      setQrCodeLabel(q?.qrCodeLabel || '');
      setQrCodePosition(q?.qrCodePosition || 'bottom-right');
      setQrCodeSize(q?.qrCodeSize || 'medium');
    } else {
      const targetCatId = initialCategory || 'cardapio';
      const targetCat = CATEGORIES.find((c) => c.id === targetCatId) || CATEGORIES[0];

      setTitle('');
      setImageUrl('');
      setImageFit('cover');
      setSelectedCategory(targetCatId);
      setDurationSeconds(12);

      setShowBrand(Boolean(companyProfile.name));
      setBrandName(companyProfile.name || '');
      setBrandSlogan(companyProfile.slogan || '');
      setBrandLogo(companyProfile.logoUrl || '');
      setBrandPosition('top-left');
      setAccentColor(companyProfile.accentColor || targetCat?.defaultAccent || '#2563EB');

      setShowOverlayBadge(false);
      setShowPriceTag(false);
      setBadgeText('');
      setHeadline('');
      setSubheadline('');
      setPriceOriginal('');
      setPricePromo('');
      setDiscountBadge('');
      setOverlayDarkness(0);

      setShowQrCode(false);
      setQrCodeType('generated');
      setQrCodeUrl(companyProfile.defaultQrCodeUrl || '');
      setQrCodeCustomImage('');
      setQrCodeLabel('');
      setQrCodePosition('bottom-right');
      setQrCodeSize('medium');
    }
  }, [initialItem, initialCategory, companyProfile, isOpen]);

  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      if (qrCodeType === 'generated' && showQrCode) {
        try {
          const dataUrl = await qrService.generateDataUrl(
            qrCodeUrl.trim() || window.location.origin,
            '#000000',
            '#ffffff'
          );
          if (!isCancelled) {
            setGeneratedQrDataUrl(dataUrl);
          }
        } catch (e) {
          console.error('Falha ao gerar QR:', e);
        }
      }
    };
    generate();
    return () => {
      isCancelled = true;
    };
  }, [qrCodeUrl, qrCodeType, showQrCode]);

  const handleCategorySelect = (catId: SlideCategoryType) => {
    setSelectedCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat && !initialItem) {
      setAccentColor(cat.defaultAccent);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAsset(true);
    try {
      const cloudUrl = await supabaseService.uploadAsset(file, 'slides');
      const finalUrl = cloudUrl || (await qrService.fileToDataUrl(file));
      setImageUrl(finalUrl);
      setPreviewImgError(false);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setErrorMessage(null);
    } catch (err) {
      console.error('Erro na imagem:', err);
      setErrorMessage('Não foi possível carregar esta imagem. Tente outro arquivo.');
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleCustomQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAsset(true);
    try {
      const cloudUrl = await supabaseService.uploadAsset(file, 'qrcodes');
      const finalUrl = cloudUrl || (await qrService.fileToDataUrl(file));
      setQrCodeCustomImage(finalUrl);
      setQrCodeType('custom_upload');
    } catch (err) {
      console.error('Erro no QR:', err);
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleSave = () => {
    if (!imageUrl.trim() && !headline.trim() && !title.trim()) {
      setErrorMessage('Envie uma imagem para o slide ou preencha o título principal.');
      setMobileTab('edit');
      return;
    }

    const cleanBadge = badgeText.trim();
    const cleanHeadline = headline.trim();
    const resolvedTitle = title.trim() || cleanHeadline || 'Slide da TV';

    const slideBrand: SlideBrandConfig = {
      showBrand,
      brandName: brandName.trim(),
      brandSlogan: brandSlogan.trim(),
      brandLogo: brandLogo.trim(),
      brandPosition,
      accentColor,
      badgeText: cleanBadge,
    };

    const slideQr: SlideQrCodeConfig = {
      showQrCode,
      qrCodeType,
      qrCodeUrl: qrCodeUrl.trim(),
      qrCodeCustomImage: qrCodeCustomImage.trim(),
      qrCodeLabel: qrCodeLabel.trim(),
      qrCodePosition,
      qrCodeSize,
    };

    const slideOverlay: CategoryOverlayConfig = {
      badgeText: cleanBadge,
      headline: cleanHeadline,
      subheadline: subheadline.trim(),
      priceOriginal: priceOriginal.trim(),
      pricePromo: pricePromo.trim(),
      accentColor,
      showOverlayBadge: Boolean(cleanBadge) ? true : showOverlayBadge,
      showPriceTag,
      position: 'bottom',
      overlayOpacity: overlayDarkness,
      discountPercent: discountBadge.trim(),
      imageFit,
    };

    const savedMediaItem: MediaItem = {
      id: initialItem?.id || `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: resolvedTitle,
      type: 'image',
      url: imageUrl.trim(),
      thumbnail: imageUrl.trim(),
      durationDefault: Number(durationSeconds) || 12,
      category: selectedCategory,
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      dimensions: '1920x1080',
      brandConfig: slideBrand,
      qrConfig: slideQr,
      categoryOverlay: slideOverlay,
    };

    onSuccess(savedMediaItem, addToActivePlaylist);
    onClose();
  };

  if (!isOpen) return null;

  const resolvedQrImage =
    qrCodeType === 'custom_upload' && qrCodeCustomImage ? qrCodeCustomImage : generatedQrDataUrl;

  const hasBottomContent = Boolean(
    badgeText.trim() ||
      headline.trim() ||
      subheadline.trim() ||
      (showPriceTag && (priceOriginal.trim() || pricePromo.trim()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex h-[100dvh] sm:h-auto sm:max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-none sm:rounded-[2rem] border-0 sm:border border-border bg-card text-card-foreground shadow-2xl">
        {/* Modal Header: 2 clean rows on mobile so zero text gets squished */}
        <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3 sm:px-6 sm:py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground truncate">
                {initialItem ? 'Editar Slide da TV' : 'Criar Novo Slide'}
              </h2>
              <p className="text-xs text-muted-foreground leading-snug">
                Envie sua arte em alta definição ou adicione textos, preços e QR Code.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Tab Switcher: Full-width clean 2-col grid */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/70 p-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('edit')}
              className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                mobileTab === 'edit'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ajustes do Slide
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                mobileTab === 'preview'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Simulador da TV
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="shrink-0 flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 sm:px-6 py-2.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="grid flex-1 grid-cols-1 gap-4 sm:gap-5 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:grid-cols-12">
          {/* Form Column */}
          <div
            className={`min-w-0 space-y-4 lg:col-span-7 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Category Selector */}
            <div className="rounded-3xl border border-border bg-muted/35 p-4 space-y-2.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-foreground">
                Categoria de Organização
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`flex items-center sm:flex-col sm:items-start gap-2 rounded-2xl border p-3 text-left transition cursor-pointer min-w-0 ${
                        isSel
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                          : 'border-border bg-card text-foreground hover:bg-muted/60 font-medium'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs leading-tight truncate">{cat.shortTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Imagem de Fundo em Alta Qualidade */}
            <div className="rounded-3xl border border-border bg-muted/35 p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  01. Imagem do Slide (Alta Nitidez)
                </span>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  Full HD / 4K
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingAsset}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 sm:h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  <span>{uploadingAsset ? 'Carregando foto...' : 'Enviar Foto / Arte'}</span>
                </button>

                <input
                  type="url"
                  value={imageUrl.startsWith('data:') || imageUrl.startsWith('/api/uploads/') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImgError(false);
                    setErrorMessage(null);
                  }}
                  placeholder={
                    imageUrl.startsWith('data:') || imageUrl.startsWith('/api/uploads/')
                      ? 'Arquivo enviado do dispositivo'
                      : 'Ex: https://...'
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Nome de identificação interna do slide
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Arte Principal Balcão"
                  className={inputCls}
                />
              </div>

              {imageUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 min-w-0">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Imagem carregada em qualidade original</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setPreviewImgError(false);
                    }}
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[11px] font-bold text-destructive hover:bg-destructive/15 transition cursor-pointer shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Envie uma arte pronta (JPG, PNG ou WebP) ou crie um aviso apenas com fundo colorido.
                </p>
              )}

              {/* Image Fit Mode (Zero Crop vs Fullscreen 16:9) */}
              <div className="space-y-2 border-t border-border/70 pt-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Maximize2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Enquadramento da Imagem na TV:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageFit('cover')}
                    className={`rounded-2xl border px-3 py-2.5 text-left text-xs transition cursor-pointer ${
                      imageFit === 'cover'
                        ? 'border-primary bg-primary/10 font-bold text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="font-bold text-foreground">Preencher Tela 16:9</div>
                    <div className="text-[11px] text-muted-foreground">
                      Ocupa 100% da TV sem bordas
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageFit('contain')}
                    className={`rounded-2xl border px-3 py-2.5 text-left text-xs transition cursor-pointer ${
                      imageFit === 'contain'
                        ? 'border-primary bg-primary/10 font-bold text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="font-bold text-foreground">Imagem Inteira (Sem Corte)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Exibe toda a arte com fundo desfocado
                    </div>
                  </button>
                </div>
              </div>

              {/* Background Dimming: Responsive 4-column grid so zero mobile overflow */}
              <div className="space-y-2 border-t border-border/70 pt-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Escurecer fundo (para leitura de textos):</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-primary">
                    {overlayDarkness === 0 ? 'Original (0%)' : `${overlayDarkness}%`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 30, 50, 75].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOverlayDarkness(val)}
                      className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                        overlayDarkness === val
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {val === 0 ? '0% Puro' : `${val}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Cores e Estilo */}
            <div className="rounded-3xl border border-border bg-muted/35 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Palette className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>02. Cor de Destaque</span>
                </span>
                <span className="font-mono text-xs font-bold text-primary">{accentColor}</span>
              </div>

              <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-2.5 justify-items-center">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    className={`flex h-9 w-9 sm:h-8 sm:w-8 aspect-square shrink-0 items-center justify-center rounded-full transition cursor-pointer ${
                      accentColor.toUpperCase() === c.hex.toUpperCase()
                        ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card shadow'
                        : 'opacity-85 hover:scale-105 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {accentColor.toUpperCase() === c.hex.toUpperCase() && (
                      <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                    )}
                  </button>
                ))}

                <div className="flex items-center justify-center sm:gap-1.5 sm:border-l sm:border-border sm:pl-2.5">
                  <label className="hidden sm:inline text-[11px] font-semibold text-muted-foreground">Livre:</label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="brand-color-input !h-9 !w-9 sm:!h-8 sm:!w-8 aspect-square shrink-0 rounded-full border border-border bg-transparent cursor-pointer"
                    title="Escolha qualquer cor personalizada"
                  />
                </div>
              </div>
            </div>

            {/* 3. Textos, Badge e Preços (Opcionais) */}
            <div className="rounded-3xl border border-border bg-muted/35 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  03. Textos e Preços na Tela (Opcional)
                </span>
                <span className="text-[11px] text-muted-foreground">Deixe vazio se a arte já tiver texto</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                    Etiqueta Superior
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => {
                      setBadgeText(e.target.value);
                      setShowOverlayBadge(Boolean(e.target.value.trim()));
                    }}
                    placeholder="Ex: DESTAQUE"
                    className={`${inputCls} font-bold uppercase`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                    Título Exibido na TV
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Digite o título (opcional)"
                    className={`${inputCls} font-bold`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Subtítulo ou Descrição
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Informações complementares (opcional)"
                  className={inputCls}
                />
              </div>

              <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2.5">
                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPriceTag}
                    onChange={(e) => setShowPriceTag(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <span>Exibir Bloco de Preços</span>
                </label>

                {showPriceTag && (
                  <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] text-muted-foreground">
                        Preço Anterior
                      </label>
                      <input
                        type="text"
                        value={priceOriginal}
                        onChange={(e) => setPriceOriginal(e.target.value)}
                        placeholder="R$ 0,00"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Preço Atual / Oferta
                      </label>
                      <input
                        type="text"
                        value={pricePromo}
                        onChange={(e) => setPricePromo(e.target.value)}
                        placeholder="R$ 0,00"
                        className={`${inputCls} font-extrabold`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Selo Extra
                      </label>
                      <input
                        type="text"
                        value={discountBadge}
                        onChange={(e) => setDiscountBadge(e.target.value)}
                        placeholder="Ex: NOVO"
                        className={`${inputCls} font-bold`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. QR Code */}
            <div className="rounded-3xl border border-border bg-muted/35 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>04. QR Code na Tela</span>
                </span>

                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <span>Exibir na TV</span>
                </label>
              </div>

              {showQrCode && (
                <div className="space-y-3 border-t border-border/70 pt-3">
                  <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1">
                    <button
                      type="button"
                      onClick={() => setQrCodeType('generated')}
                      className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                        qrCodeType === 'generated'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Gerar por Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrCodeType('custom_upload')}
                      className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                        qrCodeType === 'custom_upload'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Subir Imagem
                    </button>
                  </div>

                  {qrCodeType === 'generated' ? (
                    <div>
                      <label className="mb-1 block text-[11px] text-muted-foreground">
                        Link de Destino (WhatsApp, Site, Cardápio, Instagram)
                      </label>
                      <input
                        type="url"
                        value={qrCodeUrl}
                        onChange={(e) => setQrCodeUrl(e.target.value)}
                        placeholder="Ex: https://..."
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={qrImageInputRef}
                        onChange={handleCustomQrFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => qrImageInputRef.current?.click()}
                        className="w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                      >
                        {qrCodeCustomImage
                          ? 'Substituir Imagem do QR Code'
                          : 'Selecionar Imagem PNG/JPG'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-muted-foreground">
                        Legenda abaixo do QR
                      </label>
                      <input
                        type="text"
                        value={qrCodeLabel}
                        onChange={(e) => setQrCodeLabel(e.target.value)}
                        placeholder="Ex: Aponte a câmera"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-muted-foreground">
                        Posição na Tela
                      </label>
                      <select
                        value={qrCodePosition}
                        onChange={(e) => setQrCodePosition(e.target.value as QrCodePosition)}
                        className={inputCls}
                      >
                        <option value="bottom-right">Canto Inferior Direito</option>
                        <option value="bottom-left">Canto Inferior Esquerdo</option>
                        <option value="top-right">Canto Superior Direito</option>
                        <option value="top-left">Canto Superior Esquerdo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Identidade da Marca & Duração (Zero horizontal overflow on mobile) */}
            <div className="rounded-3xl border border-border bg-muted/35 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Store className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>05. Selo da Marca &amp; Tempo</span>
                </span>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showBrand}
                    onChange={(e) => setShowBrand(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  <span>Exibir Marca</span>
                </label>
              </div>

              {showBrand && (
                <div className="grid grid-cols-1 gap-2.5 border-t border-border/70 pt-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-muted-foreground">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Nome exibido no topo"
                      className={`${inputCls} font-bold`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-muted-foreground">
                      Subtítulo / Slogan
                    </label>
                    <input
                      type="text"
                      value={brandSlogan}
                      onChange={(e) => setBrandSlogan(e.target.value)}
                      placeholder="Opcional"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-border/70 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Tempo de exibição na TV:</span>
                  </span>
                  <span className="font-mono font-bold text-primary">{durationSeconds}s</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[8, 12, 15, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSeconds(sec)}
                      className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                        durationSeconds === sec
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TV Live Preview Column */}
          <div
            className={`min-w-0 space-y-4 lg:col-span-5 ${
              mobileTab === 'edit' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Simulador da TV em Tempo Real</span>
              </span>
              <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                16:9 HD
              </span>
            </div>

            <div className="flex flex-col rounded-3xl border border-border bg-zinc-950 p-2.5 sm:p-3 shadow-xl">
              <div className="relative flex aspect-video flex-col justify-between overflow-hidden rounded-2xl bg-black">
                {imageUrl && !previewImgError ? (
                  <>
                    {imageFit === 'contain' && (
                      <img
                        src={imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl"
                      />
                    )}
                    <img
                      src={imageUrl}
                      alt="Preview do Slide"
                      onError={() => setPreviewImgError(true)}
                      className={`absolute inset-0 h-full w-full ${
                        imageFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-medium text-white/60"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}40 0%, #090d16 100%)`,
                    }}
                  >
                    {!headline && !title ? 'Envie uma foto ou adicione um título' : null}
                  </div>
                )}

                {/* User-controlled dimming + smart text contrast only when text exists */}
                {overlayDarkness > 0 && (
                  <div
                    className="pointer-events-none absolute inset-0 transition-opacity"
                    style={{ backgroundColor: `rgba(0, 0, 0, ${overlayDarkness / 100})` }}
                  />
                )}
                {hasBottomContent && overlayDarkness < 35 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                )}

                {showBrand && (brandName || companyProfile.name || brandLogo) && (
                  <div
                    className={`relative z-10 flex items-center gap-2 p-2.5 ${
                      brandPosition === 'top-right' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-lg backdrop-blur-md"
                      style={{
                        backgroundColor: 'rgba(9, 13, 22, 0.82)',
                        borderColor: `${accentColor}60`,
                      }}
                    >
                      {brandLogo ? (
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black">
                          <img
                            src={brandLogo}
                            alt="Logo"
                            className="block h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Store className="h-3 w-3" />
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] font-extrabold uppercase leading-tight tracking-wide text-white">
                          {brandName || companyProfile.name}
                        </div>
                        {(brandSlogan || companyProfile.slogan) && (
                          <div className="text-[8px] font-medium tracking-tight text-white/75">
                            {brandSlogan || companyProfile.slogan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {showQrCode && resolvedQrImage && (
                  <div
                    className={`absolute z-20 p-2.5 ${
                      qrCodePosition === 'bottom-right'
                        ? 'bottom-2 right-2'
                        : qrCodePosition === 'bottom-left'
                          ? 'bottom-2 left-2'
                          : qrCodePosition === 'top-right'
                            ? 'top-2 right-2'
                            : 'top-2 left-2'
                    }`}
                  >
                    <div className="flex max-w-[110px] flex-col items-center rounded-xl border border-white bg-white p-1.5 shadow-2xl">
                      <div
                        className={
                          qrCodeSize === 'small'
                            ? 'h-12 w-12'
                            : qrCodeSize === 'medium'
                              ? 'h-16 w-16'
                              : 'h-20 w-20'
                        }
                      >
                        <img
                          src={resolvedQrImage}
                          alt="QR Code"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {qrCodeLabel && (
                        <span className="mt-1 text-center text-[7.5px] font-extrabold leading-tight text-slate-900">
                          {qrCodeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {hasBottomContent && (
                  <div className="relative z-10 mt-auto p-3">
                    <div className="max-w-[72%] space-y-1">
                      {badgeText.trim() && (
                        <span
                          className="inline-block rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md"
                          style={{ backgroundColor: accentColor }}
                        >
                          {badgeText}
                        </span>
                      )}

                      {headline && (
                        <h4 className="text-sm sm:text-base font-black leading-tight text-white drop-shadow-md">
                          {headline}
                        </h4>
                      )}

                      {subheadline && (
                        <p className="line-clamp-2 text-[9px] leading-snug text-white/90 drop-shadow">
                          {subheadline}
                        </p>
                      )}

                      {showPriceTag && (priceOriginal || pricePromo) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {priceOriginal && (
                            <span className="text-[10px] font-semibold text-white/75 line-through drop-shadow">
                              {priceOriginal}
                            </span>
                          )}
                          {pricePromo && (
                            <span
                              className="rounded-lg px-2 py-0.5 text-xs sm:text-sm font-black text-white shadow-lg"
                              style={{ backgroundColor: accentColor }}
                            >
                              {pricePromo}
                            </span>
                          )}
                          {discountBadge && (
                            <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-950 shadow">
                              {discountBadge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-muted/40 p-3.5">
              <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToActivePlaylist}
                  onChange={(e) => setAddToActivePlaylist(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <span>Adicionar automaticamente na TV ativa</span>
              </label>
              <span className="text-[11px] font-bold text-primary shrink-0">Imediato</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3.5 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>{initialItem ? 'Salvar Alterações' : 'Publicar Slide na TV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
