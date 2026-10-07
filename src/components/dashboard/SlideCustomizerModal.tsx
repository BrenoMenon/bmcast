import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Check,
  Store,
  QrCode,
  Image as ImageIcon,
  Tag,
  Palette,
  Eye,
  Sliders,
  Type,
  Trash2,
} from 'lucide-react';
import {
  MediaItem,
  SlideCategoryType,
  CompanyBrandProfile,
  QrCodePosition,
  QrCodeSize,
  BrandPosition,
} from '../../types/signage';
import { qrService } from '../../services/qrService';
import { useTheme } from '../../context/ThemeContext';

interface SlideCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: MediaItem, addToPlaylist: boolean) => void;
  initialItem?: MediaItem | null;
  companyProfile: CompanyBrandProfile;
}

const CATEGORY_TABS: { id: SlideCategoryType; label: string }[] = [
  { id: 'cardapio', label: 'Cardápio / Produtos' },
  { id: 'promo', label: 'Oferta / Promoção' },
  { id: 'aviso', label: 'Comunicado / Aviso' },
  { id: 'mural', label: 'Institucional' },
];

// Clean solid / studio backgrounds (NO unsplash links)
const PRESET_SOLID_THEMES = [
  { label: 'Grafite Escuro', color: '#0f172a' },
  { label: 'Azul Corporativo', color: '#1e3a8a' },
  { label: 'Verde Esmeralda', color: '#064e3b' },
  { label: 'Vinho Bordô', color: '#4c0519' },
  { label: 'Terracota', color: '#7c2d12' },
  { label: 'Preto Absoluto', color: '#000000' },
];

// WhatsApp Icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.3C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.68C7.02 10.88 7.9 12.03 8.02 12.19C8.14 12.35 9.73 14.81 12.17 15.86C12.75 16.11 13.2 16.26 13.55 16.37C14.13 16.55 14.66 16.53 15.08 16.47C15.55 16.4 16.52 15.88 16.73 15.3C16.93 14.72 16.93 14.22 16.87 14.12C16.81 14.02 16.66 13.96 16.43 13.85C16.2 13.73 15.09 13.19 14.89 13.11C14.68 13.04 14.53 13 14.37 13.24C14.22 13.48 13.78 14.02 13.64 14.17C13.51 14.33 13.37 14.35 13.15 14.23C12.92 14.12 12.19 13.88 11.32 13.11C10.65 12.51 10.19 11.77 10.06 11.55C9.94 11.33 10.05 11.2 10.16 11.09C10.27 10.98 10.4 10.8 10.52 10.66C10.64 10.52 10.68 10.41 10.76 10.25C10.84 10.09 10.8 9.94 10.74 9.83C10.68 9.72 10.22 8.59 10.03 8.12C9.84 7.67 9.65 7.73 9.5 7.72C9.37 7.72 9.21 7.71 9.06 7.71C8.9 7.71 8.65 7.77 8.53 7.33Z" />
  </svg>
);

const formatWhatsAppPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const FULL_COLOR_PALETTE = [
  '#0d9488', '#06b6d4', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
  '#9333ea', '#c026d3', '#db2777', '#e11d48', '#dc2626', '#ea580c',
  '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0f172a'
];

// Generate simple SVG data URL for solid card background
function createColorSvg(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="${color}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const SlideCustomizerModal: React.FC<SlideCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialItem,
  companyProfile,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'content' | 'brand' | 'qr' | 'style'>('content');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  // Slide Basic Data
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SlideCategoryType>('cardapio');
  const [imageUrl, setImageUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(12);
  const [addToActivePlaylist, setAddToActivePlaylist] = useState(true);

  // Overlay Content
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [priceOriginal, setPriceOriginal] = useState('');
  const [pricePromo, setPricePromo] = useState('');
  const [showPriceTag, setShowPriceTag] = useState(true);
  const [showOverlayBadge, setShowOverlayBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('DESTAQUE');
  const [accentColor, setAccentColor] = useState('#0d9488');

  // Brand config
  const [showBrand, setShowBrand] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandPosition, setBrandPosition] = useState<BrandPosition>('top-left');

  // QR Code config
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeType, setQrCodeType] = useState<'generated' | 'custom_upload'>('generated');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeCustomImage, setQrCodeCustomImage] = useState('');
  const [qrCodeLabel, setQrCodeLabel] = useState('');
  const [qrCodePosition, setQrCodePosition] = useState<QrCodePosition>('bottom-right');
  const [qrCodeSize, setQrCodeSize] = useState<QrCodeSize>('medium');

  // Dynamic QR Code generation cache
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || '');
      setCategory(initialItem.category || 'cardapio');
      setImageUrl(initialItem.url || '');
      setDurationSeconds(initialItem.durationDefault || 12);

      // Overlays
      const ov = initialItem.categoryOverlay;
      setHeadline(ov?.headline || initialItem.title || '');
      setSubheadline(ov?.subheadline || '');
      setPriceOriginal(ov?.priceOriginal || '');
      setPricePromo(ov?.pricePromo || '');
      setShowPriceTag(ov?.showPriceTag ?? true);
      setShowOverlayBadge(ov?.showOverlayBadge ?? true);
      setBadgeText(ov?.badgeText || 'DESTAQUE');
      setAccentColor(ov?.accentColor || companyProfile.accentColor || '#0d9488');

      // Brand
      const br = initialItem.brandConfig;
      setShowBrand(br?.showBrand ?? true);
      setBrandName(br?.brandName || companyProfile.name || '');
      setBrandSlogan(br?.brandSlogan || companyProfile.slogan || '');
      setBrandLogo(br?.brandLogo || companyProfile.logoUrl || '');
      setBrandPosition(br?.brandPosition || 'top-left');

      // QR
      const qr = initialItem.qrConfig;
      setShowQrCode(qr?.showQrCode ?? false);
      setQrCodeType(qr?.qrCodeType || 'generated');
      setQrCodeUrl(qr?.qrCodeUrl || companyProfile.defaultQrCodeUrl || '');
      setQrCodeCustomImage(qr?.qrCodeCustomImage || companyProfile.defaultQrCodeImage || '');
      setQrCodeLabel(qr?.qrCodeLabel || 'Aponte a câmera');
      setQrCodePosition(qr?.qrCodePosition || 'bottom-right');
      setQrCodeSize(qr?.qrCodeSize || 'medium');
    } else {
      // New Slide: completely clean defaults, no unsplash images
      setTitle('');
      setCategory('cardapio');
      setImageUrl('');
      setDurationSeconds(12);

      setHeadline('');
      setSubheadline('');
      setPriceOriginal('');
      setPricePromo('');
      setShowPriceTag(true);
      setShowOverlayBadge(true);
      setBadgeText('DESTAQUE');
      setAccentColor(companyProfile.accentColor || '#0d9488');

      setShowBrand(true);
      setBrandName(companyProfile.name || '');
      setBrandSlogan(companyProfile.slogan || '');
      setBrandLogo(companyProfile.logoUrl || '');
      setBrandPosition('top-left');

      setShowQrCode(false);
      setQrCodeType('generated');
      setQrCodeUrl(companyProfile.defaultQrCodeUrl || '');
      setQrCodeCustomImage(companyProfile.defaultQrCodeImage || '');
      setQrCodeLabel('Acesse pelo QR Code');
      setQrCodePosition('bottom-right');
      setQrCodeSize('medium');
    }
  }, [initialItem, companyProfile, isOpen]);

  // Update dynamic QR preview
  useEffect(() => {
    let isMounted = true;
    if (showQrCode && qrCodeType === 'generated') {
      const targetUrl = qrCodeUrl.trim() || 'https://bmcast.app';
      qrService.generateDataUrl(targetUrl).then((url) => {
        if (isMounted) setGeneratedQrDataUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [showQrCode, qrCodeType, qrCodeUrl]);

  // Upload image handler
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setImageUrl(dataUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (!headline) {
        setHeadline(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
    }
  };

  // Upload QR code image handler
  const handleUploadQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setQrCodeCustomImage(dataUrl);
      setQrCodeType('custom_upload');
    } catch (err) {
      console.error('Erro ao carregar QR code:', err);
    }
  };

  const handleSave = () => {
    const resolvedTitle = title.trim() || headline.trim() || 'Novo Slide';

    // If no image is provided, provide a clean dark canvas
    const finalImageUrl = imageUrl || createColorSvg('#0f172a');

    const item: MediaItem = {
      id: initialItem?.id || `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: resolvedTitle,
      type: 'image',
      url: finalImageUrl,
      thumbnail: finalImageUrl,
      durationDefault: durationSeconds,
      category,
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      dimensions: '1920x1080',
      brandConfig: {
        showBrand,
        brandName: brandName.trim(),
        brandSlogan: brandSlogan.trim(),
        brandLogo: brandLogo.trim(),
        brandPosition,
        accentColor,
      },
      qrConfig: {
        showQrCode,
        qrCodeType,
        qrCodeUrl: qrCodeUrl.trim(),
        qrCodeCustomImage: qrCodeCustomImage.trim(),
        qrCodeLabel: qrCodeLabel.trim(),
        qrCodePosition,
        qrCodeSize,
      },
      categoryOverlay: {
        showOverlayBadge,
        showPriceTag,
        badgeText: badgeText.trim(),
        headline: headline.trim(),
        subheadline: subheadline.trim(),
        priceOriginal: priceOriginal.trim(),
        pricePromo: pricePromo.trim(),
        accentColor,
        position: 'bottom',
      },
    };

    onSuccess(item, addToActivePlaylist);
    onClose();
  };

  if (!isOpen) return null;

  const resolvedQrImage =
    qrCodeType === 'custom_upload' && qrCodeCustomImage
      ? qrCodeCustomImage
      : generatedQrDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDark ? 'border-slate-800 bg-[#0b1120]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {initialItem ? 'Editar Slide da TV' : 'Criar Novo Slide'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Personalize imagens, títulos, marca, preços e QR Code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setMobileTab('edit')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  mobileTab === 'edit'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  mobileTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Simulador
              </button>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls Column */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            {/* Category selection */}
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Categoria do Slide
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer truncate ${
                      category === cat.id
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : isDark
                        ? 'bg-[#152033] text-slate-300 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inner Tabs: Content, Brand, QR Code, Style */}
            <div className={`flex border-b text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'content'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Conteúdo & Imagem</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('brand')}
                className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'brand'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Marca</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'qr'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`py-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'style'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Cores & Destaque</span>
              </button>
            </div>

            {/* TAB 1: CONTENT & IMAGE */}
            {activeTab === 'content' && (
              <div className="space-y-3 pt-1">
                {/* Background Image Upload or Color Picker */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Imagem de Fundo do Slide
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadFile}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-500" />
                      <span>{imageUrl ? 'Trocar Imagem do Slide' : 'Upload de Imagem (PC / Celular)'}</span>
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer text-rose-500 ${
                          isDark ? 'border-slate-700 hover:bg-rose-500/10' : 'border-slate-300 hover:bg-rose-50'
                        }`}
                        title="Limpar Imagem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Opção para colar URL direta da imagem */}
                  <div className="mt-2.5">
                    <span className={`block text-[10px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Ou colar URL da imagem:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrl.startsWith('data:') ? '' : imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Cole aqui o link da imagem (https://...)"
                        className={`flex-1 px-3 py-1.5 border rounded-xl text-xs font-mono transition-colors focus:outline-none focus:border-sky-500 ${
                          isDark
                            ? 'bg-[#0b1120] border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      {imageUrl && !imageUrl.startsWith('data:') && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 border border-slate-700 rounded-xl"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clean Solid Colors as alternative background */}
                  <div className="mt-2.5">
                    <span className={`block text-[10px] font-medium mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Ou escolha uma cor sólida de fundo:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SOLID_THEMES.map((themePreset) => (
                        <button
                          key={themePreset.color}
                          type="button"
                          onClick={() => setImageUrl(createColorSvg(themePreset.color))}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${
                            isDark
                              ? 'bg-[#152033] border-slate-700 text-slate-300 hover:border-slate-500'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: themePreset.color }}
                          />
                          <span>{themePreset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Headline & Subheadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Título Principal *
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => {
                        setHeadline(e.target.value);
                        if (!title) setTitle(e.target.value);
                      }}
                      placeholder="Ex: Café Especial & Waffle"
                      className={`w-full px-3 py-2 border rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                        isDark
                          ? 'bg-[#0b1120] border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Subtítulo / Descrição
                    </label>
                    <input
                      type="text"
                      value={subheadline}
                      onChange={(e) => setSubheadline(e.target.value)}
                      placeholder="Ex: Acompanha calda artesanal de frutas"
                      className={`w-full px-3 py-2 border rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                        isDark
                          ? 'bg-[#0b1120] border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Price tag inputs */}
                <div
                  className={`p-3 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-[#152033] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Preço / Valor no Slide
                    </span>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPriceTag}
                        onChange={(e) => setShowPriceTag(e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Exibir Preço</span>
                    </label>
                  </div>

                  {showPriceTag && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[10px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Preço De (Opcional - Riscado)
                        </label>
                        <input
                          type="text"
                          value={priceOriginal}
                          onChange={(e) => setPriceOriginal(e.target.value)}
                          placeholder="R$ 35,00"
                          className={`w-full px-3 py-1.5 border rounded-lg text-xs font-mono ${
                            isDark
                              ? 'bg-[#0b1120] border-slate-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Preço Promocional / Atual
                        </label>
                        <input
                          type="text"
                          value={pricePromo}
                          onChange={(e) => setPricePromo(e.target.value)}
                          placeholder="R$ 24,90"
                          className={`w-full px-3 py-1.5 border rounded-lg text-xs font-bold font-mono ${
                            isDark
                              ? 'bg-[#0b1120] border-slate-700 text-amber-400'
                              : 'bg-white border-slate-300 text-amber-600'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: BRAND */}
            {activeTab === 'brand' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Exibir Marca neste Slide
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Exibe seu logotipo e slogan no topo ou rodapé
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBrand}
                      onChange={(e) => setShowBrand(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Ativar Marca</span>
                  </label>
                </div>

                {showBrand && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Nome da Empresa
                        </label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder={companyProfile.name || 'Nome do Estabelecimento'}
                          className={`w-full px-3 py-2 border rounded-xl text-xs ${
                            isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={brandSlogan}
                          onChange={(e) => setBrandSlogan(e.target.value)}
                          placeholder={companyProfile.slogan || 'Qualidade & Tradição'}
                          className={`w-full px-3 py-2 border rounded-xl text-xs ${
                            isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Posição da Marca na Tela
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['top-left', 'top-right', 'header-bar'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setBrandPosition(pos)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              brandPosition === pos
                                ? 'bg-sky-600 text-white border-sky-600'
                                : isDark
                                ? 'bg-[#152033] text-slate-300 border-slate-700'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {pos === 'top-left' ? 'Superior Esquerda' : pos === 'top-right' ? 'Superior Direita' : 'Barra Superior'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QR CODE */}
            {activeTab === 'qr' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Exibir QR Code na TV
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Permite clientes escanearem cardápio, WhatsApp ou site
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Ativar QR Code</span>
                  </label>
                </div>

                {showQrCode && (
                  <div className="space-y-3 pt-2">
                    {/* Quick WhatsApp Link Helper */}
                    <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 ${
                      isDark ? 'bg-[#152033] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#25D366]">
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>Preencher com WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="(xx) xxxxx-xxxx"
                          maxLength={15}
                          onChange={(e) => {
                            const formatted = formatWhatsAppPhone(e.target.value);
                            e.target.value = formatted;
                            const digits = formatted.replace(/\D/g, '');
                            if (digits.length >= 10) {
                              setQrCodeUrl(`https://wa.me/55${digits}`);
                              setQrCodeType('generated');
                            }
                          }}
                          className={`w-36 px-2.5 py-1 text-xs border rounded-lg font-mono ${
                            isDark ? 'bg-[#090d16] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Link / URL do QR Code
                      </label>
                      {qrCodeUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const u = qrCodeUrl.startsWith('http') ? qrCodeUrl : `https://${qrCodeUrl}`;
                            window.open(u, '_blank', 'noopener,noreferrer');
                          }}
                          className="text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Testar Link</span>
                        </button>
                      )}
                    </div>
                    <div className="p-0.5">
                      <input
                        type="text"
                        value={qrCodeUrl}
                        onChange={(e) => {
                          setQrCodeUrl(e.target.value);
                          setQrCodeType('generated');
                        }}
                        placeholder="https://wa.me/5511... ou https://seusite.com"
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono transition-colors focus:outline-none focus:border-sky-500 ${
                          isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      O QR code é gerado em tempo real e redireciona qualquer pessoa que escanear com a câmera.
                    </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Legenda do QR Code
                        </label>
                        <input
                          type="text"
                          value={qrCodeLabel}
                          onChange={(e) => setQrCodeLabel(e.target.value)}
                          placeholder="Ex: Peça pelo WhatsApp"
                          className={`w-full px-3 py-2 border rounded-xl text-xs ${
                            isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Posição na Tela
                        </label>
                        <select
                          value={qrCodePosition}
                          onChange={(e) => setQrCodePosition(e.target.value as QrCodePosition)}
                          className={`w-full px-3 py-2 border rounded-xl text-xs ${
                            isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
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
            )}

            {/* TAB 4: STYLE & HIGHLIGHT */}
            {activeTab === 'style' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Etiqueta de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Ex: MAIS VENDIDO, PROMOÇÃO, NOVIDADE"
                      className={`flex-1 px-3 py-2 border rounded-xl text-xs uppercase font-bold ${
                        isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOverlayBadge}
                        onChange={(e) => setShowOverlayBadge(e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Exibir</span>
                    </label>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-[#0b1120] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Selecione Qualquer Cor de Destaque
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        placeholder="#000000"
                        maxLength={7}
                        className={`w-20 px-2 py-0.5 border rounded-lg text-xs font-mono font-bold text-center ${
                          isDark ? 'bg-[#152033] border-slate-700 text-sky-400' : 'bg-white border-slate-300 text-sky-700'
                        }`}
                      />
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                        title="Abrir seletor de todas as cores"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {FULL_COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        className={`w-6 h-6 rounded-md transition-transform cursor-pointer border border-black/20 ${
                          accentColor.toLowerCase() === c.toLowerCase()
                            ? 'ring-2 ring-sky-400 scale-110 shadow-sm'
                            : 'opacity-85 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Duration & Playlist option */}
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-[#152033] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Duração do Slide:
                </span>
                <div className="flex gap-1">
                  {[8, 12, 15, 20].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSeconds(sec)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        durationSeconds === sec
                          ? 'bg-sky-600 text-white'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToActivePlaylist}
                  onChange={(e) => setAddToActivePlaylist(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  Adicionar à grade da TV agora
                </span>
              </label>
            </div>
          </div>

          {/* Simulator Column */}
          <div className={`lg:col-span-5 space-y-3 ${mobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Simulador da TV ao Vivo
              </span>
              <span className="text-[10px] font-mono text-slate-500">16:9 FULL HD</span>
            </div>

            {/* Realistic TV Bezel */}
            <div className="bg-black rounded-xl p-2.5 border border-slate-800 shadow-xl flex flex-col">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex flex-col justify-between">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-medium">
                    Slide em Branco
                  </div>
                )}

                {/* Subtle dark gradient for high legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/50 pointer-events-none" />

                {/* 1. BRAND */}
                {showBrand && (
                  <div
                    className={`relative z-10 p-2 flex items-center ${
                      brandPosition === 'top-right'
                        ? 'justify-end'
                        : brandPosition === 'header-bar'
                        ? 'bg-black/60 border-b border-white/10 w-full justify-between'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm"
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        borderColor: `${accentColor}50`,
                      }}
                    >
                      {brandLogo ? (
                        <img src={brandLogo} alt="Logo" className="w-3.5 h-3.5 object-contain rounded" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-white" />
                      )}
                      <div>
                        <div className="font-bold text-[9.5px] text-white tracking-wide uppercase leading-none">
                          {brandName || companyProfile.name || 'Empório & Café Bella Vista'}
                        </div>
                        {(brandSlogan || companyProfile.slogan) && (
                          <div className="text-[7.5px] text-slate-400 font-medium tracking-tight mt-0.5 leading-none">
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
                        : 'top-2 left-2'
                    }`}
                  >
                    <div className="bg-white p-1 rounded-md shadow-lg flex flex-col items-center max-w-[90px]">
                      <div
                        className={`${
                          qrCodeSize === 'small' ? 'w-10 h-10' : qrCodeSize === 'medium' ? 'w-14 h-14' : 'w-18 h-18'
                        }`}
                      >
                        <img src={resolvedQrImage} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      {qrCodeLabel && (
                        <span className="text-[6.5px] font-bold text-slate-900 text-center leading-tight mt-0.5">
                          {qrCodeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. HEADLINE & PRICE */}
                <div className="relative z-10 p-2 mt-auto">
                  <div className="max-w-[75%] space-y-0.5">
                    {showOverlayBadge && badgeText && (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase text-white shadow-xs"
                        style={{ backgroundColor: accentColor }}
                      >
                        {badgeText}
                      </span>
                    )}

                    {headline ? (
                      <h4 className="text-white font-extrabold text-xs sm:text-sm leading-tight drop-shadow-md">
                        {headline}
                      </h4>
                    ) : (
                      <h4 className="text-white/60 font-medium text-xs leading-tight">
                        Título do Slide
                      </h4>
                    )}

                    {subheadline && (
                      <p className="text-slate-200 text-[8px] line-clamp-1 drop-shadow-xs">
                        {subheadline}
                      </p>
                    )}

                    {showPriceTag && (priceOriginal || pricePromo) && (
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        {priceOriginal && (
                          <span className="text-slate-400 text-[8.5px] line-through font-mono">
                            {priceOriginal}
                          </span>
                        )}
                        {pricePromo && (
                          <span
                            className="text-[11px] font-extrabold text-white px-1.5 py-0.5 rounded shadow-xs font-mono"
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
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between gap-2 ${
            isDark ? 'border-slate-800 bg-[#0b1120]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{initialItem ? 'Salvar Alterações' : 'Publicar Slide'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
