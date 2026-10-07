import { db, DB_CHANGE_EVENT } from './db';
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
    db.saveScreen(screen);
  },

  async deleteScreen(id: string): Promise<void> {
    db.deleteScreen(id);
  },

  async getMedia(): Promise<MediaItem[]> {
    return db.getMedia();
  },

  async saveMedia(item: MediaItem, addToActivePlaylist = false): Promise<void> {
    db.saveMedia(item, addToActivePlaylist);
  },

  async deleteMedia(id: string): Promise<void> {
    db.deleteMedia(id);
  },

  async getPlaylists(): Promise<Playlist[]> {
    return db.getPlaylists();
  },

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return db.getPlaylist(id);
  },

  async savePlaylist(playlist: Playlist): Promise<void> {
    db.savePlaylist(playlist);
  },

  async deletePlaylist(id: string): Promise<void> {
    db.deletePlaylist(id);
  },

  async updatePlaylistItem(playlistId: string, item: PlaylistItem): Promise<void> {
    db.updatePlaylistItem(playlistId, item);
  },

  async duplicatePlaylistItem(playlistId: string, itemId: string): Promise<PlaylistItem | null> {
    return db.duplicatePlaylistItem(playlistId, itemId);
  },

  async getConfig(): Promise<SystemConfig> {
    return db.getConfig();
  },

  async saveConfig(cfg: Partial<SystemConfig>): Promise<void> {
    db.saveConfig(cfg);
  },

  async getTicker(): Promise<TickerConfig> {
    return db.getTicker();
  },

  async saveTicker(ticker: TickerConfig): Promise<void> {
    db.saveTicker(ticker);
  },

  async getWeather(): Promise<WeatherConfig> {
    return db.getWeather();
  },

  async saveWeather(weather: WeatherConfig): Promise<void> {
    db.saveWeather(weather);
  },

  async clearAll(): Promise<void> {
    db.clearAll();
  },

  isOnboardingCompleted(): boolean {
    return db.isOnboardingCompleted();
  },

  setOnboardingCompleted(completed: boolean): void {
    db.setOnboardingCompleted(completed);
  },
};
