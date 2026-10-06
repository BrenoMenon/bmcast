export type MediaType = 'image' | 'video' | 'menu_board';
export type ScreenOrientation = 'landscape' | 'portrait';
export type ScreenStatus = 'online' | 'offline' | 'idle';
export type TVLayoutMode = 'clean_media' | 'corporate_split' | 'menu_brand' | 'promo_qr';

export type SlideCategoryType = 'cardapio' | 'promo' | 'aviso' | 'mural';

export type QrCodePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-right';
export type QrCodeSize = 'small' | 'medium' | 'large';
export type BrandPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'header-bar';

export interface CategoryOverlayConfig {
  badgeText?: string;          // Ex: "SUPER PROMOÇÃO", "CARDÁPIO DO CHEF", "AVISO IMPORTANTE", "DESTAQUE"
  headline?: string;           // Ex: "Hambúrguer Artesanal Smash Duplo"
  subheadline?: string;        // Ex: "Acompanha batata rústica e refrigerante lata"
  priceOriginal?: string;      // Ex: "R$ 44,90"
  pricePromo?: string;         // Ex: "R$ 29,90"
  accentColor?: string;        // Ex: "#E11D48", "#2563EB", "#059669", "#D97706"
  showOverlayBadge?: boolean;  // Exibe a etiqueta de destaque
  showPriceTag?: boolean;      // Exibe a caixa de preços
  position?: 'bottom' | 'top' | 'left' | 'right';
  extraItems?: { label: string; value: string }[];
}

export interface SlideBrandConfig {
  showBrand: boolean;          // O usuário pode escolher mostrar a marca ou não
  brandName?: string;          // Nome personalizado da empresa para o slide (ou usa padrão)
  brandSlogan?: string;        // Slogan / descrição para o slide
  brandLogo?: string;          // Imagem/URL do logo da empresa para o slide
  brandPosition?: BrandPosition;
  accentColor?: string;
  badgeText?: string;          // Ex: "LANÇAMENTO EXCLUSIVO"
}

export interface SlideQrCodeConfig {
  showQrCode: boolean;         // O usuário pode escolher mostrar o QR code ou não
  qrCodeType: 'generated' | 'custom_upload'; // Gera dinâmico pelo link ou usuário sobe imagem de QR code verdadeiro
  qrCodeUrl?: string;          // Link para gerar (ex: WhatsApp, Pix, Cardápio, Instagram)
  qrCodeCustomImage?: string;  // Imagem real do QR Code que o usuário enviou
  qrCodeLabel?: string;        // Ex: "Peça pelo WhatsApp", "Pague no PIX", "Acesse o Menu"
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
  // Customizações salvas no modelo do slide:
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
  // Overrides específicos por slide na playlist:
  brandConfig?: SlideBrandConfig;
  qrConfig?: SlideQrCodeConfig;
  categoryOverlay?: CategoryOverlayConfig;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  screenId?: string; // Target screen or 'all'
  items: PlaylistItem[];
  isDefault?: boolean;
  updatedAt: string;
}

export interface Screen {
  id: string;
  name: string;
  location: string;
  slug: string;
  pairingCode: string; // Ex: "BM-4921" para pareamento instantâneo
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
  themeMode: 'dark';
  defaultLayoutMode: TVLayoutMode;
  enableSplitMode: boolean;
}

export interface LocalDBState {
  screens: Screen[];
  media: MediaItem[];
  playlists: Playlist[];
  ticker: TickerConfig;
  weather: WeatherConfig;
  config: SystemConfig;
}
