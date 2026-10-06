import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Phone,
  Instagram,
  QrCode,
  Check,
} from 'lucide-react';
import { CompanyBrandProfile } from '../../types/signage';
import { qrService } from '../../services/qrService';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile: CompanyBrandProfile;
  onSave: (updatedProfile: CompanyBrandProfile) => void;
}

const PRESET_COLORS = [
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Vermelho', hex: '#E11D48' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Âmbar', hex: '#D97706' },
  { name: 'Roxo', hex: '#7C3AED' },
  { name: 'Titânio', hex: '#334155' },
];

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
  brandProfile,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [phoneWhatsApp, setPhoneWhatsApp] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [defaultQrCodeUrl, setDefaultQrCodeUrl] = useState('');
  const [defaultQrCodeImage, setDefaultQrCodeImage] = useState('');

  const logoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(brandProfile.name || '');
    setSlogan(brandProfile.slogan || '');
    setLogoUrl(brandProfile.logoUrl || '');
    setAccentColor(brandProfile.accentColor || '#2563EB');
    setPhoneWhatsApp(brandProfile.phoneWhatsApp || '');
    setInstagramHandle(brandProfile.instagramHandle || '');
    setWebsiteUrl(brandProfile.websiteUrl || '');
    setDefaultQrCodeUrl(brandProfile.defaultQrCodeUrl || '');
    setDefaultQrCodeImage(brandProfile.defaultQrCodeImage || '');
  }, [brandProfile, isOpen]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await qrService.fileToDataUrl(file);
      setLogoUrl(dataUrl);
    } catch (err) {
      console.error('Erro no logo:', err);
    }
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || 'Minha Empresa',
      slogan: slogan.trim(),
      logoUrl: logoUrl.trim(),
      accentColor,
      phoneWhatsApp: phoneWhatsApp.trim(),
      instagramHandle: instagramHandle.trim(),
      websiteUrl: websiteUrl.trim(),
      defaultQrCodeUrl: defaultQrCodeUrl.trim(),
      defaultQrCodeImage: defaultQrCodeImage.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#121520] border border-[#22293C] rounded-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2436]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Marca & Identidade Visual
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configurações padrão herdadas pelos novos slides criados na plataforma
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2436] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lanches & Co"
                className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-semibold transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                Slogan Oficial
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Sabor & Qualidade"
                className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">
              Logotipo
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
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#0A0D15] hover:bg-[#181D2B] border border-[#22293C] rounded-lg text-xs text-slate-200 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>{logoUrl ? 'Substituir Imagem do Logo' : 'Fazer Upload do Logo'}</span>
              </button>
              {logoUrl && (
                <div className="w-9 h-9 bg-black rounded-lg p-1 border border-[#22293C] shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1.5">
              Cor Oficial
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-transform ${
                    accentColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-[#1E2436]">
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>WhatsApp</span>
              </label>
              <input
                type="text"
                value={phoneWhatsApp}
                onChange={(e) => setPhoneWhatsApp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@sualoja"
                className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#1E2436]">
            <label className="block text-[11px] text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Link Padrão para QR Code</span>
            </label>
            <input
              type="text"
              value={defaultQrCodeUrl}
              onChange={(e) => setDefaultQrCodeUrl(e.target.value)}
              placeholder="https://wa.me/5511... ou https://..."
              className="w-full px-3 py-2 bg-[#0A0D15] border border-[#22293C] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-[#1E2436] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-600/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
