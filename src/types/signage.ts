export type MediaType = 'image' | 'video' | 'menu_board';
export type ScreenOrientation = 'landscape' | 'portrait';
export type ScreenStatus = 'online' | 'offline' | 'idle';
export type TVLayoutMode = 'clean_media' | 'corporate_split' | 'menu_brand' | 'promo_qr';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  durationDefault: number; // in seconds
  category?: 'promo' | 'cardapio' | 'aviso' | 'institucional';
  createdAt: string;
  fileSize?: string;
  dimensions?: string;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  durationSeconds: number;
  order: number;
  customTitle?: string;
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
  activePlaylistId: string;
  status: ScreenStatus;
  resolution: '1080p' | '4K' | '720p';
  orientation: ScreenOrientation;
  aspectRatio: '16:9' | '9:16';
  layoutMode?: TVLayoutMode;
  brandName?: string;
  brandSlogan?: string;
  lastPing: string;
  pairedAt: string;
  notes?: string;
}

export interface TickerConfig {
  enabled: boolean;
  text: string;
  speed: 'slow' | 'normal' | 'fast';
  accentTitle?: string;
}

export interface WeatherConfig {
  city: string;
  stateCode: string;
  temp: number;
  condition: 'sunny' | 'partly_cloudy' | 'rainy' | 'clear';
  conditionText: string;
  humidity: number;
  windKmH: number;
  tempMin: number;
  tempMax: number;
}

export interface SystemConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  organizationName: string;
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
