export type MediaType = 'image' | 'video' | 'menu_board';
export type ScreenOrientation = 'landscape' | 'portrait';
export type ScreenStatus = 'online' | 'offline' | 'idle';
export type TVLayoutMode = 'clean_media' | 'corporate_split' | 'menu_brand' | 'promo_qr';

export type SlideCategoryType = 'cardapio' | 'promo' | 'aviso' | 'mural';

export type BusinessCategoryType =
  | 'lanchonete'
  | 'loja'
  | 'clinica'
  | 'barbearia'
  | 'academia'
  | 'corporativo'
  | 'educacao'
  | 'outro';

export type QrCodePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-right';
export type QrCodeSize = 'small' | 'medium' | 'large';
export type BrandPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'header-bar';

export interface CategoryOverlayConfig {
  badgeText?: string | undefined;          // Ex: "SUPER PROMOÇÃO", "CARDÁPIO DO CHEF", "AVISO IMPORTANTE", "DESTAQUE"
  headline?: string | undefined;           // Ex: "Hambúrguer Artesanal Smash Duplo"
  subheadline?: string | undefined;        // Ex: "Acompanha batata rústica e refrigerante lata"
  priceOriginal?: string | undefined;      // Ex: "R$ 44,90"
  pricePromo?: string | undefined;         // Ex: "R$ 29,90"
  accentColor?: string | undefined;        // Ex: "#2563EB", "#059669", "#D97706", etc.
  showOverlayBadge?: boolean | undefined;  // Exibe a etiqueta de destaque
  showPriceTag?: boolean | undefined;      // Exibe a caixa de preços
  position?: 'bottom' | 'top' | 'left' | 'right' | undefined;
  overlayOpacity?: number | undefined;     // 0 a 100% de escurecimento do fundo
  discountPercent?: string | undefined;    // Ex: "25% OFF"
  extraItems?: { label: string | undefined; value: string }[];
}

export interface SlideBrandConfig {
  showBrand: boolean;          // O usuário pode escolher mostrar a marca ou não
  brandName?: string | undefined;          // Nome personalizado da empresa para o slide (ou usa padrão)
  brandSlogan?: string | undefined;        // Slogan / descrição para o slide
  brandLogo?: string | undefined;          // Imagem/URL do logo da empresa para o slide
  brandPosition?: BrandPosition | undefined;
  accentColor?: string | undefined;
  badgeText?: string | undefined;          // Ex: "LANÇAMENTO EXCLUSIVO"
}

export interface SlideQrCodeConfig {
  showQrCode: boolean;         // O usuário pode escolher mostrar o QR code ou não
  qrCodeType: 'generated' | 'custom_upload'; // Gera dinâmico pelo link ou usuário sobe imagem de QR code verdadeiro
  qrCodeUrl?: string | undefined;          // Link para gerar (ex: WhatsApp, Pix, Cardápio, Instagram)
  qrCodeCustomImage?: string | undefined;  // Imagem real do QR Code que o usuário enviou
  qrCodeLabel?: string | undefined;        // Ex: "Peça pelo WhatsApp", "Pague no PIX", "Acesse o Menu"
  qrCodePosition: QrCodePosition;
  qrCodeSize: QrCodeSize;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnail?: string | undefined;
  durationDefault: number; // in seconds
  category: SlideCategoryType;
  createdAt: string;
  fileSize?: string | undefined;
  dimensions?: string | undefined;
  // Customizações salvas no modelo do slide:
  brandConfig?: SlideBrandConfig | undefined;
  qrConfig?: SlideQrCodeConfig | undefined;
  categoryOverlay?: CategoryOverlayConfig | undefined;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  durationSeconds: number;
  order: number;
  customTitle?: string | undefined;
  // Overrides específicos por slide na playlist:
  brandConfig?: SlideBrandConfig | undefined;
  qrConfig?: SlideQrCodeConfig | undefined;
  categoryOverlay?: CategoryOverlayConfig | undefined;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  screenId?: string | undefined; // Target screen or 'all'
  items: PlaylistItem[];
  isDefault?: boolean | undefined;
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
  layoutMode?: TVLayoutMode | undefined;
  brandName?: string | undefined;
  brandSlogan?: string | undefined;
  brandLogo?: string | undefined;
  lastPing: string;
  pairedAt: string;
  notes?: string | undefined;
}

export interface TickerConfig {
  enabled: boolean;
  text: string;
  speed: 'slow' | 'normal' | 'fast';
  accentTitle?: string | undefined;
  presetTopic?: 'custom' | 'news' | 'business' | 'retail' | undefined;
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
  error?: string | undefined;
}

export interface CompanyBrandProfile {
  name: string;
  slogan: string;
  logoUrl: string;
  accentColor: string;
  primaryColor?: string | undefined;
  phoneWhatsApp?: string | undefined;
  instagramHandle?: string | undefined;
  websiteUrl?: string | undefined;
  defaultQrCodeImage?: string | undefined;
  defaultQrCodeUrl?: string | undefined;
  businessCategory?: BusinessCategoryType | undefined;
  onboardingCompleted?: boolean | undefined;
  supabaseUrl?: string | undefined;
  supabaseAnonKey?: string | undefined;
  supabaseConnected?: boolean | undefined;
}

export interface SystemConfig {
  organizationName: string;
  brandProfile: CompanyBrandProfile;
  themeAccent: string;
  themeMode: 'dark' | 'light';
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
