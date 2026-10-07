import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Phone,
  Instagram,
  QrCode,
  Check,
  Store,
  Palette,
} from 'lucide-react';
import { CompanyBrandProfile } from '../../types/signage';
import { qrService } from '../../services/qrService';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile: CompanyBrandProfile;
  onSave?: (profile: CompanyBrandProfile) => void;
  onSaveProfile?: (profile: CompanyBrandProfile) => void;
}

const PRESET_COLORS = [
  { name: 'Azul Real', hex: '#2563EB' },
  { name: 'Azul Celeste', hex: '#38BDF8' },
  { name: 'Ciano Tech', hex: '#06B6D4' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Laranja Sunset', hex: '#F97316' },
  { name: 'Vermelho Fogo', hex: '#EF4444' },
  { name: 'Roxo Violeta', hex: '#8B5CF6' },
  { name: 'Rosa Pink', hex: '#EC4899' },
  { name: 'Dourado', hex: '#EAB308' },
];

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
  brandProfile,
  onSave,
  onSaveProfile,
}) => {
  const [name, setName] = useState(brandProfile.name);
  const [slogan, setSlogan] = useState(brandProfile.slogan || '');
  const [logoUrl, setLogoUrl] = useState(brandProfile.logoUrl || '');
  const [accentColor, setAccentColor] = useState(brandProfile.accentColor || brandProfile.primaryColor || '#2563EB');
  const [phoneWhatsApp, setPhoneWhatsApp] = useState(brandProfile.phoneWhatsApp || '');
  const [instagramHandle, setInstagramHandle] = useState(brandProfile.instagramHandle || '');
  const [defaultQrCodeUrl, setDefaultQrCodeUrl] = useState(brandProfile.defaultQrCodeUrl || '');
  const [defaultQrCodeImage, setDefaultQrCodeImage] = useState(brandProfile.defaultQrCodeImage || '');

  const logoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(brandProfile.name);
      setSlogan(brandProfile.slogan || '');
      setLogoUrl(brandProfile.logoUrl || '');
      setAccentColor(brandProfile.accentColor || brandProfile.primaryColor || '#2563EB');
      setPhoneWhatsApp(brandProfile.phoneWhatsApp || '');
      setInstagramHandle(brandProfile.instagramHandle || '');
      setDefaultQrCodeUrl(brandProfile.defaultQrCodeUrl || '');
      setDefaultQrCodeImage(brandProfile.defaultQrCodeImage || '');
    }
  }, [isOpen, brandProfile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setLogoUrl(dataUrl);
    } catch (err) {
      console.error('Erro upload logo:', err);
    }
  };

  const handleSave = () => {
    const profile: CompanyBrandProfile = {
      ...brandProfile,
      name: name.trim() || 'Minha Empresa',
      slogan: slogan.trim(),
      logoUrl: logoUrl.trim(),
      accentColor: accentColor,
      primaryColor: accentColor,
      phoneWhatsApp: phoneWhatsApp.trim(),
      instagramHandle: instagramHandle.trim(),
      defaultQrCodeUrl: defaultQrCodeUrl.trim(),
      defaultQrCodeImage: defaultQrCodeImage.trim(),
    };
    (onSave || onSaveProfile)?.(profile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Marca &amp; Identidade Visual
              </h2>
              <p className="text-xs text-slate-400">
                Padrões aplicados nos seus novos slides e telas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha Empresa"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Slogan Oficial
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: O Melhor da Região"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Logotipo da Empresa
            </label>
            <div className="flex items-center gap-2.5">
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>{logoUrl ? 'Substituir Imagem do Logo' : 'Fazer Upload do Logo'}</span>
              </button>
              {logoUrl && (
                <div className="w-10 h-10 bg-black rounded-xl p-1 border border-slate-700 shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Cor Padrão da Marca:</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    accentColor.toUpperCase() === c.hex.toUpperCase()
                      ? 'ring-2 ring-white scale-110 shadow'
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

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-7 h-7 rounded-full border border-slate-600 bg-transparent cursor-pointer"
                  title="Cor livre"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>WhatsApp</span>
              </label>
              <input
                type="text"
                value={phoneWhatsApp}
                onChange={(e) => setPhoneWhatsApp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@sualoja"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800">
            <label className="block text-[11px] text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Link Padrão para QR Code</span>
            </label>
            <input
              type="text"
              value={defaultQrCodeUrl}
              onChange={(e) => setDefaultQrCodeUrl(e.target.value)}
              placeholder="https://wa.me/5511... ou https://meucardapio.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Marca</span>
          </button>
        </div>
      </div>
    </div>
  );
};
