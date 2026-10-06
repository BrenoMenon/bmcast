/**
 * SignaCast Data Layer
 * Conecta com o IndexedDB formal da aplicação. Inicia 100% limpo sem dados fictícios pré-cadastrados.
 */

import { Screen, MediaItem, Playlist, SystemConfig, TickerConfig, WeatherConfig, LocalDBState } from '../types/signage';
import { dbService, DB_CHANGE_EVENT } from './db';

// Limpeza de cache antigo para atender ao pedido do usuário de remover tudo cadastrado
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('signacast_local_db_v1')) {
      localStorage.removeItem('signacast_local_db_v1');
    }
  } catch (e) {
    console.error(e);
  }
}

export const DB_UPDATED_EVENT = DB_CHANGE_EVENT;

export const storageService = {
  // Screens
  async getScreens(): Promise<Screen[]> {
    return await dbService.getScreens();
  },

  async getScreenBySlug(slug: string): Promise<Screen | undefined> {
    return await dbService.getScreenBySlug(slug);
  },

  async addScreen(data: {
    name: string;
    location: string;
    slug?: string;
    resolution?: '1080p' | '4K' | '720p';
    orientation?: 'landscape' | 'portrait';
    activePlaylistId?: string;
    notes?: string;
  }): Promise<Screen> {
    const id = `screen-${Date.now()}`;
    const generatedSlug = data.slug && data.slug.trim().length > 0
      ? data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const newScreen: Screen = {
      id,
      name: data.name,
      location: data.location || 'Ambiente Principal',
      slug: generatedSlug,
      activePlaylistId: data.activePlaylistId || '',
      status: 'online',
      resolution: data.resolution || '1080p',
      orientation: data.orientation || 'landscape',
      aspectRatio: data.orientation === 'portrait' ? '9:16' : '16:9',
      lastPing: new Date().toISOString(),
      pairedAt: new Date().toISOString(),
      notes: data.notes || '',
    };

    await dbService.saveScreen(newScreen);
    return newScreen;
  },

  async updateScreen(screen: Screen): Promise<void> {
    await dbService.saveScreen(screen);
  },

  async deleteScreen(id: string): Promise<void> {
    await dbService.deleteScreen(id);
  },

  // Media
  async getMedia(): Promise<MediaItem[]> {
    return await dbService.getMedia();
  },

  async addMedia(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem> {
    const newItem: MediaItem = {
      ...item,
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    await dbService.saveMedia(newItem);
    return newItem;
  },

  async deleteMedia(id: string): Promise<void> {
    await dbService.deleteMedia(id);
  },

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    return await dbService.getPlaylists();
  },

  async getPlaylistForScreen(screenId: string): Promise<Playlist | undefined> {
    const screens = await dbService.getScreens();
    const playlists = await dbService.getPlaylists();
    const screen = screens.find((s) => s.id === screenId);
    if (screen && screen.activePlaylistId) {
      const active = playlists.find((p) => p.id === screen.activePlaylistId);
      if (active) return active;
    }
    return playlists.find((p) => p.screenId === screenId) || playlists[0];
  },

  async savePlaylist(playlist: Playlist): Promise<void> {
    await dbService.savePlaylist(playlist);
  },

  async deletePlaylist(id: string): Promise<void> {
    await dbService.deletePlaylist(id);
  },

  // System Configs
  async getConfig(): Promise<SystemConfig> {
    return await dbService.getConfig();
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<void> {
    const current = await dbService.getConfig();
    await dbService.saveConfig({ ...current, ...config });
  },

  async getTicker(): Promise<TickerConfig> {
    return await dbService.getTicker();
  },

  async updateTicker(ticker: Partial<TickerConfig>): Promise<void> {
    const current = await dbService.getTicker();
    await dbService.saveTicker({ ...current, ...ticker });
  },

  async getWeather(): Promise<WeatherConfig> {
    return await dbService.getWeather();
  },

  async updateWeather(weather: Partial<WeatherConfig>): Promise<void> {
    const current = await dbService.getWeather();
    await dbService.saveWeather({ ...current, ...weather });
  },

  // Stats & Management
  async getStats() {
    return await dbService.getStats();
  },

  async clearAll(): Promise<void> {
    await dbService.clearAll();
  },

  async exportBackup(): Promise<string> {
    return await dbService.exportDatabase();
  },

  async importBackup(jsonString: string): Promise<boolean> {
    return await dbService.importDatabase(jsonString);
  },
};
