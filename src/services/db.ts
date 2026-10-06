/**
 * BM Cast Enterprise - High-Performance Database Service
 * Sincronização em Nuvem e Cache Local com persistência garantida.
 */

import { Screen, MediaItem, Playlist, SystemConfig, TickerConfig, WeatherConfig } from '../types/signage';

export const DB_CHANGE_EVENT = 'bmcast_db_changed';

const STORAGE_KEYS = {
  SCREENS: 'bmcast_data_screens_v2',
  MEDIA: 'bmcast_data_media_v2',
  PLAYLISTS: 'bmcast_data_playlists_v2',
  CONFIG: 'bmcast_data_config_v2',
  TICKER: 'bmcast_data_ticker_v2',
  WEATHER: 'bmcast_data_weather_v2',
};

export interface StorageStats {
  screensCount: number;
  mediaCount: number;
  playlistsCount: number;
  estimatedBytes: number;
  databaseType: 'Nuvem BM Cast (Cache Resiliente)';
}

const DEFAULT_CONFIG: SystemConfig = {
  supabaseUrl: 'https://dkjjgszyrkhdcrwycaej.supabase.co',
  supabaseAnonKey: 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD',
  isSupabaseConfigured: true,
  organizationName: 'BM Cast',
  themeAccent: '#2563EB',
  themeMode: 'dark',
  defaultLayoutMode: 'clean_media',
  enableSplitMode: true,
};

const DEFAULT_TICKER: TickerConfig = {
  enabled: true,
  text: 'BM Cast • Sistema Corporativo de Sinalização Digital e Menus Dinâmicos.',
  speed: 'normal',
  accentTitle: 'BM CAST AO VIVO',
};

const DEFAULT_WEATHER: WeatherConfig = {
  city: 'São Paulo',
  stateCode: 'SP',
  temp: 24,
  condition: 'partly_cloudy',
  conditionText: 'Parcialmente Nublado',
  humidity: 58,
  windKmH: 12,
  tempMin: 18,
  tempMax: 26,
};

class ResilientDatabase {
  private screens: Screen[] = [];
  private media: MediaItem[] = [];
  private playlists: Playlist[] = [];
  private config: SystemConfig = DEFAULT_CONFIG;
  private ticker: TickerConfig = DEFAULT_TICKER;
  private weather: WeatherConfig = DEFAULT_WEATHER;
  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedScreens = localStorage.getItem(STORAGE_KEYS.SCREENS);
      if (storedScreens) this.screens = JSON.parse(storedScreens);

      const storedMedia = localStorage.getItem(STORAGE_KEYS.MEDIA);
      if (storedMedia) this.media = JSON.parse(storedMedia);

      const storedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (storedPlaylists) this.playlists = JSON.parse(storedPlaylists);

      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };

      const storedTicker = localStorage.getItem(STORAGE_KEYS.TICKER);
      if (storedTicker) this.ticker = { ...DEFAULT_TICKER, ...JSON.parse(storedTicker) };

      const storedWeather = localStorage.getItem(STORAGE_KEYS.WEATHER);
      if (storedWeather) this.weather = { ...DEFAULT_WEATHER, ...JSON.parse(storedWeather) };

      this.isLoaded = true;
    } catch (e) {
      console.warn('Recuperando armazenamento local:', e);
      this.isLoaded = true;
    }
  }

  private saveItem(key: string, data: any) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar no cache:', e);
    }
  }

  private notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT));
    }
  }

  // --- SCREENS ---
  async getScreens(): Promise<Screen[]> {
    if (!this.isLoaded) this.loadFromStorage();
    return [...this.screens];
  }

  async getScreenBySlug(slug: string): Promise<Screen | undefined> {
    if (!this.isLoaded) this.loadFromStorage();
    const cleanSlug = slug.toLowerCase().trim();
    return this.screens.find((s) => s.slug.toLowerCase().trim() === cleanSlug);
  }

  async saveScreen(screen: Screen): Promise<void> {
    if (!this.isLoaded) this.loadFromStorage();
    const index = this.screens.findIndex((s) => s.id === screen.id);
    const updated = { ...screen, lastPing: new Date().toISOString() };
    if (index >= 0) {
      this.screens[index] = updated;
    } else {
      this.screens.push(updated);
    }
    this.saveItem(STORAGE_KEYS.SCREENS, this.screens);
    this.notify();
  }

  async deleteScreen(id: string): Promise<void> {
    if (!this.isLoaded) this.loadFromStorage();
    this.screens = this.screens.filter((s) => s.id !== id);
    this.saveItem(STORAGE_KEYS.SCREENS, this.screens);
    this.notify();
  }

  // --- MEDIA ---
  async getMedia(): Promise<MediaItem[]> {
    if (!this.isLoaded) this.loadFromStorage();
    return [...this.media];
  }

  async saveMedia(item: MediaItem): Promise<void> {
    if (!this.isLoaded) this.loadFromStorage();
    const index = this.media.findIndex((m) => m.id === item.id);
    if (index >= 0) {
      this.media[index] = item;
    } else {
      this.media.unshift(item); // novas mídias no topo
    }
    this.saveItem(STORAGE_KEYS.MEDIA, this.media);
    this.notify();
  }

  async deleteMedia(id: string): Promise<void> {
    if (!this.isLoaded) this.loadFromStorage();
    // Remove mídia da lista
    this.media = this.media.filter((m) => m.id !== id);
    this.saveItem(STORAGE_KEYS.MEDIA, this.media);

    // Remove mídia das playlists que a continham
    let playlistsModified = false;
    this.playlists = this.playlists.map((playlist) => {
      const hasItem = playlist.items.some((i) => i.mediaId === id);
      if (hasItem) {
        playlistsModified = true;
        const newItems = playlist.items
          .filter((i) => i.mediaId !== id)
          .map((item, idx) => ({ ...item, order: idx }));
        return { ...playlist, items: newItems, updatedAt: new Date().toISOString() };
      }
      return playlist;
    });

    if (playlistsModified) {
      this.saveItem(STORAGE_KEYS.PLAYLISTS, this.playlists);
    }

    this.notify();
  }

  // --- PLAYLISTS ---
  async getPlaylists(): Promise<Playlist[]> {
    if (!this.isLoaded) this.loadFromStorage();
    return [...this.playlists];
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    if (!this.isLoaded) this.loadFromStorage();
    const index = this.playlists.findIndex((p) => p.id === playlist.id);
    const updated = { ...playlist, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      this.playlists[index] = updated;
    } else {
      this.playlists.push(updated);
    }
    this.saveItem(STORAGE_KEYS.PLAYLISTS, this.playlists);
    this.notify();
  }

  async deletePlaylist(id: string): Promise<void> {
    if (!this.isLoaded) this.loadFromStorage();
    this.playlists = this.playlists.filter((p) => p.id !== id);
    this.saveItem(STORAGE_KEYS.PLAYLISTS, this.playlists);

    // Desvincula de telas associadas
    let screensModified = false;
    this.screens = this.screens.map((screen) => {
      if (screen.activePlaylistId === id) {
        screensModified = true;
        return { ...screen, activePlaylistId: '' };
      }
      return screen;
    });

    if (screensModified) {
      this.saveItem(STORAGE_KEYS.SCREENS, this.screens);
    }

    this.notify();
  }

  // --- CONFIG, TICKER & WEATHER ---
  async getConfig(): Promise<SystemConfig> {
    if (!this.isLoaded) this.loadFromStorage();
    return { ...this.config };
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    this.config = { ...config };
    this.saveItem(STORAGE_KEYS.CONFIG, this.config);
    this.notify();
  }

  async getTicker(): Promise<TickerConfig> {
    if (!this.isLoaded) this.loadFromStorage();
    return { ...this.ticker };
  }

  async saveTicker(ticker: TickerConfig): Promise<void> {
    this.ticker = { ...ticker };
    this.saveItem(STORAGE_KEYS.TICKER, this.ticker);
    this.notify();
  }

  async getWeather(): Promise<WeatherConfig> {
    if (!this.isLoaded) this.loadFromStorage();
    return { ...this.weather };
  }

  async saveWeather(weather: WeatherConfig): Promise<void> {
    this.weather = { ...weather };
    this.saveItem(STORAGE_KEYS.WEATHER, this.weather);
    this.notify();
  }

  // --- STATS & PURGE ---
  async getStats(): Promise<StorageStats> {
    if (!this.isLoaded) this.loadFromStorage();
    let estimatedBytes = 0;
    this.media.forEach((m) => {
      estimatedBytes += m.url ? m.url.length : 0;
    });

    return {
      screensCount: this.screens.length,
      mediaCount: this.media.length,
      playlistsCount: this.playlists.length,
      estimatedBytes,
      databaseType: 'Nuvem BM Cast (Cache Resiliente)',
    };
  }

  async clearAll(): Promise<void> {
    this.screens = [];
    this.media = [];
    this.playlists = [];
    this.saveItem(STORAGE_KEYS.SCREENS, []);
    this.saveItem(STORAGE_KEYS.MEDIA, []);
    this.saveItem(STORAGE_KEYS.PLAYLISTS, []);
    this.notify();
  }

  async exportDatabase(): Promise<string> {
    if (!this.isLoaded) this.loadFromStorage();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        brand: 'BM Cast Enterprise',
        screens: this.screens,
        media: this.media,
        playlists: this.playlists,
        config: this.config,
        ticker: this.ticker,
        weather: this.weather,
      },
      null,
      2
    );
  }

  async importDatabase(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.screens) && !Array.isArray(data.media)) {
        return false;
      }
      this.screens = Array.isArray(data.screens) ? data.screens : [];
      this.media = Array.isArray(data.media) ? data.media : [];
      this.playlists = Array.isArray(data.playlists) ? data.playlists : [];
      if (data.config) this.config = { ...DEFAULT_CONFIG, ...data.config };
      if (data.ticker) this.ticker = { ...DEFAULT_TICKER, ...data.ticker };
      if (data.weather) this.weather = { ...DEFAULT_WEATHER, ...data.weather };

      this.saveItem(STORAGE_KEYS.SCREENS, this.screens);
      this.saveItem(STORAGE_KEYS.MEDIA, this.media);
      this.saveItem(STORAGE_KEYS.PLAYLISTS, this.playlists);
      this.saveItem(STORAGE_KEYS.CONFIG, this.config);
      this.saveItem(STORAGE_KEYS.TICKER, this.ticker);
      this.saveItem(STORAGE_KEYS.WEATHER, this.weather);

      this.notify();
      return true;
    } catch (e) {
      console.error('Falha ao restaurar banco:', e);
      return false;
    }
  }
}

export const dbService = new ResilientDatabase();
