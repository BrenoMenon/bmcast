import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Instagram,
  QrCode,
  Check,
  Store,
  Palette,
} from 'lucide-react';
import { CompanyBrandProfile } from '../../types/signage';
import { qrService } from '../../services/qrService';
import { supabaseService } from '../../services/supabaseClient';
import { AccountSecurityPanel } from './AccountSecurityPanel';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { editableCompanyName, formatWhatsApp, normalizeInstagram } from '../../services/contactFormatting';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile: CompanyBrandProfile;
  onSave?: ((profile: CompanyBrandProfile) => void) | undefined;
  onSaveProfile?: ((profile: CompanyBrandProfile) => void) | undefined;
  onAccountDeleted?: (() => void) | undefined;
  setupHint?: string | undefined;
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

const inputCls =
  'w-full rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none transition';

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
  brandProfile,
  onSave,
  onSaveProfile,
  onAccountDeleted,
  setupHint,
}) => {
  const [name, setName] = useState(editableCompanyName(brandProfile.name));
  const [slogan, setSlogan] = useState(brandProfile.slogan || '');
  const [logoUrl, setLogoUrl] = useState(brandProfile.logoUrl || '');
  const [accentColor, setAccentColor] = useState(brandProfile.accentColor || brandProfile.primaryColor || '#2563EB');
  const [phoneWhatsApp, setPhoneWhatsApp] = useState(formatWhatsApp(brandProfile.phoneWhatsApp || ''));
  const [instagramHandle, setInstagramHandle] = useState(normalizeInstagram(brandProfile.instagramHandle || ''));
  const [defaultQrCodeUrl, setDefaultQrCodeUrl] = useState(brandProfile.defaultQrCodeUrl || '');
  const [defaultQrCodeImage, setDefaultQrCodeImage] = useState(brandProfile.defaultQrCodeImage || '');

  const logoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(editableCompanyName(brandProfile.name));
      setSlogan(brandProfile.slogan || '');
      setLogoUrl(brandProfile.logoUrl || '');
      setAccentColor(brandProfile.accentColor || brandProfile.primaryColor || '#2563EB');
      setPhoneWhatsApp(formatWhatsApp(brandProfile.phoneWhatsApp || ''));
      setInstagramHandle(normalizeInstagram(brandProfile.instagramHandle || ''));
      setDefaultQrCodeUrl(brandProfile.defaultQrCodeUrl || '');
      setDefaultQrCodeImage(brandProfile.defaultQrCodeImage || '');
    }
  }, [isOpen, brandProfile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cloudUrl = await supabaseService.uploadAsset(file, 'logos');
      const finalUrl = cloudUrl || (await qrService.fileToDataUrl(file));
      setLogoUrl(finalUrl);
    } catch (err) {
      console.error('Erro upload logo:', err);
    }
  };

  const handleSave = () => {
    const profile: CompanyBrandProfile = {
      ...brandProfile,
      name: name.trim(),
      slogan: slogan.trim(),
      logoUrl: logoUrl.trim(),
      accentColor,
      primaryColor: accentColor,
      phoneWhatsApp: phoneWhatsApp.trim(),
      instagramHandle: instagramHandle ? `@${normalizeInstagram(instagramHandle)}` : '',
      defaultQrCodeUrl: defaultQrCodeUrl.trim(),
      defaultQrCodeImage: defaultQrCodeImage.trim(),
    };
    (onSave || onSaveProfile)?.(profile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-[2rem] border border-border bg-card p-5 sm:p-6 text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Marca &amp; Identidade Visual
              </h2>
              <p className="text-xs text-muted-foreground">
                Padrões aplicados nos seus slides e telas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {setupHint && (
            <p className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-2.5 text-[11px] font-semibold text-foreground">
              {setupHint}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="company-name" className="mb-1 block text-[11px] font-semibold text-foreground">
                Nome da Empresa
              </label>
              <input
                id="company-name"
                autoComplete="off"
                maxLength={100}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha Empresa"
                className={`${inputCls} font-semibold`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-foreground">
                Slogan Oficial
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: O Melhor da Região"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-foreground">
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
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Upload className="h-4 w-4 text-primary" />
                <span>{logoUrl ? 'Substituir Imagem do Logo' : 'Fazer Upload do Logo'}</span>
              </button>
              {logoUrl && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted p-1">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span>Cor Padrão da Marca</span>
            </label>
            <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-2.5 justify-items-center">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  aria-label={c.name}
                  aria-pressed={accentColor.toUpperCase() === c.hex.toUpperCase()}
                  className={`flex h-9 w-9 aspect-square shrink-0 items-center justify-center rounded-full p-0 transition cursor-pointer ${
                    accentColor.toUpperCase() === c.hex.toUpperCase()
                      ? 'scale-110 ring-2 ring-primary shadow'
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

              <div className="flex items-center justify-center sm:border-l sm:border-border sm:pl-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="brand-color-input !h-9 !w-9 aspect-square shrink-0 rounded-full border border-border bg-transparent cursor-pointer"
                  aria-label="Cor personalizada"
                  title="Cor livre"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
            <div>
              <label htmlFor="company-whatsapp" className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <WhatsAppIcon className="h-3.5 w-3.5 text-primary" />
                <span>WhatsApp</span>
              </label>
              <input
                id="company-whatsapp"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength={15}
                value={phoneWhatsApp}
                onChange={(e) => setPhoneWhatsApp(formatWhatsApp(e.target.value))}
                placeholder="(xx) xxxxx-xxxx"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="company-instagram" className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <Instagram className="h-3.5 w-3.5 text-pink-500" />
                <span>Instagram</span>
              </label>
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
                  @
                </span>
                <input
                  id="company-instagram"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={31}
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(normalizeInstagram(e.target.value))}
                  placeholder="sualoja"
                  className={`${inputCls} pl-8`}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <QrCode className="h-3.5 w-3.5 text-primary" />
              <span>Link Padrão para QR Code</span>
            </label>
            <input
              type="text"
              value={defaultQrCodeUrl}
              onChange={(e) => setDefaultQrCodeUrl(e.target.value)}
              placeholder="https://wa.me/5511... ou https://meucardapio.com"
              className={`${inputCls} font-mono`}
            />
          </div>

          {onAccountDeleted && !setupHint && <AccountSecurityPanel onAccountDeleted={onAccountDeleted} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{setupHint ? 'Salvar e Continuar' : 'Salvar Marca'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
