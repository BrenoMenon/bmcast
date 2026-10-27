import { db, DB_CHANGE_EVENT, PublicPlayerBundle } from './db';
import {
  Screen,
  MediaItem,
  Playlist,
  PlaylistItem,
  SystemConfig,
  TickerConfig,
  WeatherConfig,
} from '../types/signage';

export const DB_UPDATED_EVENT = DB_CHANGE_EVENT;

export const storageService = {
  async getScreens(): Promise<Screen[]> {
    return db.getScreens();
  },

  async getScreenBySlug(slug: string): Promise<Screen | undefined> {
    return db.getScreenBySlug(slug);
  },

  async saveScreen(screen: Screen): Promise<void> {
    await db.saveScreen(screen);
  },

  async deleteScreen(id: string): Promise<void> {
    await db.deleteScreen(id);
  },

  async generateUniqueShortSlug(preferredBase = 'tv'): Promise<{ slug: string; pairingCode: string }> {
    return db.generateUniqueShortSlug(preferredBase);
  },

  async getPublicPlayerBundle(slugOrCode: string): Promise<PublicPlayerBundle> {
    return db.getPublicPlayerBundle(slugOrCode);
  },

  async getMedia(): Promise<MediaItem[]> {
    return db.getMedia();
  },

  async saveMedia(item: MediaItem, addToActivePlaylist = false): Promise<void> {
    await db.saveMedia(item, addToActivePlaylist);
  },

  async deleteMedia(id: string): Promise<void> {
    await db.deleteMedia(id);
  },

  async getPlaylists(): Promise<Playlist[]> {
    return db.getPlaylists();
  },

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return db.getPlaylist(id);
  },

  async savePlaylist(playlist: Playlist): Promise<void> {
    await db.savePlaylist(playlist);
  },

  async deletePlaylist(id: string): Promise<void> {
    await db.deletePlaylist(id);
  },

  async updatePlaylistItem(playlistId: string, item: PlaylistItem): Promise<void> {
    await db.updatePlaylistItem(playlistId, item);
  },

  async duplicatePlaylistItem(playlistId: string, itemId: string): Promise<PlaylistItem | null> {
    return db.duplicatePlaylistItem(playlistId, itemId);
  },

  async getConfig(): Promise<SystemConfig> {
    return db.getConfig();
  },

  async saveConfig(cfg: Partial<SystemConfig>): Promise<void> {
    await db.saveConfig(cfg);
  },

  async getTicker(): Promise<TickerConfig> {
    return db.getTicker();
  },

  async saveTicker(ticker: TickerConfig): Promise<void> {
    await db.saveTicker(ticker);
  },

  async getWeather(): Promise<WeatherConfig> {
    return db.getWeather();
  },

  async saveWeather(weather: WeatherConfig): Promise<void> {
    await db.saveWeather(weather);
  },

  async clearAll(): Promise<void> {
    await db.clearAll();
  },

  async syncFromSupabase(pushLocalIfRemoteEmpty = true): Promise<{ success: boolean; message: string }> {
    return db.syncFromSupabase(pushLocalIfRemoteEmpty);
  },

  async pushAllToSupabase(): Promise<{ success: boolean; message: string }> {
    return db.pushAllToSupabase();
  },

  getLastSyncTime(): string | null {
    return db.getLastSyncTime();
  },
};
