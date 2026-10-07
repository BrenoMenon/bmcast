import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Upload,
  Globe,
  Pipette,
  QrCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { CompanyBrandProfile } from '../../types/signage';
import { extractDominantColors } from '../../utils/colorExtractor';
import { useTheme } from '../../context/ThemeContext';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile: CompanyBrandProfile;
  onSave: (updatedBrand: CompanyBrandProfile) => void;
}

// Ícone oficial do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.42C8.86 7.42 8.56 7.49 8.31 7.76C8.06 8.03 7.37 8.68 7.37 10C7.37 11.33 8.34 12.6 8.48 12.78C8.61 12.97 10.39 15.71 13.11 16.89C13.76 17.17 14.26 17.34 14.66 17.46C15.31 17.67 15.9 17.64 16.37 17.57C16.89 17.49 17.98 16.91 18.21 16.27C18.44 15.63 18.44 15.08 18.37 14.96C18.3 14.85 18.12 14.78 17.84 14.64C17.57 14.5 16.21 13.83 15.96 13.74C15.71 13.65 15.53 13.6 15.35 13.88C15.16 14.15 14.65 14.75 14.5 14.93C14.34 15.11 14.19 15.14 13.91 15C13.64 14.86 12.75 14.57 11.71 13.64C10.89 12.92 10.35 12.02 10.21 11.74C10.07 11.47 10.2 11.31 10.33 11.18C10.46 11.05 10.61 10.85 10.76 10.69C10.9 10.52 10.95 10.4 11.04 10.22C11.13 10.03 11.09 9.87 11.02 9.74C10.95 9.6 10.4 8.27 10.18 7.72C9.95 7.18 9.73 7.26 9.56 7.25C9.4 7.25 9.22 7.25 9.04 7.42Z" />
  </svg>
);

// Máscara automática para telefone WhatsApp: (xx) xxxxx-xxxx
const formatWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
  brandProfile,
  onSave,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#0284c7');
  const [secondaryColor, setSecondaryColor] = useState('#0ea5e9');
  const [phoneWhatsApp, setPhoneWhatsApp] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [defaultQrCodeUrl, setDefaultQrCodeUrl] = useState('');
  const [defaultQrCodeImage, setDefaultQrCodeImage] = useState('');
  const [extractedFeedback, setExtractedFeedback] = useState<string | null>(null);

  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brandProfile) {
      setName(brandProfile.name || '');
      setSlogan(brandProfile.slogan || '');
      setLogoUrl(brandProfile.logoUrl || '');
      setAccentColor(brandProfile.accentColor || '#0284c7');
      setSecondaryColor(brandProfile.secondaryColor || '#0ea5e9');
      setPhoneWhatsApp(brandProfile.phoneWhatsApp ? formatWhatsApp(brandProfile.phoneWhatsApp) : '');
      setInstagramHandle(brandProfile.instagramHandle || '');
      setWebsiteUrl(brandProfile.websiteUrl || '');
      setDefaultQrCodeUrl(brandProfile.defaultQrCodeUrl || '');
      setDefaultQrCodeImage(brandProfile.defaultQrCodeImage || '');
    }
  }, [brandProfile, isOpen]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setLogoUrl(base64);

        // Extrai automaticamente 2 cores da marca
        const colors = await extractDominantColors(base64);
        setAccentColor(colors.primary);
        setSecondaryColor(colors.secondary);
        setExtractedFeedback(`2 cores detectadas: ${colors.primary} e ${colors.secondary}`);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro no upload de logo:', err);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setPhoneWhatsApp(formatted);
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || 'BM CAST',
      slogan: slogan.trim(),
      logoUrl: logoUrl.trim(),
      accentColor,
      secondaryColor,
      phoneWhatsApp: phoneWhatsApp.trim(),
      instagramHandle: instagramHandle.trim(),
      websiteUrl: websiteUrl.trim(),
      defaultQrCodeUrl: defaultQrCodeUrl.trim(),
      defaultQrCodeImage: defaultQrCodeImage.trim(),
    });
    onClose();
  };

  const handleTestQrUrl = () => {
    if (!defaultQrCodeUrl) return;
    const url = defaultQrCodeUrl.startsWith('http') ? defaultQrCodeUrl : `https://${defaultQrCodeUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-4 sm:p-5 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl border transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Marca & Identidade Visual
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Configurações oficiais exibidas nas TVs e nos slides
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - with padding to avoid border clipping */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 px-0.5">
          {/* Logo upload with automatic 2-color extraction */}
          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Logotipo da Empresa
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={logoFileRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoFileRef.current?.click()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-xs font-semibold transition-colors cursor-pointer box-border ${
                  isDark
                    ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span>{logoUrl ? 'Substituir Imagem do Logo' : 'Fazer Upload do Logo (Detecta 2 Cores)'}</span>
              </button>

              {logoUrl && (
                <div className="w-10 h-10 rounded-lg p-1 border border-slate-700 bg-black shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>

            {extractedFeedback && (
              <div className="mt-1.5 flex items-center gap-2 p-2 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 text-xs">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{extractedFeedback}</span>
              </div>
            )}
          </div>

          {/* Business Name and Slogan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nome da Empresa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: BM Digital"
                className={`w-full px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:border-sky-500 box-border ${
                  isDark
                    ? 'bg-[#090d16] border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Slogan Oficial
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Comunicação Visual & Mídia"
                className={`w-full px-3 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                  isDark
                    ? 'bg-[#090d16] border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* ALL COLORS PICKER (Primary & Secondary) */}
          <div
            className={`p-3 rounded-xl border space-y-3 box-border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {/* Primary Color Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Pipette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cor Primária da Marca</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    maxLength={7}
                    placeholder="#000000"
                    className={`w-20 px-2 py-0.5 border rounded-lg text-xs font-mono font-bold text-center box-border ${
                      isDark ? 'bg-[#152033] border-slate-700 text-sky-400' : 'bg-white border-slate-300 text-sky-700'
                    }`}
                  />
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    title="Clique para escolher QUALQUER cor no espectro completo"
                  />
                </div>
              </div>

              {/* Quick swatches */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {['#0284c7', '#38bdf8', '#0ea5e9', '#2563eb', '#0f172a', '#1e293b', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#7c3aed', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`w-6 h-6 rounded-md transition-transform cursor-pointer border border-black/20 ${
                      accentColor.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-sky-400 scale-110 shadow-xs'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Secondary Color Picker */}
            <div className={`pt-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Pipette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cor Secundária da Marca</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    maxLength={7}
                    placeholder="#000000"
                    className={`w-20 px-2 py-0.5 border rounded-lg text-xs font-mono font-bold text-center box-border ${
                      isDark ? 'bg-[#152033] border-slate-700 text-sky-400' : 'bg-white border-slate-300 text-sky-700'
                    }`}
                  />
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    title="Clique para escolher QUALQUER cor no espectro completo"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {['#0ea5e9', '#0284c7', '#38bdf8', '#1e293b', '#0f172a', '#475569', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSecondaryColor(color)}
                    className={`w-6 h-6 rounded-md transition-transform cursor-pointer border border-black/20 ${
                      secondaryColor.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-sky-400 scale-110 shadow-xs'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp with official logo & auto-mask (xx) xxxxx-xxxx */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="text-[#25D366]">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </span>
                <span>WhatsApp Oficial</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366]">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phoneWhatsApp}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:border-emerald-500 box-border ${
                    isDark
                      ? 'bg-[#090d16] border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Instagram Oficial
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@suaempresa"
                className={`w-full px-3 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                  isDark
                    ? 'bg-[#090d16] border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Website & QR Code Link */}
          <div>
            <label className={`block text-[11px] font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-sky-400" />
                <span>Link Padrão do QR Code (Direcionamento Real)</span>
              </span>
              {defaultQrCodeUrl && (
                <button
                  type="button"
                  onClick={handleTestQrUrl}
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Testar link no navegador</span>
                </button>
              )}
            </label>
            <div className="relative">
              <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={defaultQrCodeUrl}
                onChange={(e) => setDefaultQrCodeUrl(e.target.value)}
                placeholder="https://seusite.com.br ou wa.me/5511999999999"
                className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs transition-colors focus:outline-none focus:border-sky-500 box-border ${
                  isDark
                    ? 'bg-[#090d16] border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Marca</span>
          </button>
        </div>
      </div>
    </div>
  );
};
