import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
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
  Tag,
  AlertCircle,
  Search,
  CheckCircle2,
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

interface SlideCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: MediaItem, addToPlaylist: boolean) => void;
  initialItem?: MediaItem | null;
  initialCategory?: SlideCategoryType;
  companyProfile: CompanyBrandProfile;
}

const CATEGORIES: {
  id: SlideCategoryType;
  title: string;
  badge: string;
  desc: string;
  icon: any;
  defaultAccent: string;
}[] = [
  {
    id: 'cardapio',
    title: 'Cardápio & Preços',
    badge: 'CARDÁPIO',
    desc: 'Pratos, hambúrgueres, pizzas, bebidas e itens com preços.',
    icon: Utensils,
    defaultAccent: '#2563EB',
  },
  {
    id: 'promo',
    title: 'Super Promoção & Ofertas',
    badge: 'PROMOÇÃO',
    desc: 'Ofertas com tempo limitado, descontos e combos especiais.',
    icon: Flame,
    defaultAccent: '#EF4444',
  },
  {
    id: 'aviso',
    title: 'Quadro de Avisos & Wi-Fi',
    badge: 'AVISO IMPORTANTE',
    desc: 'Horários, Wi-Fi da loja, regras e comunicados corporativos.',
    icon: Megaphone,
    defaultAccent: '#10B981',
  },
  {
    id: 'mural',
    title: 'Mural de Fotos & Institucional',
    badge: 'COMUNICADO',
    desc: 'Fotos de novidades, ambiente e mensagens institucionais.',
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

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SlideCategoryType>('cardapio');
  const [durationSeconds, setDurationSeconds] = useState(12);
  const [addToActivePlaylist, setAddToActivePlaylist] = useState(true);

  // Overlay Darkness
  const [overlayDarkness, setOverlayDarkness] = useState<number>(0); // 0 to 100

  // Brand config
  const [showBrand, setShowBrand] = useState(true);
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
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    if (initialItem) {
      setTitle(initialItem.title || '');
      setImageUrl(initialItem.url || '');
      setSelectedCategory(initialItem.category || 'cardapio');
      setDurationSeconds(initialItem.durationDefault || 12);

      const b = initialItem.brandConfig;
      setShowBrand(b ? b.showBrand : true);
      setBrandName(b?.brandName || companyProfile.name || '');
      setBrandSlogan(b?.brandSlogan || companyProfile.slogan || '');
      setBrandLogo(b?.brandLogo || companyProfile.logoUrl || '');
      setBrandPosition(b?.brandPosition || 'top-left');
      setAccentColor(b?.accentColor || companyProfile.accentColor || '#2563EB');

      const o = initialItem.categoryOverlay;
      setShowOverlayBadge(o?.showOverlayBadge === true);
      setShowPriceTag(o?.showPriceTag === true);
      setBadgeText(o?.badgeText || '');
      setHeadline(o?.headline || initialItem.title || '');
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
      setImageUrl(''); // 100% BLANK AS REQUESTED!
      setSelectedCategory(targetCatId);
      setDurationSeconds(12);

      setShowBrand(Boolean(companyProfile.name));
      setBrandName(companyProfile.name || '');
      setBrandSlogan(companyProfile.slogan || '');
      setBrandLogo(companyProfile.logoUrl || '');
      setBrandPosition('top-left');
      setAccentColor(targetCat.defaultAccent || '#2563EB');

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
      if (qrCodeType === 'generated') {
        try {
          const dataUrl = await qrService.generateDataUrl(
            qrCodeUrl || 'https://bmcast.app',
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
  }, [qrCodeUrl, qrCodeType]);

  const handleCategorySelect = (catId: SlideCategoryType) => {
    setSelectedCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;

    setAccentColor(cat.defaultAccent);
    setBadgeText(cat.badge);
    setHeadline(cat.defaultHeadline);
    setSubheadline(cat.defaultSubheadline);
    setPriceOriginal(cat.defaultOriginalPrice || '');
    setPricePromo(cat.defaultPromoPrice || '');
    setQrCodeLabel(cat.defaultQrLabel);

    if (catId === 'aviso' || catId === 'mural') {
      setShowPriceTag(false);
    } else {
      setShowPriceTag(true);
    }

    // Auto set sample image of category if using preset
    const matchingImg = PRESET_STOCK_IMAGES.find((s) => s.category === catId);
    if (matchingImg && (!imageUrl || PRESET_STOCK_IMAGES.some((p) => p.url === imageUrl))) {
      setImageUrl(matchingImg.url);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setImageUrl(dataUrl);
      if (!title || title === 'Novo Slide') {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setErrorMessage(null);
    } catch (err) {
      console.error('Erro na imagem:', err);
    }
  };

  const handleCustomQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setQrCodeCustomImage(dataUrl);
      setQrCodeType('custom_upload');
    } catch (err) {
      console.error('Erro no QR:', err);
    }
  };

  const handleBrandLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setBrandLogo(dataUrl);
    } catch (err) {
      console.error('Erro no logo:', err);
    }
  };

  const handleSave = () => {
    if (!imageUrl) {
      setErrorMessage('Por favor, selecione ou envie uma imagem de fundo para o slide.');
      return;
    }

    const slideBrand: SlideBrandConfig = {
      showBrand,
      brandName: brandName.trim(),
      brandSlogan: brandSlogan.trim(),
      brandLogo: brandLogo.trim(),
      brandPosition,
      accentColor,
      badgeText: badgeText.trim(),
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
      badgeText: badgeText.trim(),
      headline: headline.trim() || title,
      subheadline: subheadline.trim(),
      priceOriginal: priceOriginal.trim(),
      pricePromo: pricePromo.trim(),
      accentColor,
      showOverlayBadge,
      showPriceTag,
      position: 'bottom',
      overlayOpacity: overlayDarkness,
      discountPercent: discountBadge.trim(),
    };

    const savedMediaItem: MediaItem = {
      id: initialItem?.id || `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim() || headline.trim() || 'Slide BM Cast',
      type: 'image',
      url: imageUrl,
      thumbnail: imageUrl,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden flex flex-col max-h-[95vh] shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{initialItem ? 'Editar Slide da TV' : 'Criar Novo Slide'}</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Personalização completa: cores, fotos, preços, marca e QR Code dinâmico
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab */}
            <div className="flex lg:hidden bg-slate-800 p-0.5 rounded-full border border-slate-700">
              <button
                type="button"
                onClick={() => setMobileTab('edit')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  mobileTab === 'edit' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                Ajustes
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  mobileTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                Preview TV
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-red-950/60 border-b border-red-800 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6">
          {/* Form Column */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            {/* Category Selector Tabs */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Tipo do Slide:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isSel
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs leading-tight">{cat.title.split('&')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Imagem de Fundo */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  01. Imagem de Fundo (16:9 Full HD)
                </span>
                <span className="text-[10px] text-slate-400">1920x1080</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                >
                  <Upload className="w-4 h-4" />
                  <span>Enviar Foto do Computador / Celular</span>
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ou cole o link direto da imagem..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Image Status & Clear Action */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {imageUrl ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-xs">Foto anexada ao slide</span>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold border border-red-500/40 cursor-pointer transition-colors"
                    >
                      Remover Imagem (Deixar em Branco)
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Nenhuma foto selecionada. O slide usará fundo limpo na sua cor de destaque.
                  </span>
                )}
              </div>

              {/* Overlay Darkness Slider */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contraste / Escurecimento do Fundo:</span>
                </div>
                <div className="flex items-center gap-2">
                  {[30, 50, 70, 85].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOverlayDarkness(val)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        overlayDarkness === val
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Cores e Estilo */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  <span>02. Cor de Destaque & Identidade Visual</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-400">{accentColor}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      accentColor.toUpperCase() === c.hex.toUpperCase()
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {accentColor.toUpperCase() === c.hex.toUpperCase() && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                    )}
                  </button>
                ))}

                {/* Free Color Picker */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                  <label className="text-[11px] text-slate-300 font-semibold cursor-pointer">
                    Cor Livre:
                  </label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-full border border-slate-600 bg-transparent cursor-pointer"
                    title="Escolha qualquer cor personalizada"
                  />
                </div>
              </div>
            </div>

            {/* 3. Textos, Badge e Preços */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                03. Título, Destaques e Valores
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">Etiqueta Badge</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="Ex: MAIS PEDIDO"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">Título do Slide / Produto</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: Combo Especial Smash Burger"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Descrição Detalhada</label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Ex: Acompanha batatas rústicas crocantes e refrigerante lata gelado..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Price Tags */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPriceTag}
                      onChange={(e) => setShowPriceTag(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600"
                    />
                    <span>Exibir Bloco de Preços</span>
                  </label>

                  {showPriceTag && (
                    <span className="text-[11px] text-blue-400 font-semibold">
                      Com destaque visual na TV
                    </span>
                  )}
                </div>

                {showPriceTag && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Preço Normal (R$)</label>
                      <input
                        type="text"
                        value={priceOriginal}
                        onChange={(e) => setPriceOriginal(e.target.value)}
                        placeholder="Ex: R$ 49,90"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 line-through"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-emerald-400 mb-1 font-bold">Preço Promocional (R$)</label>
                      <input
                        type="text"
                        value={pricePromo}
                        onChange={(e) => setPricePromo(e.target.value)}
                        placeholder="Ex: R$ 36,90"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-extrabold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-amber-400 mb-1 font-medium">Selo de Desconto</label>
                      <input
                        type="text"
                        value={discountBadge}
                        onChange={(e) => setDiscountBadge(e.target.value)}
                        placeholder="Ex: 25% OFF"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. QR Code */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-400" />
                  <span>04. QR Code Interativo</span>
                </span>

                <label className="text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600"
                  />
                  <span>Exibir na TV</span>
                </label>
              </div>

              {showQrCode && (
                <div className="space-y-3 pt-1 border-t border-slate-700/60">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setQrCodeType('generated')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        qrCodeType === 'generated'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Gerar por Link / WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrCodeType('custom_upload')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        qrCodeType === 'custom_upload'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Subir Imagem de QR Real
                    </button>
                  </div>

                  {qrCodeType === 'generated' ? (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Link de Destino</label>
                      <input
                        type="text"
                        value={qrCodeUrl}
                        onChange={(e) => setQrCodeUrl(e.target.value)}
                        placeholder="https://wa.me/5511999999999 ou https://seucardapio.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Arquivo PNG/JPG do QR</label>
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
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 transition-colors cursor-pointer"
                      >
                        {qrCodeCustomImage ? 'Substituir Imagem do QR Code' : 'Selecionar Arquivo de Imagem'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Chamada do QR</label>
                      <input
                        type="text"
                        value={qrCodeLabel}
                        onChange={(e) => setQrCodeLabel(e.target.value)}
                        placeholder="Ex: Peça pelo WhatsApp"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Posição na Tela</label>
                      <select
                        value={qrCodePosition}
                        onChange={(e) => setQrCodePosition(e.target.value as QrCodePosition)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
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

            {/* 5. Identidade da Marca & Duração */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-400" />
                  <span>05. Marca da Empresa no Slide</span>
                </span>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBrand}
                    onChange={(e) => setShowBrand(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600"
                  />
                  <span>Exibir Logo e Nome</span>
                </label>
              </div>

              {showBrand && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-700/60">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nome da Empresa</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ex: Minha Empresa"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Slogan ou Subtítulo</label>
                    <input
                      type="text"
                      value={brandSlogan}
                      onChange={(e) => setBrandSlogan(e.target.value)}
                      placeholder="Ex: Desde 2018 com o melhor sabor"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Tempo de Exibição */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tempo de Exibição na TV:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {[8, 12, 15, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSeconds(sec)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        durationSeconds === sec
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
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
          <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Simulador da TV ao Vivo</span>
              </span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                16:9 FULL HD
              </span>
            </div>

            {/* Realistic TV Bezel */}
            <div className="bg-slate-950 rounded-2xl p-3 border-2 border-slate-700 shadow-2xl flex flex-col">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex flex-col justify-between shadow-inner">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-600 text-xs font-medium">
                    Selecione uma imagem
                  </div>
                )}

                {/* Darkness Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${overlayDarkness / 100})`,
                  }}
                />

                {/* 1. BRAND ON TV */}
                {showBrand && (
                  <div
                    className={`relative z-10 p-2.5 flex items-center gap-2 ${
                      brandPosition === 'top-right' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md"
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        borderColor: `${accentColor}60`,
                      }}
                    >
                      {brandLogo ? (
                        <img src={brandLogo} alt="Logo" className="w-5 h-5 object-contain rounded" />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Store className="w-3 h-3" />
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold text-[11px] text-white tracking-wide uppercase leading-tight">
                          {brandName || companyProfile.name || 'Minha Empresa'}
                        </div>
                        {(brandSlogan || companyProfile.slogan) && (
                          <div className="text-[8px] text-slate-300 font-medium tracking-tight">
                            {brandSlogan || companyProfile.slogan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. QR CODE ON TV */}
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
                    <div className="bg-white p-1.5 rounded-xl shadow-2xl flex flex-col items-center max-w-[110px] border border-white">
                      <div
                        className={`${
                          qrCodeSize === 'small' ? 'w-12 h-12' : qrCodeSize === 'medium' ? 'w-16 h-16' : 'w-20 h-20'
                        }`}
                      >
                        <img src={resolvedQrImage} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      {qrCodeLabel && (
                        <span className="text-[7.5px] font-extrabold text-slate-900 text-center leading-tight mt-1">
                          {qrCodeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. HEADLINE, BADGE & PRICE */}
                <div className="relative z-10 p-3 mt-auto">
                  <div className="max-w-[70%] space-y-1">
                    {showOverlayBadge && badgeText && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase text-white shadow-md tracking-wider"
                        style={{ backgroundColor: accentColor }}
                      >
                        {badgeText}
                      </span>
                    )}

                    {headline && (
                      <h4 className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-md">
                        {headline}
                      </h4>
                    )}

                    {subheadline && (
                      <p className="text-slate-200 text-[9px] line-clamp-2 drop-shadow leading-snug">
                        {subheadline}
                      </p>
                    )}

                    {showPriceTag && (priceOriginal || pricePromo) && (
                      <div className="flex items-center gap-2 pt-1">
                        {priceOriginal && (
                          <span className="text-slate-300 text-[10px] line-through font-semibold drop-shadow">
                            {priceOriginal}
                          </span>
                        )}
                        {pricePromo && (
                          <span
                            className="text-xs sm:text-sm font-black text-white px-2 py-0.5 rounded-lg shadow-lg"
                            style={{ backgroundColor: accentColor }}
                          >
                            {pricePromo}
                          </span>
                        )}
                        {discountBadge && (
                          <span className="text-[9px] font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow">
                            {discountBadge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToActivePlaylist}
                  onChange={(e) => setAddToActivePlaylist(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600"
                />
                <span>Transmitir na TV imediatamente</span>
              </label>
              <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                AO VIVO
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{initialItem ? 'Salvar Alterações' : 'Publicar Slide na TV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
