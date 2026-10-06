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
  companyProfile: CompanyBrandProfile;
}

const CATEGORIES: {
  id: SlideCategoryType;
  title: string;
  badge: string;
  desc: string;
  icon: any;
  defaultAccent: string;
  defaultHeadline: string;
  defaultSubheadline: string;
  defaultOriginalPrice?: string;
  defaultPromoPrice?: string;
  defaultQrLabel: string;
}[] = [
  {
    id: 'cardapio',
    title: 'Cardápio & Menu Gourmet',
    badge: 'CARDÁPIO DO CHEF',
    desc: 'Pratos, hambúrgueres, pizzas, combos e bebidas com preços.',
    icon: Utensils,
    defaultAccent: '#2563EB',
    defaultHeadline: 'Hambúrguer Artesanal Especial',
    defaultSubheadline: 'Blend bovino 180g, queijo cheddar derretido, bacon crocante e batata frita.',
    defaultOriginalPrice: 'R$ 38,90',
    defaultPromoPrice: 'R$ 29,90',
    defaultQrLabel: 'Peça no WhatsApp e retire no balcão',
  },
  {
    id: 'promo',
    title: 'Super Promoção & Ofertas',
    badge: 'SUPER OFERTA LIMITADA',
    desc: 'Ofertas relâmpago, descontos de happy hour e queima de produtos.',
    icon: Flame,
    defaultAccent: '#E11D48',
    defaultHeadline: 'Combo Especial com Desconto',
    defaultSubheadline: 'Válido somente para consumo no salão hoje até às 22h.',
    defaultOriginalPrice: 'R$ 89,90',
    defaultPromoPrice: 'R$ 59,90',
    defaultQrLabel: 'Garanta seu cupom pelo WhatsApp',
  },
  {
    id: 'aviso',
    title: 'Quadro de Avisos & Institucional',
    badge: 'COMUNICADO IMPORTANTE',
    desc: 'Horários de funcionamento, Wi-Fi da loja, regras e comunicados.',
    icon: Megaphone,
    defaultAccent: '#059669',
    defaultHeadline: 'Conecte-se ao Wi-Fi Grátis da Casa',
    defaultSubheadline: 'Aproveite nossa conexão de alta velocidade enquanto aguarda seu pedido.',
    defaultQrLabel: 'Aponte a câmera e conecte ao Wi-Fi',
  },
  {
    id: 'mural',
    title: 'Mural de Fotos & Lançamentos',
    badge: 'NOVIDADES & LANÇAMENTOS',
    desc: 'Galeria fotográfica de produtos, novo ambiente, eventos e novidades.',
    icon: ImageIcon,
    defaultAccent: '#7C3AED',
    defaultHeadline: 'Novidades & Espaço Climatizado',
    defaultSubheadline: 'Venha celebrar com seus amigos em nosso ambiente aconchegante.',
    defaultQrLabel: 'Siga nosso Instagram e confira fotos',
  },
];

const PRESET_STOCK_IMAGES = [
  {
    label: 'Hambúrguer Smash',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1920&q=80',
  },
  {
    label: 'Pizza Forno a Lenha',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1920&q=80',
  },
  {
    label: 'Chopp & Happy Hour',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1920&q=80',
  },
  {
    label: 'Sobremesa / Shake',
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1920&q=80',
  },
  {
    label: 'Café & Confeitaria',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
  },
  {
    label: 'Salão & Ambiente',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
  },
];

const COLOR_PRESETS = [
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Vermelho', hex: '#E11D48' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Âmbar', hex: '#D97706' },
  { name: 'Roxo', hex: '#7C3AED' },
  { name: 'Titânio', hex: '#334155' },
];

export const SlideCustomizerModal: React.FC<SlideCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialItem,
  companyProfile,
}) => {
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SlideCategoryType>('cardapio');
  const [durationSeconds, setDurationSeconds] = useState(12);
  const [addToActivePlaylist, setAddToActivePlaylist] = useState(true);

  // Brand config
  const [showBrand, setShowBrand] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandPosition, setBrandPosition] = useState<BrandPosition>('top-left');
  const [accentColor, setAccentColor] = useState('#2563EB');

  // Category Overlay config
  const [showOverlayBadge, setShowOverlayBadge] = useState(true);
  const [showPriceTag, setShowPriceTag] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [priceOriginal, setPriceOriginal] = useState('');
  const [pricePromo, setPricePromo] = useState('');

  // QR Code config
  const [showQrCode, setShowQrCode] = useState(true);
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
      setShowOverlayBadge(o?.showOverlayBadge !== false);
      setShowPriceTag(o?.showPriceTag !== false);
      setBadgeText(o?.badgeText || '');
      setHeadline(o?.headline || initialItem.title || '');
      setSubheadline(o?.subheadline || '');
      setPriceOriginal(o?.priceOriginal || '');
      setPricePromo(o?.pricePromo || '');

      const q = initialItem.qrConfig;
      setShowQrCode(q ? q.showQrCode : true);
      setQrCodeType(q?.qrCodeType || 'generated');
      setQrCodeUrl(q?.qrCodeUrl || companyProfile.defaultQrCodeUrl || 'https://wa.me/5511999999999');
      setQrCodeCustomImage(q?.qrCodeCustomImage || '');
      setQrCodeLabel(q?.qrCodeLabel || 'Peça no WhatsApp');
      setQrCodePosition(q?.qrCodePosition || 'bottom-right');
      setQrCodeSize(q?.qrCodeSize || 'medium');
    } else {
      const defaultCat = CATEGORIES[0];
      setTitle('Novo Slide');
      setImageUrl(PRESET_STOCK_IMAGES[0].url);
      setSelectedCategory('cardapio');
      setDurationSeconds(12);

      setShowBrand(true);
      setBrandName(companyProfile.name || 'Minha Empresa');
      setBrandSlogan(companyProfile.slogan || 'Qualidade & Atendimento');
      setBrandLogo(companyProfile.logoUrl || '');
      setBrandPosition('top-left');
      setAccentColor(defaultCat.defaultAccent);

      setShowOverlayBadge(true);
      setShowPriceTag(true);
      setBadgeText(defaultCat.badge);
      setHeadline(defaultCat.defaultHeadline);
      setSubheadline(defaultCat.defaultSubheadline);
      setPriceOriginal(defaultCat.defaultOriginalPrice || 'R$ 38,90');
      setPricePromo(defaultCat.defaultPromoPrice || 'R$ 29,90');

      setShowQrCode(true);
      setQrCodeType('generated');
      setQrCodeUrl(companyProfile.defaultQrCodeUrl || 'https://wa.me/5511999999999');
      setQrCodeCustomImage('');
      setQrCodeLabel(defaultCat.defaultQrLabel);
      setQrCodePosition('bottom-right');
      setQrCodeSize('medium');
    }
  }, [initialItem, companyProfile, isOpen]);

  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      if (qrCodeType === 'generated') {
        const dataUrl = await qrService.generateDataUrl(
          qrCodeUrl || 'https://bmcast.app',
          '#000000',
          '#ffffff'
        );
        if (!isCancelled) {
          setGeneratedQrDataUrl(dataUrl);
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
      alert('Selecione uma imagem para o slide.');
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
    };

    const savedMediaItem: MediaItem = {
      id: initialItem?.id || `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim() || 'Slide',
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

  const resolvedQrImage = qrCodeType === 'custom_upload' && qrCodeCustomImage ? qrCodeCustomImage : generatedQrDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl bg-[#151f32] border border-[#25334a] rounded-3xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#25334a] bg-[#0d131f]">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white ">
              {initialItem ? 'Editar Slide da TV' : 'Criar Novo Slide'}
            </h2>
            <p className="text-[11px] text-slate-400">
              Personalização de marca, categoria comercial e posicionamento do QR Code
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab */}
            <div className="flex lg:hidden bg-[#151f32] p-0.5 rounded border border-[#25334a]">
              <button
                type="button"
                onClick={() => setMobileTab('edit')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                  mobileTab === 'edit' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Ajustes
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                  mobileTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Preview TV
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5">
          {/* Form Column (Desktop or mobileTab === 'edit') */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            {/* 1. Imagem de Fundo */}
            <div className="bg-[#0d131f] border border-[#25334a] rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  01. Imagem de Fundo (16:9)
                </span>
                <span className="text-[10px] text-slate-500 ">1920x1080</span>
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
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#151f32] hover:bg-slate-800 border border-[#25334a] text-slate-200 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  Subir Imagem do Dispositivo
                </button>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Ou cole o link da imagem..."
                  className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                {PRESET_STOCK_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      if (!title || title === 'Novo Slide') setTitle(preset.label);
                    }}
                    className={`relative aspect-video rounded overflow-hidden border transition-colors cursor-pointer ${
                      imageUrl === preset.url
                        ? 'border-blue-500'
                        : 'border-[#25334a] hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] text-white py-0.5 text-center truncate px-0.5">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Categoria */}
            <div className="bg-[#0d131f] border border-[#25334a] rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                02. Categoria Comercial
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`p-2.5 rounded border transition-colors cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-[#151f32] border-blue-500'
                          : 'bg-[#151f32]/60 border-[#25334a] hover:border-[#2B354C]'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{cat.title}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{cat.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Marca da Empresa no Slide */}
            <div className="bg-[#0d131f] border border-[#25334a] rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  03. Marca da Empresa
                </span>

                <label className="text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBrand}
                    onChange={(e) => setShowBrand(e.target.checked)}
                    className="rounded bg-[#151f32] border-[#2B354C] text-blue-600"
                  />
                  Mostrar marca neste slide
                </label>
              </div>

              {showBrand && (
                <div className="space-y-2 pt-1 border-t border-[#25334a]/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nome no Slide</label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ex: Minha Empresa"
                        className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Slogan</label>
                      <input
                        type="text"
                        value={brandSlogan}
                        onChange={(e) => setBrandSlogan(e.target.value)}
                        placeholder="Ex: Qualidade & Atendimento"
                        className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Posição na Tela</label>
                      <select
                        value={brandPosition}
                        onChange={(e) => setBrandPosition(e.target.value as BrandPosition)}
                        className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="top-left">Canto Superior Esquerdo</option>
                        <option value="top-right">Canto Superior Direito</option>
                        <option value="header-bar">Barra Superior Completa</option>
                        <option value="bottom-left">Canto Inferior Esquerdo</option>
                        <option value="bottom-right">Canto Inferior Direito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Logo Específico</label>
                      <input
                        type="file"
                        ref={brandLogoInputRef}
                        onChange={handleBrandLogoFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => brandLogoInputRef.current?.click()}
                        className="w-full py-1.5 px-2 bg-[#151f32] hover:bg-slate-800 border border-[#25334a] rounded text-xs text-slate-300 transition-colors cursor-pointer truncate"
                      >
                        {brandLogo ? 'Trocar Logo' : 'Subir Arquivo de Logo'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cor da Marca</label>
                    <div className="flex items-center gap-1.5">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setAccentColor(c.hex)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            accentColor === c.hex ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. QR Code */}
            <div className="bg-[#0d131f] border border-[#25334a] rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  04. QR Code do Slide
                </span>

                <label className="text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="rounded bg-[#151f32] border-[#2B354C] text-blue-600"
                  />
                  Exibir QR Code
                </label>
              </div>

              {showQrCode && (
                <div className="space-y-2 pt-1 border-t border-[#25334a]/80">
                  <div className="flex bg-[#151f32] p-1 rounded border border-[#25334a]">
                    <button
                      type="button"
                      onClick={() => setQrCodeType('generated')}
                      className={`flex-1 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        qrCodeType === 'generated' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                    >
                      Gerar por Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrCodeType('custom_upload')}
                      className={`flex-1 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        qrCodeType === 'custom_upload' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                    >
                      Subir QR Real
                    </button>
                  </div>

                  {qrCodeType === 'generated' ? (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Link de Destino</label>
                      <input
                        type="text"
                        value={qrCodeUrl}
                        onChange={(e) => setQrCodeUrl(e.target.value)}
                        placeholder="https://wa.me/... ou https://..."
                        className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white  focus:outline-none focus:border-blue-500"
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
                        className="w-full py-1.5 px-2 bg-[#151f32] hover:bg-slate-800 border border-[#25334a] rounded text-xs text-slate-300 transition-colors cursor-pointer"
                      >
                        {qrCodeCustomImage ? 'Substituir Imagem do QR' : 'Selecionar Arquivo'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Chamada Abaixo do QR</label>
                      <input
                        type="text"
                        value={qrCodeLabel}
                        onChange={(e) => setQrCodeLabel(e.target.value)}
                        placeholder="Ex: Peça pelo WhatsApp"
                        className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Posição na Tela</label>
                      <select
                        value={qrCodePosition}
                        onChange={(e) => setQrCodePosition(e.target.value as QrCodePosition)}
                        className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="bottom-right">Canto Inferior Direito</option>
                        <option value="bottom-left">Canto Inferior Esquerdo</option>
                        <option value="top-right">Canto Superior Direito</option>
                        <option value="top-left">Canto Superior Esquerdo</option>
                        <option value="center-right">Lateral Centro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Textos e Preços */}
            <div className="bg-[#0d131f] border border-[#25334a] rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                05. Título e Preços
              </span>

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Badge</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Ex: OFERTA"
                      className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Título do Slide</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Ex: Hambúrguer Artesanal com Batata"
                      className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="Ex: Acompanha refrigerante e molho..."
                    className="w-full px-2.5 py-1.5 bg-[#151f32] border border-[#25334a] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-[#151f32] rounded border border-[#25334a]">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Preço Normal</label>
                    <input
                      type="text"
                      value={priceOriginal}
                      onChange={(e) => setPriceOriginal(e.target.value)}
                      placeholder="Ex: R$ 45,90"
                      className="w-full px-2 py-1 bg-[#0d131f] border border-[#25334a] rounded text-xs text-slate-400 line-through  tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-blue-400 mb-1">Preço Promocional</label>
                    <input
                      type="text"
                      value={pricePromo}
                      onChange={(e) => setPricePromo(e.target.value)}
                      placeholder="Ex: R$ 34,90"
                      className="w-full px-2 py-1 bg-[#0d131f] border border-[#25334a] rounded text-xs text-blue-300 font-bold  tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Duração */}
            <div className="flex items-center justify-between p-2.5 bg-[#0d131f] border border-[#25334a] rounded">
              <span className="text-xs text-slate-300">Tempo de Exibição:</span>
              <div className="flex items-center gap-1">
                {[8, 12, 15, 20, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSeconds(sec)}
                    className={`px-2 py-1 rounded text-xs  tabular-nums ${
                      durationSeconds === sec
                        ? 'bg-[#2dd4bf] text-[#042f2e] font-bold'
                        : 'bg-[#151f32] text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TV Live Preview Column (Desktop or mobileTab === 'preview') */}
          <div className={`lg:col-span-5 space-y-3 ${mobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Simulador da TV ao Vivo
              </span>
              <span className="text-[10px] text-slate-500 ">16:9 FULL HD</span>
            </div>

            {/* Realistic TV Bezel */}
            <div className="bg-black rounded-lg p-2 border border-[#25334a] flex flex-col">
              <div className="relative aspect-video bg-black rounded overflow-hidden flex flex-col justify-between">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-600 text-xs">
                    Sem imagem
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                {/* 1. BRAND */}
                {showBrand && (
                  <div
                    className={`relative z-10 p-2 flex items-center gap-2 ${
                      brandPosition === 'top-right'
                        ? 'justify-end'
                        : brandPosition === 'header-bar'
                        ? 'bg-black/60 border-b border-white/10 w-full justify-between'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded border shadow-sm"
                      style={{
                        backgroundColor: 'rgba(9, 13, 22, 0.85)',
                        borderColor: `${accentColor}50`,
                      }}
                    >
                      {brandLogo ? (
                        <img src={brandLogo} alt="Logo" className="w-4 h-4 object-contain rounded" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-white" />
                      )}
                      <div>
                        <div className="font-bold text-[10px] text-white tracking-wide uppercase  leading-none">
                          {brandName || companyProfile.name || 'Minha Empresa'}
                        </div>
                        {(brandSlogan || companyProfile.slogan) && (
                          <div className="text-[8px] text-slate-400 font-medium tracking-tight mt-0.5">
                            {brandSlogan || companyProfile.slogan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. QR CODE */}
                {showQrCode && resolvedQrImage && (
                  <div
                    className={`absolute z-20 p-2 ${
                      qrCodePosition === 'bottom-right'
                        ? 'bottom-2 right-2'
                        : qrCodePosition === 'bottom-left'
                        ? 'bottom-2 left-2'
                        : qrCodePosition === 'top-right'
                        ? 'top-2 right-2'
                        : qrCodePosition === 'top-left'
                        ? 'top-2 left-2'
                        : 'top-1/2 -translate-y-1/2 right-2'
                    }`}
                  >
                    <div className="bg-white p-1 rounded shadow flex flex-col items-center max-w-[100px]">
                      <div
                        className={`${
                          qrCodeSize === 'small' ? 'w-12 h-12' : qrCodeSize === 'medium' ? 'w-16 h-16' : 'w-20 h-20'
                        }`}
                      >
                        <img src={resolvedQrImage} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      {qrCodeLabel && (
                        <span className="text-[7px] font-bold text-slate-900 text-center leading-tight mt-0.5">
                          {qrCodeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. HEADLINE & PRICE */}
                <div className="relative z-10 p-2 mt-auto">
                  <div className="max-w-[70%] space-y-0.5">
                    {showOverlayBadge && badgeText && (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      >
                        {badgeText}
                      </span>
                    )}

                    {headline && (
                      <h4 className="text-white font-bold text-xs sm:text-sm leading-tight drop-shadow">
                        {headline}
                      </h4>
                    )}

                    {subheadline && (
                      <p className="text-slate-300 text-[8px] line-clamp-1 drop-shadow">
                        {subheadline}
                      </p>
                    )}

                    {showPriceTag && (priceOriginal || pricePromo) && (
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        {priceOriginal && (
                          <span className="text-slate-400 text-[9px] line-through  tabular-nums">
                            {priceOriginal}
                          </span>
                        )}
                        {pricePromo && (
                          <span
                            className="text-xs font-bold text-white px-1.5 py-0.5 rounded shadow  tabular-nums"
                            style={{ backgroundColor: accentColor }}
                          >
                            {pricePromo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-[#0d131f] border border-[#25334a] rounded flex items-center justify-between">
              <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToActivePlaylist}
                  onChange={(e) => setAddToActivePlaylist(e.target.checked)}
                  className="rounded bg-[#151f32] border-[#2B354C] text-blue-600"
                />
                Adicionar à TV imediatamente
              </label>
              <span className="text-[10px] text-blue-400 font-semibold ">AO VIVO</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#25334a] bg-[#0d131f] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-[#042f2e] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{initialItem ? 'Salvar Alterações' : 'Publicar Slide'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
