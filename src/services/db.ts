import {
  Screen,
  MediaItem,
  Playlist,
  SystemConfig,
  TickerConfig,
  WeatherConfig,
  CompanyBrandProfile,
  PlaylistItem,
} from '../types/signage';
import { weatherService } from './weatherService';

import { supabase } from './supabaseClient';

export const DB_CHANGE_EVENT = 'bmcast_db_changed_v6';

const STORAGE_KEYS = {
  SCREENS: 'bmcast_screens_clean_v6_zero',
  MEDIA: 'bmcast_media_clean_v6_zero',
  PLAYLISTS: 'bmcast_playlists_clean_v6_zero',
  CONFIG: 'bmcast_config_clean_v6_zero',
  TICKER: 'bmcast_ticker_clean_v6_zero',
  WEATHER: 'bmcast_weather_clean_v6_zero',
  ONBOARDING: 'bmcast_onboarding_completed_v6',
};

const DEFAULT_BRAND_PROFILE: CompanyBrandProfile = {
  name: '',
  slogan: '',
  logoUrl: '',
  accentColor: '#0284c7',
  secondaryColor: '#0ea5e9',
  phoneWhatsApp: '',
  instagramHandle: '',
  websiteUrl: '',
  defaultQrCodeUrl: '',
};

const DEFAULT_CONFIG: SystemConfig = {
  organizationName: '',
  brandProfile: DEFAULT_BRAND_PROFILE,
  themeAccent: '#0284c7',
  themeMode: 'dark',
  defaultLayoutMode: 'clean_media',
  enableSplitMode: false,
};

const DEFAULT_TICKER: TickerConfig = {
  enabled: true,
  text: 'BM Cast • Sistema de TV Corporativa e Menus Dinâmicos.',
  speed: 'normal',
  accentTitle: 'AVISO AO VIVO',
  presetTopic: 'retail',
};

const DEFAULT_WEATHER: WeatherConfig = {
  autoDetect: false,
  city: 'São Paulo',
  stateCode: 'SP',
  latitude: -23.5505,
  longitude: -46.6333,
  temp: 24,
  tempMin: 18,
  tempMax: 27,
  condition: 'partly_cloudy',
  conditionText: 'Parcialmente Nublado',
  humidity: 58,
  windKmH: 12,
  lastFetchedAt: new Date().toISOString(),
  source: 'open_meteo_live',
};

class ResilientDatabase {
  // ZERO cadastros prévios - O cliente começa 100% do zero
  private screens: Screen[] = [];
  private media: MediaItem[] = [];
  private playlists: Playlist[] = [];
  private config: SystemConfig = DEFAULT_CONFIG;
  private ticker: TickerConfig = DEFAULT_TICKER;
  private weather: WeatherConfig = DEFAULT_WEATHER;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initBroadcast();
    this.loadFromStorage();
    this.refreshWeatherPeriodically();
  }

  private initBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bmcast_sync_channel_v6');
        this.broadcastChannel.onmessage = (ev) => {
          if (ev.data && ev.data.type === 'DB_SYNC') {
            this.loadFromStorage();
            this.notifyListeners(false);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel não disponível:', e);
      }
    }
  }

  private notifyListeners(broadcast = true) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT));
      if (broadcast && this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: 'DB_SYNC', timestamp: Date.now() });
        } catch (e) {
          console.warn('Erro ao propagar no BroadcastChannel:', e);
        }
      }
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedScreens = localStorage.getItem(STORAGE_KEYS.SCREENS);
      this.screens = storedScreens ? JSON.parse(storedScreens) : [];

      const storedMedia = localStorage.getItem(STORAGE_KEYS.MEDIA);
      this.media = storedMedia ? JSON.parse(storedMedia) : [];

      const storedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      this.playlists = storedPlaylists ? JSON.parse(storedPlaylists) : [];

      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      this.config = storedConfig ? JSON.parse(storedConfig) : DEFAULT_CONFIG;

      const storedTicker = localStorage.getItem(STORAGE_KEYS.TICKER);
      this.ticker = storedTicker ? JSON.parse(storedTicker) : DEFAULT_TICKER;

      const storedWeather = localStorage.getItem(STORAGE_KEYS.WEATHER);
      this.weather = storedWeather ? JSON.parse(storedWeather) : DEFAULT_WEATHER;
    } catch (e) {
      console.error('Erro ao ler dados locais:', e);
      this.screens = [];
      this.media = [];
      this.playlists = [];
      this.config = DEFAULT_CONFIG;
      this.ticker = DEFAULT_TICKER;
      this.weather = DEFAULT_WEATHER;
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SCREENS, JSON.stringify(this.screens));
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(this.media));
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(this.playlists));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
      localStorage.setItem(STORAGE_KEYS.TICKER, JSON.stringify(this.ticker));
      localStorage.setItem(STORAGE_KEYS.WEATHER, JSON.stringify(this.weather));
      this.notifyListeners();
    } catch (e) {
      console.error('Erro ao gravar dados no storage:', e);
    }
  }

  private async refreshWeatherPeriodically() {
    setTimeout(async () => {
      try {
        const live = await weatherService.fetchLiveWeather(
          this.weather.latitude || -23.5505,
          this.weather.longitude || -46.6333,
          this.weather.city || 'São Paulo',
          this.weather.stateCode || 'SP'
        );
        this.weather = live;
        this.saveToStorage();
      } catch (err) {
        console.warn('Erro ao atualizar clima inicial:', err);
      }
    }, 1200);

    if (typeof window !== 'undefined') {
      setInterval(async () => {
        try {
          const live = await weatherService.fetchLiveWeather(
            this.weather.latitude || -23.5505,
            this.weather.longitude || -46.6333,
            this.weather.city || 'São Paulo',
            this.weather.stateCode || 'SP'
          );
          this.weather = live;
          this.saveToStorage();
        } catch (e) {
          console.warn('Erro ao renovar clima periódico:', e);
        }
      }, 15 * 60 * 1000);
    }
  }

  // --- Screens CRUD ---
  getScreens(): Screen[] {
    return [...this.screens];
  }

  getScreenBySlug(slug: string): Screen | undefined {
    const clean = slug.toLowerCase().trim();
    return this.screens.find((s) => s.slug.toLowerCase().trim() === clean);
  }

  saveScreen(screen: Screen): void {
    const idx = this.screens.findIndex((s) => s.id === screen.id);
    if (idx >= 0) {
      this.screens[idx] = { ...screen, lastPing: new Date().toISOString() };
    } else {
      this.screens.push({ ...screen, lastPing: new Date().toISOString() });
    }
    this.saveToStorage();
  }

  deleteScreen(id: string): void {
    this.screens = this.screens.filter((s) => s.id !== id);
    this.saveToStorage();
  }

  // --- Media CRUD ---
  getMedia(): MediaItem[] {
    return [...this.media];
  }

  saveMedia(item: MediaItem, addToActivePlaylist = false): void {
    const idx = this.media.findIndex((m) => m.id === item.id);
    if (idx >= 0) {
      this.media[idx] = item;
    } else {
      this.media.unshift(item);
    }

    if (addToActivePlaylist) {
      let activePlaylist = this.playlists[0];
      if (!activePlaylist) {
        activePlaylist = {
          id: `pl-${Date.now()}`,
          name: 'Programação Principal',
          description: 'Grade de slides ativa na TV',
          items: [],
          isDefault: true,
          updatedAt: new Date().toISOString(),
        };
        this.playlists.push(activePlaylist);
      }

      const newItem: PlaylistItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        mediaId: item.id,
        durationSeconds: item.durationDefault || 12,
        order: activePlaylist.items.length,
        customTitle: item.title,
        brandConfig: item.brandConfig,
        qrConfig: item.qrConfig,
        categoryOverlay: item.categoryOverlay,
      };

      activePlaylist.items.push(newItem);
      activePlaylist.updatedAt = new Date().toISOString();
    }

    this.saveToStorage();
  }

  deleteMedia(id: string): void {
    this.media = this.media.filter((m) => m.id !== id);
    this.playlists.forEach((p) => {
      p.items = p.items.filter((item) => item.mediaId !== id);
    });
    this.saveToStorage();
  }

  // --- Playlists CRUD ---
  getPlaylists(): Playlist[] {
    return [...this.playlists];
  }

  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.find((p) => p.id === id);
  }

  savePlaylist(playlist: Playlist): void {
    const idx = this.playlists.findIndex((p) => p.id === playlist.id);
    if (idx >= 0) {
      this.playlists[idx] = { ...playlist, updatedAt: new Date().toISOString() };
    } else {
      this.playlists.push({ ...playlist, updatedAt: new Date().toISOString() });
    }
    this.saveToStorage();
  }

  deletePlaylist(id: string): void {
    this.playlists = this.playlists.filter((p) => p.id !== id);
    this.saveToStorage();
  }

  updatePlaylistItem(playlistId: string, item: PlaylistItem): void {
    const playlist = this.playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const idx = playlist.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      playlist.items[idx] = item;
      playlist.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  duplicatePlaylistItem(playlistId: string, itemId: string): PlaylistItem | null {
    const playlist = this.playlists.find((p) => p.id === playlistId);
    if (!playlist) return null;
    const item = playlist.items.find((i) => i.id === itemId);
    if (!item) return null;

    const duplicated: PlaylistItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customTitle: `${item.customTitle || 'Slide'} (Cópia)`,
      order: playlist.items.length,
    };
    playlist.items.push(duplicated);
    playlist.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return duplicated;
  }

  getConfig(): SystemConfig {
    return { ...this.config };
  }

  saveConfig(cfg: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...cfg };
    this.saveToStorage();
  }

  getTicker(): TickerConfig {
    return { ...this.ticker };
  }

  saveTicker(ticker: TickerConfig): void {
    this.ticker = { ...ticker };
    this.saveToStorage();
  }

  getWeather(): WeatherConfig {
    return { ...this.weather };
  }

  saveWeather(weather: WeatherConfig): void {
    this.weather = { ...weather };
    this.saveToStorage();
  }

  clearAll(): void {
    this.screens = [];
    this.media = [];
    this.playlists = [];
    this.saveToStorage();
  }

  // Onboarding status
  isOnboardingCompleted(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';
  }

  setOnboardingCompleted(completed: boolean): void {
    if (typeof window === 'undefined') return;
    if (completed) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    }
  }
}

export const db = new ResilientDatabase();
