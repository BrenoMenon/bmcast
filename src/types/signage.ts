export type MediaType = 'image' | 'video' | 'menu_board';
export type ScreenOrientation = 'landscape' | 'portrait';
export type ScreenStatus = 'online' | 'offline' | 'idle';
export type TVLayoutMode = 'clean_media' | 'corporate_split' | 'menu_brand' | 'promo_qr';
export type SlideCategoryType = 'cardapio' | 'promo' | 'aviso' | 'mural';
export type QrCodePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-right';
export type QrCodeSize = 'small' | 'medium' | 'large';
export type BrandPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'header-bar';

export interface CategoryOverlayConfig {
  badgeText?: string;          // Ex: "DESTAQUE DA SEMANA", "CARDÁPIO ESPECIAL", "COMUNICADO"
  headline?: string;           // Ex: "Café Gourmet Especial & Croissant"
  subheadline?: string;        // Ex: "Grãos selecionados com torra artesanal média"
  priceOriginal?: string;      // Ex: "R$ 28,00"
  pricePromo?: string;         // Ex: "R$ 19,90"
  accentColor?: string;        // Ex: "#0d9488", "#2563EB", "#dc2626"
  showOverlayBadge?: boolean;
  showPriceTag?: boolean;
  position?: 'bottom' | 'top' | 'left' | 'right';
  extraItems?: { label: string; value: string }[];
}

export interface SlideBrandConfig {
  showBrand: boolean;
  brandName?: string;
  brandSlogan?: string;
  brandLogo?: string;
  brandPosition?: BrandPosition;
  accentColor?: string;
  badgeText?: string;
}

export interface SlideQrCodeConfig {
  showQrCode: boolean;
  qrCodeType: 'generated' | 'custom_upload';
  qrCodeUrl?: string;
  qrCodeCustomImage?: string;
  qrCodeLabel?: string;
  qrCodePosition: QrCodePosition;
  qrCodeSize: QrCodeSize;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  durationDefault: number; // in seconds
  category: SlideCategoryType;
  createdAt: string;
  fileSize?: string;
  dimensions?: string;
  brandConfig?: SlideBrandConfig;
  qrConfig?: SlideQrCodeConfig;
  categoryOverlay?: CategoryOverlayConfig;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  durationSeconds: number;
  order: number;
  customTitle?: string;
  brandConfig?: SlideBrandConfig;
  qrConfig?: SlideQrCodeConfig;
  categoryOverlay?: CategoryOverlayConfig;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  screenId?: string;
  items: PlaylistItem[];
  isDefault?: boolean;
  updatedAt: string;
}

export interface Screen {
  id: string;
  name: string;
  location: string;
  slug: string;
  pairingCode: string;
  activePlaylistId: string;
  status: ScreenStatus;
  resolution: '1080p' | '4K' | '720p';
  orientation: ScreenOrientation;
  aspectRatio: '16:9' | '9:16';
  layoutMode?: TVLayoutMode;
  brandName?: string;
  brandSlogan?: string;
  brandLogo?: string;
  lastPing: string;
  pairedAt: string;
  notes?: string;
}

export interface TickerConfig {
  enabled: boolean;
  text: string;
  speed: 'slow' | 'normal' | 'fast';
  accentTitle?: string;
  presetTopic?: 'custom' | 'news' | 'business' | 'retail';
}

export interface WeatherConfig {
  autoDetect: boolean;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'storm' | 'clear';
  conditionText: string;
  humidity: number;
  windKmH: number;
  lastFetchedAt: string;
  source: 'open_meteo_live' | 'cached';
  error?: string;
}

export interface CompanyBrandProfile {
  name: string;
  slogan: string;
  logoUrl: string;
  accentColor: string;
  secondaryColor?: string;
  phoneWhatsApp?: string;
  instagramHandle?: string;
  websiteUrl?: string;
  defaultQrCodeImage?: string;
  defaultQrCodeUrl?: string;
}

export interface SystemConfig {
  organizationName: string;
  brandProfile: CompanyBrandProfile;
  themeAccent: string;
  themeMode: 'dark' | 'light';
  defaultLayoutMode: TVLayoutMode;
  enableSplitMode: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface LocalDBState {
  screens: Screen[];
  media: MediaItem[];
  playlists: Playlist[];
  ticker: TickerConfig;
  weather: WeatherConfig;
  config: SystemConfig;
}
