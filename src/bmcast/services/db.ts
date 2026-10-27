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
import {
  supabaseService,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_KEY,
  SUPABASE_CHANGED_EVENT,
} from './supabaseClient';
import { authService } from './authService';

export const DB_CHANGE_EVENT = 'bmcast_db_changed';

const STORAGE_VERSION = 'bmcast_v8';

export interface PublicPlayerBundle {
  screen: Screen | null;
  playlist: Playlist | null;
  mediaList: MediaItem[];
  ticker: TickerConfig;
  weather: WeatherConfig;
  config: SystemConfig;
}

function createDefaultBrandProfile(): CompanyBrandProfile {
  return {
    name: '',
    slogan: '',
    logoUrl: '',
    accentColor: '#2563EB',
    phoneWhatsApp: '',
    instagramHandle: '',
    websiteUrl: '',
    defaultQrCodeUrl: '',
    defaultQrCodeImage: '',
    businessCategory: 'outro',
    onboardingCompleted: false,
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_KEY,
    supabaseConnected: true,
  };
}

function createDefaultConfig(): SystemConfig {
  return {
    organizationName: '',
    brandProfile: createDefaultBrandProfile(),
    themeAccent: '#2563EB',
    themeMode: 'dark',
    defaultLayoutMode: 'clean_media',
    enableSplitMode: true,
  };
}

function createDefaultTicker(): TickerConfig {
  return {
    enabled: false,
    text: '',
    speed: 'normal',
    accentTitle: 'AVISO',
    presetTopic: 'custom',
  };
}

function createDefaultWeather(): WeatherConfig {
  return {
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
}

function safeSetLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`Local storage quota warning (${key}):`, err);
  }
}

function mapScreenRow(s: any): Screen {
  return {
    id: s.id,
    name: s.name,
    location: s.location || '',
    slug: s.slug,
    pairingCode: s.pairing_code || '',
    activePlaylistId: s.active_playlist_id || '',
    status: s.status || 'online',
    resolution: s.resolution || '1080p',
    orientation: s.orientation || 'landscape',
    aspectRatio: s.aspect_ratio || '16:9',
    layoutMode: s.layout_mode || 'clean_media',
    brandName: s.brand_name || undefined,
    brandSlogan: s.brand_slogan || undefined,
    brandLogo: s.brand_logo || undefined,
    lastPing: s.last_ping || new Date().toISOString(),
    pairedAt: s.paired_at || new Date().toISOString(),
    notes: s.notes || undefined,
  };
}

function mapMediaRow(m: any): MediaItem {
  return {
    id: m.id,
    title: m.title,
    type: m.type || 'image',
    url: m.url,
    thumbnail: m.thumbnail || undefined,
    durationDefault: m.duration_default || 12,
    category: m.category || 'cardapio',
    brandConfig: m.brand_config || undefined,
    qrConfig: m.qr_config || undefined,
    categoryOverlay: m.category_overlay || undefined,
    fileSize: m.file_size || undefined,
    dimensions: m.dimensions || undefined,
    createdAt: m.created_at || new Date().toISOString(),
  };
}

function mapPlaylistRow(p: any): Playlist {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    screenId: p.screen_id || 'all',
    items: Array.isArray(p.items) ? p.items : [],
    isDefault: Boolean(p.is_default),
    updatedAt: p.updated_at || new Date().toISOString(),
  };
}

class ResilientDatabase {
  private screens: Screen[] = [];
  private media: MediaItem[] = [];
  private playlists: Playlist[] = [];
  private config: SystemConfig = createDefaultConfig();
  private ticker: TickerConfig = createDefaultTicker();
  private weather: WeatherConfig = createDefaultWeather();
  private broadcastChannel: BroadcastChannel | null = null;
  private realtimeChannel: any = null;
  private isSupabaseSyncing = false;
  private isServerSyncing = false;
  private lastSyncTime: string | null = null;
  private activeScope: string = 'guest';

  constructor() {
    this.activeScope = this.resolveUserScope();
    this.initBroadcast();
    this.loadFromStorage();
    this.refreshWeatherPeriodically();
    this.initAuthAndCloudListeners();
  }

  private resolveUserScope(): string {
    const user = authService.getCurrentUser();
    return user?.id ? user.id : 'guest';
  }

  private storageKey(entity: string, scope = this.activeScope): string {
    return `${STORAGE_VERSION}_${scope}_${entity}`;
  }

  private ensureScopedId(rawId: string): string {
    if (this.activeScope === 'guest') return rawId;
    const prefix = `${this.activeScope}__`;
    return rawId.startsWith(prefix) ? rawId : `${prefix}${rawId}`;
  }

  private configDocId(scope = this.activeScope): string {
    return scope === 'guest' ? 'guest_cfg' : `cfg_${scope}`;
  }

  private tickerDocId(scope = this.activeScope): string {
    return scope === 'guest' ? 'guest_tkr' : `tkr_${scope}`;
  }

  private weatherDocId(scope = this.activeScope): string {
    return scope === 'guest' ? 'guest_wth' : `wth_${scope}`;
  }

  private initBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bmcast_sync_channel');
        this.broadcastChannel.onmessage = (ev) => {
          if (ev.data && ev.data.type === 'DB_SYNC') {
            this.loadFromStorage();
            this.notifyListeners(false);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }
  }

  private notifyListeners(broadcast = true) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT));
      if (broadcast && this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'DB_SYNC', timestamp: Date.now() });
      }
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    this.activeScope = this.resolveUserScope();

    if (this.activeScope === 'guest') {
      this.screens = [];
      this.media = [];
      this.playlists = [];
      this.config = createDefaultConfig();
      this.ticker = createDefaultTicker();
      this.weather = createDefaultWeather();
      return;
    }

    try {
      const storedScreens = localStorage.getItem(this.storageKey('screens'));
      this.screens = storedScreens ? JSON.parse(storedScreens) : [];

      const storedMedia = localStorage.getItem(this.storageKey('media'));
      const parsedMedia: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
      this.media = parsedMedia.filter(
        (m) => !m.id.includes('demo-slide') && m.url !== '/demo-burger.jpg' && m.url !== '/demo-pizza.jpg'
      );

      const storedPlaylists = localStorage.getItem(this.storageKey('playlists'));
      this.playlists = storedPlaylists ? JSON.parse(storedPlaylists) : [];

      const storedConfig = localStorage.getItem(this.storageKey('config'));
      this.config = storedConfig ? JSON.parse(storedConfig) : createDefaultConfig();

      if (!this.config.brandProfile.supabaseUrl) {
        this.config.brandProfile.supabaseUrl = DEFAULT_SUPABASE_URL;
        this.config.brandProfile.supabaseAnonKey = DEFAULT_SUPABASE_KEY;
        this.config.brandProfile.supabaseConnected = true;
      }

      const storedTicker = localStorage.getItem(this.storageKey('ticker'));
      this.ticker = storedTicker ? JSON.parse(storedTicker) : createDefaultTicker();

      const storedWeather = localStorage.getItem(this.storageKey('weather'));
      this.weather = storedWeather ? JSON.parse(storedWeather) : createDefaultWeather();

      this.lastSyncTime = localStorage.getItem(this.storageKey('last_sync'));
    } catch (e) {
      console.error('Erro ao ler dados locais:', e);
      this.screens = [];
      this.media = [];
      this.playlists = [];
      this.config = createDefaultConfig();
      this.ticker = createDefaultTicker();
      this.weather = createDefaultWeather();
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    if (this.activeScope === 'guest') {
      this.notifyListeners();
      return;
    }
    safeSetLocalStorage(this.storageKey('screens'), JSON.stringify(this.screens));
    safeSetLocalStorage(this.storageKey('media'), JSON.stringify(this.media));
    safeSetLocalStorage(this.storageKey('playlists'), JSON.stringify(this.playlists));
    safeSetLocalStorage(this.storageKey('config'), JSON.stringify(this.config));
    safeSetLocalStorage(this.storageKey('ticker'), JSON.stringify(this.ticker));
    safeSetLocalStorage(this.storageKey('weather'), JSON.stringify(this.weather));
    this.notifyListeners();
  }

  async pushWorkspaceToServer(scope = this.resolveUserScope()): Promise<boolean> {
    if (typeof window === 'undefined' || !scope || scope === 'guest') return false;
    try {
      const res = await fetch(`/api/workspace/${encodeURIComponent(scope)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screens: this.screens,
          media: this.media,
          playlists: this.playlists,
          config: this.config,
          ticker: this.ticker,
          weather: this.weather,
        }),
      });
      if (res.ok) {
        this.lastSyncTime = new Date().toISOString();
        safeSetLocalStorage(this.storageKey('last_sync', scope), this.lastSyncTime);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async syncFromServer(pushLocalIfRemoteEmpty = true): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const scope = this.resolveUserScope();
    if (!scope || scope === 'guest' || this.isServerSyncing) return false;

    this.isServerSyncing = true;
    try {
      const res = await fetch(`/api/workspace/${encodeURIComponent(scope)}`);
      if (!res.ok) return false;
      const json = await res.json();

      const localHasContent =
        this.screens.length > 0 ||
        this.media.length > 0 ||
        Boolean(this.config?.brandProfile?.name) ||
        Boolean(this.config?.brandProfile?.onboardingCompleted);

      if (!json?.exists || !json?.workspace) {
        if (pushLocalIfRemoteEmpty && localHasContent) {
          await this.pushWorkspaceToServer(scope);
        }
        return true;
      }

      const ws = json.workspace;
      const remoteScreens: Screen[] = Array.isArray(ws.screens) ? ws.screens : [];
      const remoteMedia: MediaItem[] = (Array.isArray(ws.media) ? ws.media : []).filter(
        (m: any) => !String(m?.id || '').includes('demo-slide') && m?.url !== '/demo-burger.jpg' && m?.url !== '/demo-pizza.jpg'
      );
      const remotePlaylists: Playlist[] = Array.isArray(ws.playlists) ? ws.playlists : [];
      const remoteHasContent =
        remoteScreens.length > 0 ||
        remoteMedia.length > 0 ||
        Boolean(ws.config?.brandProfile?.name) ||
        Boolean(ws.config?.brandProfile?.onboardingCompleted);

      if (!remoteHasContent && pushLocalIfRemoteEmpty && localHasContent) {
        await this.pushWorkspaceToServer(scope);
        return true;
      }

      this.screens = remoteScreens;
      this.media = remoteMedia;
      this.playlists = remotePlaylists;
      if (ws.config) {
        this.config = {
          ...createDefaultConfig(),
          ...ws.config,
          brandProfile: {
            ...createDefaultBrandProfile(),
            ...(ws.config.brandProfile || {}),
          },
        };
      }
      if (ws.ticker) {
        this.ticker = { ...createDefaultTicker(), ...ws.ticker };
      }
      if (ws.weather) {
        this.weather = { ...createDefaultWeather(), ...ws.weather };
      }

      const syncStamp = String(ws.updatedAt || new Date().toISOString());
      this.lastSyncTime = syncStamp;
      safeSetLocalStorage(this.storageKey('last_sync', scope), syncStamp);
      this.saveToStorage();
      return true;
    } catch {
      return false;
    } finally {
      this.isServerSyncing = false;
    }
  }

  private initAuthAndCloudListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('bmcast_auth_changed', () => {
      const nextScope = this.resolveUserScope();
      this.activeScope = nextScope;
      this.loadFromStorage();
      this.notifyListeners(false);
      if (nextScope !== 'guest') {
        this.syncFromServer(true);
        if (!supabaseService.isSchemaKnownMissing()) {
          this.syncFromSupabase(true);
        }
      }
    });

    window.addEventListener(SUPABASE_CHANGED_EVENT, () => {
      if (!supabaseService.isSchemaKnownMissing()) {
        this.syncFromSupabase(true);
        this.setupRealtimeSubscription();
      }
    });

    setTimeout(() => {
      if (this.activeScope !== 'guest') {
        this.syncFromServer(true);
      }
      if (!supabaseService.isSchemaKnownMissing()) {
        this.cleanupLegacyDemoRows();
        if (this.activeScope !== 'guest') {
          this.syncFromSupabase(true);
        }
        this.setupRealtimeSubscription();
      }
    }, 300);

    // Keep PC and Mobile ("celular") synchronized automatically while visible
    setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        this.resolveUserScope() !== 'guest'
      ) {
        this.syncFromServer(false);
      }
    }, 12000);
  }

  private async cleanupLegacyDemoRows() {
    const client = this.getActiveCloudClient();
    if (!client) return;
    try {
      await client.from('media').delete().in('id', ['demo-slide-1', 'demo-slide-2']);
      await client.from('playlists').delete().eq('id', 'playlist-padrao').eq('name', 'Programação de Exemplo');
    } catch {
      /* ignore */
    }
  }

  private getActiveCloudClient() {
    if (supabaseService.isSchemaKnownMissing()) return null;
    return supabaseService.getClient();
  }

  private setupRealtimeSubscription() {
    const client = this.getActiveCloudClient();
    if (!client) return;

    try {
      if (this.realtimeChannel) {
        client.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = client
        .channel('bmcast_realtime_changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          if (this.activeScope !== 'guest') {
            this.syncFromSupabase(false);
          } else {
            this.notifyListeners(false);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription warning:', e);
    }
  }

  /**
   * Sincroniza os dados pertencentes à conta logada atual
   */
  async syncFromSupabase(pushLocalIfRemoteEmpty = true): Promise<{ success: boolean; message: string }> {
    const scope = this.resolveUserScope();
    if (scope === 'guest') {
      return { success: true, message: 'Sessão visitante.' };
    }

    // Always synchronize with backend server first
    await this.syncFromServer(pushLocalIfRemoteEmpty);

    const client = supabaseService.getClient();
    if (!client) {
      return { success: true, message: 'Dados sincronizados.' };
    }

    if (this.isSupabaseSyncing) {
      return { success: true, message: 'Sincronização já em andamento.' };
    }

    this.isSupabaseSyncing = true;
    const prefixPattern = `${scope}__%`;

    try {
      const { data: screensData, error: screensErr } = await client
        .from('screens')
        .select('*')
        .like('id', prefixPattern);

      if (screensErr) {
        if (
          screensErr.code === 'PGRST205' ||
          screensErr.code === '42P01' ||
          screensErr.message.includes('Could not find the table') ||
          screensErr.message.includes('does not exist')
        ) {
          supabaseService.markSchemaStatus(false);
          return {
            success: true,
            message: 'Dados sincronizados no servidor.',
          };
        }
      } else {
        supabaseService.markSchemaStatus(true);
      }

      if (!screensErr && Array.isArray(screensData) && screensData.length > 0) {
        this.screens = screensData.map(mapScreenRow);
      }

      const { data: mediaData, error: mediaErr } = await client
        .from('media')
        .select('*')
        .like('id', prefixPattern);

      if (!mediaErr && Array.isArray(mediaData) && mediaData.length > 0) {
        this.media = mediaData.map(mapMediaRow);
      }

      const { data: plData, error: plErr } = await client
        .from('playlists')
        .select('*')
        .like('id', prefixPattern);

      if (!plErr && Array.isArray(plData) && plData.length > 0) {
        this.playlists = plData.map(mapPlaylistRow);
      }

      const { data: cfgData, error: cfgErr } = await client
        .from('system_config')
        .select('*')
        .eq('id', this.configDocId(scope))
        .maybeSingle();

      if (!cfgErr && cfgData) {
        this.config = {
          organizationName: cfgData.organization_name || this.config.organizationName,
          brandProfile: {
            ...this.config.brandProfile,
            ...(cfgData.brand_profile || {}),
          },
          themeAccent: cfgData.theme_accent || this.config.themeAccent,
          themeMode: cfgData.theme_mode || this.config.themeMode,
          defaultLayoutMode: cfgData.default_layout_mode || this.config.defaultLayoutMode,
          enableSplitMode:
            cfgData.enable_split_mode !== undefined
              ? cfgData.enable_split_mode
              : this.config.enableSplitMode,
        };
      }

      const { data: tickerData, error: tickerErr } = await client
        .from('ticker_config')
        .select('*')
        .eq('id', this.tickerDocId(scope))
        .maybeSingle();

      if (!tickerErr && tickerData) {
        this.ticker = {
          enabled: Boolean(tickerData.enabled),
          text: tickerData.text ?? '',
          speed: tickerData.speed || 'normal',
          accentTitle: tickerData.accent_title || 'AVISO',
          presetTopic: tickerData.preset_topic || 'custom',
        };
      }

      const { data: weatherData, error: weatherErr } = await client
        .from('weather_config')
        .select('*')
        .eq('id', this.weatherDocId(scope))
        .maybeSingle();

      if (!weatherErr && weatherData) {
        this.weather = {
          autoDetect: Boolean(weatherData.auto_detect),
          city: weatherData.city || this.weather.city,
          stateCode: weatherData.state_code || this.weather.stateCode,
          latitude: typeof weatherData.latitude === 'number' ? weatherData.latitude : this.weather.latitude,
          longitude: typeof weatherData.longitude === 'number' ? weatherData.longitude : this.weather.longitude,
          temp: typeof weatherData.temp === 'number' ? weatherData.temp : this.weather.temp,
          tempMin: typeof weatherData.temp_min === 'number' ? weatherData.temp_min : this.weather.tempMin,
          tempMax: typeof weatherData.temp_max === 'number' ? weatherData.temp_max : this.weather.tempMax,
          condition: weatherData.condition || this.weather.condition,
          conditionText: weatherData.condition_text || this.weather.conditionText,
          humidity: typeof weatherData.humidity === 'number' ? weatherData.humidity : this.weather.humidity,
          windKmH: typeof weatherData.wind_km_h === 'number' ? weatherData.wind_km_h : this.weather.windKmH,
          lastFetchedAt: weatherData.last_fetched_at || this.weather.lastFetchedAt,
          source: weatherData.source || 'open_meteo_live',
        };
      }

      if (
        pushLocalIfRemoteEmpty &&
        screensData &&
        screensData.length === 0 &&
        (this.screens.length > 0 || this.media.length > 0)
      ) {
        await this.pushAllToSupabase();
      }

      this.lastSyncTime = new Date().toISOString();
      safeSetLocalStorage(this.storageKey('last_sync', scope), this.lastSyncTime);
      this.saveToStorage();
      await this.pushWorkspaceToServer(scope);

      return {
        success: true,
        message: 'Dados sincronizados com sucesso.',
      };
    } catch (e: any) {
      console.warn('Erro ao sincronizar:', e);
      return {
        success: false,
        message: 'Erro durante a sincronização.',
      };
    } finally {
      this.isSupabaseSyncing = false;
    }
  }

  /**
   * Carrega o pacote público de uma TV específica pelo link curto (/tv1) ou código numérico (/1024),
   * mesmo quando a Smart TV ou celular não está logado em nenhuma conta!
   */
  async getPublicPlayerBundle(slugOrCode: string): Promise<PublicPlayerBundle> {
    const cleanTarget = decodeURIComponent(slugOrCode).trim().toLowerCase().replace(/^\/+/, '');

    // 1. Primary cross-device Server Player Resolver (/api/player/:slugOrCode)
    if (typeof window !== 'undefined' && cleanTarget) {
      try {
        const res = await fetch(`/api/player/${encodeURIComponent(cleanTarget)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.found && json?.bundle) {
            const b = json.bundle;
            return {
              screen: b.screen || null,
              playlist: b.playlist || null,
              mediaList: (Array.isArray(b.mediaList) ? b.mediaList : []).filter(
                (m: any) =>
                  !String(m?.id || '').includes('demo-slide') &&
                  m?.url !== '/demo-burger.jpg' &&
                  m?.url !== '/demo-pizza.jpg'
              ),
              ticker: b.ticker ? { ...createDefaultTicker(), ...b.ticker } : createDefaultTicker(),
              weather: b.weather ? { ...createDefaultWeather(), ...b.weather } : this.weather,
              config: b.config
                ? {
                    ...createDefaultConfig(),
                    ...b.config,
                    brandProfile: {
                      ...createDefaultBrandProfile(),
                      ...(b.config.brandProfile || {}),
                    },
                  }
                : this.config,
            };
          }
        }
      } catch {
        /* fallback below */
      }
    }

    // 2. Secondary Cloud Lookup (Supabase if tables exist)
    const client = this.getActiveCloudClient();
    if (client && cleanTarget) {
      try {
        const { data: allScreens, error: scrErr } = await client.from('screens').select('*');
        if (!scrErr && Array.isArray(allScreens) && allScreens.length > 0) {
          const matchedRow = allScreens.find((s: any) => {
            const sSlug = String(s.slug || '').trim().toLowerCase();
            const sCode = String(s.pairing_code || '').trim().toLowerCase();
            const sDigits = sCode.replace(/^tv-/i, '');
            return sSlug === cleanTarget || sCode === cleanTarget || (sDigits && sDigits === cleanTarget);
          });

          if (matchedRow) {
            const screen = mapScreenRow(matchedRow);
            const ownerScope = screen.id.includes('__') ? screen.id.split('__')[0] : null;
            const prefix = ownerScope ? `${ownerScope}__%` : null;

            const mediaQuery = prefix
              ? client.from('media').select('*').like('id', prefix)
              : client.from('media').select('*');
            const plQuery = prefix
              ? client.from('playlists').select('*').like('id', prefix)
              : client.from('playlists').select('*');
            const tkrId = ownerScope ? `tkr_${ownerScope}` : 'default';
            const wthId = ownerScope ? `wth_${ownerScope}` : 'default';
            const cfgId = ownerScope ? `cfg_${ownerScope}` : 'default';

            const [mediaRes, plRes, tkrRes, wthRes, cfgRes] = await Promise.all([
              mediaQuery,
              plQuery,
              client.from('ticker_config').select('*').eq('id', tkrId).maybeSingle(),
              client.from('weather_config').select('*').eq('id', wthId).maybeSingle(),
              client.from('system_config').select('*').eq('id', cfgId).maybeSingle(),
            ]);

            const mediaList = Array.isArray(mediaRes.data)
              ? mediaRes.data
                  .map(mapMediaRow)
                  .filter(
                    (m) =>
                      !m.id.includes('demo-slide') &&
                      m.url !== '/demo-burger.jpg' &&
                      m.url !== '/demo-pizza.jpg'
                  )
              : [];
            const playlists = Array.isArray(plRes.data) ? plRes.data.map(mapPlaylistRow) : [];

            const resolvedPlaylist =
              playlists.find((p) => p.id === screen.activePlaylistId) ||
              playlists.find((p) => p.items && p.items.length > 0) ||
              playlists[0] ||
              null;

            const ticker: TickerConfig = tkrRes.data
              ? {
                  enabled: Boolean(tkrRes.data.enabled),
                  text: tkrRes.data.text || '',
                  speed: tkrRes.data.speed || 'normal',
                  accentTitle: tkrRes.data.accent_title || 'AVISO',
                }
              : createDefaultTicker();

            const weather: WeatherConfig = wthRes.data
              ? {
                  autoDetect: Boolean(wthRes.data.auto_detect),
                  city: wthRes.data.city || 'São Paulo',
                  stateCode: wthRes.data.state_code || 'SP',
                  latitude: typeof wthRes.data.latitude === 'number' ? wthRes.data.latitude : -23.5505,
                  longitude: typeof wthRes.data.longitude === 'number' ? wthRes.data.longitude : -46.6333,
                  temp: typeof wthRes.data.temp === 'number' ? wthRes.data.temp : 24,
                  tempMin: typeof wthRes.data.temp_min === 'number' ? wthRes.data.temp_min : 18,
                  tempMax: typeof wthRes.data.temp_max === 'number' ? wthRes.data.temp_max : 27,
                  condition: wthRes.data.condition || 'partly_cloudy',
                  conditionText: wthRes.data.condition_text || 'Parcialmente Nublado',
                  humidity: typeof wthRes.data.humidity === 'number' ? wthRes.data.humidity : 58,
                  windKmH: typeof wthRes.data.wind_km_h === 'number' ? wthRes.data.wind_km_h : 12,
                  lastFetchedAt: wthRes.data.last_fetched_at || new Date().toISOString(),
                  source: 'open_meteo_live',
                }
              : this.weather;

            const config: SystemConfig = cfgRes.data
              ? {
                  ...createDefaultConfig(),
                  organizationName: cfgRes.data.organization_name || '',
                  brandProfile: {
                    ...createDefaultBrandProfile(),
                    ...(cfgRes.data.brand_profile || {}),
                  },
                }
              : this.config;

            return {
              screen,
              playlist: resolvedPlaylist,
              mediaList,
              ticker,
              weather,
              config,
            };
          }
        }
      } catch (err) {
        console.warn('Fallback local para player:', err);
      }
    }

    // 3. Fallback local: busca na sessão local ativa ou em qualquer conta salva neste navegador
    const matchScreen = (list: Screen[]) =>
      list.find((s) => {
        const sSlug = s.slug.trim().toLowerCase();
        const sCode = (s.pairingCode || '').trim().toLowerCase();
        const sDigits = sCode.replace(/^tv-/i, '');
        return sSlug === cleanTarget || sCode === cleanTarget || (sDigits && sDigits === cleanTarget);
      });

    let foundLocal = matchScreen(this.screens) || (this.screens[0] ?? null);
    let localMedia = this.media;
    let localPlaylists = this.playlists;
    let localTicker = this.ticker;
    let localWeather = this.weather;
    let localConfig = this.config;

    if (!foundLocal && typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`${STORAGE_VERSION}_`) && k.endsWith('_screens')) {
          try {
            const candidateScreens: Screen[] = JSON.parse(localStorage.getItem(k) || '[]');
            const m = matchScreen(candidateScreens);
            if (m) {
              const scopePrefix = k.slice(0, -'_screens'.length);
              foundLocal = m;
              localMedia = JSON.parse(localStorage.getItem(`${scopePrefix}_media`) || '[]');
              localPlaylists = JSON.parse(localStorage.getItem(`${scopePrefix}_playlists`) || '[]');
              localTicker =
                JSON.parse(localStorage.getItem(`${scopePrefix}_ticker`) || 'null') || createDefaultTicker();
              localWeather =
                JSON.parse(localStorage.getItem(`${scopePrefix}_weather`) || 'null') || createDefaultWeather();
              localConfig =
                JSON.parse(localStorage.getItem(`${scopePrefix}_config`) || 'null') || createDefaultConfig();
              break;
            }
          } catch {
            /* ignore */
          }
        }
      }
    }

    const resolvedPl =
      (foundLocal?.activePlaylistId
        ? localPlaylists.find((p) => p.id === foundLocal?.activePlaylistId)
        : null) ||
      localPlaylists.find((p) => p.items && p.items.length > 0) ||
      localPlaylists[0] ||
      null;

    return {
      screen: foundLocal,
      playlist: resolvedPl,
      mediaList: localMedia,
      ticker: localTicker,
      weather: localWeather,
      config: localConfig,
    };
  }

  async generateUniqueShortSlug(preferredBase = 'tv'): Promise<{ slug: string; pairingCode: string }> {
    const cleanBase =
      preferredBase
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10) || 'tv';

    const existingSlugs = new Set(this.screens.map((s) => s.slug.toLowerCase()));
    const existingCodes = new Set(this.screens.map((s) => s.pairingCode));

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/screens/taken');
        if (res.ok) {
          const taken = await res.json();
          if (Array.isArray(taken?.slugs)) {
            taken.slugs.forEach((sl: string) => existingSlugs.add(String(sl).toLowerCase()));
          }
          if (Array.isArray(taken?.codes)) {
            taken.codes.forEach((cd: string) => existingCodes.add(String(cd)));
          }
        }
      } catch {
        /* ignore */
      }
    }

    const client = this.getActiveCloudClient();
    if (client) {
      try {
        const { data } = await client.from('screens').select('slug,pairing_code');
        if (Array.isArray(data)) {
          data.forEach((row: any) => {
            if (row.slug) existingSlugs.add(String(row.slug).toLowerCase());
            if (row.pairing_code) existingCodes.add(String(row.pairing_code));
          });
        }
      } catch {
        /* ignore */
      }
    }

    let slug = cleanBase === 'tv' ? `tv${this.screens.length + 1}` : cleanBase;
    let counter = this.screens.length + 1;
    while (existingSlugs.has(slug.toLowerCase())) {
      counter += 1;
      slug = `${cleanBase === 'tv' ? 'tv' : cleanBase}${counter}`;
    }

    let code = String(Math.floor(1000 + Math.random() * 9000));
    while (existingCodes.has(code)) {
      code = String(Math.floor(1000 + Math.random() * 9000));
    }

    return { slug, pairingCode: code };
  }

  async pushAllToSupabase(): Promise<{ success: boolean; message: string }> {
    const scope = this.resolveUserScope();
    if (scope === 'guest') {
      return { success: false, message: 'Sessão não autenticada.' };
    }

    await this.pushWorkspaceToServer(scope);

    const client = supabaseService.getClient();
    if (!client) {
      return { success: true, message: 'Dados salvos!' };
    }

    try {
      const probe = await client.from('system_config').select('id').limit(1);
      if (
        probe.error &&
        (probe.error.code === 'PGRST205' ||
          probe.error.code === '42P01' ||
          probe.error.message.includes('Could not find the table') ||
          probe.error.message.includes('does not exist'))
      ) {
        supabaseService.markSchemaStatus(false);
        return {
          success: true,
          message: 'Dados salvos no servidor!',
        };
      }
      supabaseService.markSchemaStatus(true);

      if (this.screens.length > 0) {
        const rows = this.screens.map((s) => ({
          id: this.ensureScopedId(s.id),
          name: s.name,
          location: s.location,
          slug: s.slug,
          pairing_code: s.pairingCode,
          active_playlist_id: s.activePlaylistId ? this.ensureScopedId(s.activePlaylistId) : '',
          status: s.status,
          resolution: s.resolution,
          orientation: s.orientation,
          aspect_ratio: s.aspectRatio,
          layout_mode: s.layoutMode || 'clean_media',
          brand_name: s.brandName || null,
          brand_slogan: s.brandSlogan || null,
          brand_logo: s.brandLogo || null,
          last_ping: s.lastPing,
          paired_at: s.pairedAt,
          notes: s.notes || null,
        }));
        await client.from('screens').upsert(rows);
      }

      if (this.media.length > 0) {
        const rows = this.media.map((m) => ({
          id: this.ensureScopedId(m.id),
          title: m.title,
          type: m.type,
          url: m.url,
          thumbnail: m.thumbnail || null,
          duration_default: m.durationDefault,
          category: m.category,
          brand_config: m.brandConfig || null,
          qr_config: m.qrConfig || null,
          category_overlay: m.categoryOverlay || null,
          file_size: m.fileSize || null,
          dimensions: m.dimensions || null,
        }));
        await client.from('media').upsert(rows);
      }

      if (this.playlists.length > 0) {
        const rows = this.playlists.map((p) => ({
          id: this.ensureScopedId(p.id),
          name: p.name,
          description: p.description,
          screen_id: p.screenId || 'all',
          items: p.items.map((it) => ({ ...it, mediaId: this.ensureScopedId(it.mediaId) })),
          is_default: p.isDefault || false,
          updated_at: p.updatedAt,
        }));
        await client.from('playlists').upsert(rows);
      }

      await client.from('system_config').upsert({
        id: this.configDocId(scope),
        organization_name: this.config.organizationName,
        brand_profile: this.config.brandProfile,
        theme_accent: this.config.themeAccent,
        theme_mode: this.config.themeMode,
        default_layout_mode: this.config.defaultLayoutMode,
        enable_split_mode: this.config.enableSplitMode,
        updated_at: new Date().toISOString(),
      });

      await client.from('ticker_config').upsert({
        id: this.tickerDocId(scope),
        enabled: this.ticker.enabled,
        text: this.ticker.text,
        speed: this.ticker.speed,
        accent_title: this.ticker.accentTitle || 'AVISO',
        preset_topic: this.ticker.presetTopic || 'custom',
        updated_at: new Date().toISOString(),
      });

      await client.from('weather_config').upsert({
        id: this.weatherDocId(scope),
        auto_detect: this.weather.autoDetect,
        city: this.weather.city,
        state_code: this.weather.stateCode,
        latitude: this.weather.latitude,
        longitude: this.weather.longitude,
        temp: this.weather.temp,
        temp_min: this.weather.tempMin,
        temp_max: this.weather.tempMax,
        condition: this.weather.condition,
        condition_text: this.weather.conditionText,
        humidity: this.weather.humidity,
        wind_km_h: this.weather.windKmH,
        last_fetched_at: this.weather.lastFetchedAt,
        source: this.weather.source,
      });

      this.lastSyncTime = new Date().toISOString();
      safeSetLocalStorage(this.storageKey('last_sync', scope), this.lastSyncTime);

      return {
        success: true,
        message: 'Dados salvos na nuvem!',
      };
    } catch (e: any) {
      console.warn('Erro ao enviar dados:', e);
      return {
        success: false,
        message: 'Erro ao salvar dados na nuvem.',
      };
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
        if (this.activeScope !== 'guest') {
          this.saveToStorage();
        }
      } catch (err) {
        console.warn('Erro ao atualizar clima inicial:', err);
      }
    }, 1500);

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
          if (this.activeScope !== 'guest') {
            this.saveToStorage();
            this.pushWorkspaceToServer();
          }
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
    return this.screens.find(
      (s) => s.slug.toLowerCase().trim() === clean || (s.pairingCode || '').toLowerCase().trim() === clean
    );
  }

  async saveScreen(screen: Screen): Promise<void> {
    const scopedId = this.ensureScopedId(screen.id);
    const scopedPlaylistId = screen.activePlaylistId ? this.ensureScopedId(screen.activePlaylistId) : '';
    const updated: Screen = {
      ...screen,
      id: scopedId,
      activePlaylistId: scopedPlaylistId,
      lastPing: new Date().toISOString(),
    };

    const idx = this.screens.findIndex((s) => s.id === scopedId || s.id === screen.id);
    if (idx >= 0) {
      this.screens[idx] = updated;
    } else {
      this.screens.push(updated);
    }
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      client
        .from('screens')
        .upsert({
          id: updated.id,
          name: updated.name,
          location: updated.location,
          slug: updated.slug,
          pairing_code: updated.pairingCode,
          active_playlist_id: updated.activePlaylistId,
          status: updated.status,
          resolution: updated.resolution,
          orientation: updated.orientation,
          aspect_ratio: updated.aspectRatio,
          layout_mode: updated.layoutMode || 'clean_media',
          brand_name: updated.brandName || null,
          brand_slogan: updated.brandSlogan || null,
          brand_logo: updated.brandLogo || null,
          last_ping: updated.lastPing,
          paired_at: updated.pairedAt,
          notes: updated.notes || null,
        })
        .then(({ error }) => {
          if (error) console.warn('Screen save warning:', error.message);
        }, () => {});
    }
  }

  async deleteScreen(id: string): Promise<void> {
    const scopedId = this.ensureScopedId(id);
    this.screens = this.screens.filter((s) => s.id !== id && s.id !== scopedId);
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client) {
      client
        .from('screens')
        .delete()
        .in('id', [id, scopedId])
        .then(() => {}, () => {});
    }
  }

  // --- Media CRUD ---
  getMedia(): MediaItem[] {
    return [...this.media];
  }

  async saveMedia(item: MediaItem, addToActivePlaylist = false): Promise<void> {
    const scopedId = this.ensureScopedId(item.id);
    const scopedItem: MediaItem = { ...item, id: scopedId };

    const idx = this.media.findIndex((m) => m.id === scopedId || m.id === item.id);
    if (idx >= 0) {
      this.media[idx] = scopedItem;
    } else {
      this.media.unshift(scopedItem);
    }

    if (addToActivePlaylist) {
      let activePlaylist = this.playlists[0];
      if (!activePlaylist) {
        activePlaylist = {
          id: this.ensureScopedId(`pl_${Date.now()}`),
          name: 'Programação Principal',
          description: 'Grade de slides ativa na TV',
          items: [],
          isDefault: true,
          updatedAt: new Date().toISOString(),
        };
        this.playlists.push(activePlaylist);
      }

      const existingInPlaylistIdx = activePlaylist.items.findIndex(
        (pi) => pi.mediaId === scopedId || pi.mediaId === item.id
      );

      if (existingInPlaylistIdx >= 0 && idx >= 0) {
        const currentPi = activePlaylist.items[existingInPlaylistIdx]!;
        activePlaylist.items[existingInPlaylistIdx] = {
          ...currentPi,
          mediaId: scopedId,
          durationSeconds: scopedItem.durationDefault || currentPi.durationSeconds || 12,
          customTitle: scopedItem.title,
          brandConfig: scopedItem.brandConfig,
          qrConfig: scopedItem.qrConfig,
          categoryOverlay: scopedItem.categoryOverlay,
        };
      } else {
        const newItem: PlaylistItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mediaId: scopedId,
          durationSeconds: scopedItem.durationDefault || 12,
          order: activePlaylist.items.length,
          customTitle: scopedItem.title,
          brandConfig: scopedItem.brandConfig,
          qrConfig: scopedItem.qrConfig,
          categoryOverlay: scopedItem.categoryOverlay,
        };
        activePlaylist.items.push(newItem);
      }

      activePlaylist.updatedAt = new Date().toISOString();
      await this.savePlaylist(activePlaylist);
    }

    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      client
        .from('media')
        .upsert({
          id: scopedItem.id,
          title: scopedItem.title,
          type: scopedItem.type,
          url: scopedItem.url,
          thumbnail: scopedItem.thumbnail || null,
          duration_default: scopedItem.durationDefault,
          category: scopedItem.category,
          brand_config: scopedItem.brandConfig || null,
          qr_config: scopedItem.qrConfig || null,
          category_overlay: scopedItem.categoryOverlay || null,
          file_size: scopedItem.fileSize || null,
          dimensions: scopedItem.dimensions || null,
        })
        .then(({ error }) => {
          if (error) console.warn('Media save warning:', error.message);
        }, () => {});
    }
  }

  async deleteMedia(id: string): Promise<void> {
    const scopedId = this.ensureScopedId(id);
    this.media = this.media.filter((m) => m.id !== id && m.id !== scopedId);
    for (const p of this.playlists) {
      p.items = p.items.filter((item) => item.mediaId !== id && item.mediaId !== scopedId);
      p.updatedAt = new Date().toISOString();
    }
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client) {
      client
        .from('media')
        .delete()
        .in('id', [id, scopedId])
        .then(() => {}, () => {});
    }
  }

  // --- Playlists CRUD ---
  getPlaylists(): Playlist[] {
    return [...this.playlists];
  }

  getPlaylist(id: string): Playlist | undefined {
    const scopedId = this.ensureScopedId(id);
    return this.playlists.find((p) => p.id === id || p.id === scopedId);
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    const scopedId = this.ensureScopedId(playlist.id);
    const updated: Playlist = {
      ...playlist,
      id: scopedId,
      items: playlist.items.map((it) => ({
        ...it,
        mediaId: this.ensureScopedId(it.mediaId),
      })),
      updatedAt: new Date().toISOString(),
    };

    const idx = this.playlists.findIndex((p) => p.id === scopedId || p.id === playlist.id);
    if (idx >= 0) {
      this.playlists[idx] = updated;
    } else {
      this.playlists.push(updated);
    }
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      client
        .from('playlists')
        .upsert({
          id: updated.id,
          name: updated.name,
          description: updated.description,
          screen_id: updated.screenId || 'all',
          items: updated.items,
          is_default: Boolean(updated.isDefault),
          updated_at: updated.updatedAt,
        })
        .then(({ error }) => {
          if (error) console.warn('Playlist save warning:', error.message);
        }, () => {});
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    const scopedId = this.ensureScopedId(id);
    this.playlists = this.playlists.filter((p) => p.id !== id && p.id !== scopedId);
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client) {
      client
        .from('playlists')
        .delete()
        .in('id', [id, scopedId])
        .then(() => {}, () => {});
    }
  }

  async updatePlaylistItem(playlistId: string, item: PlaylistItem): Promise<void> {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return;
    const idx = playlist.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      playlist.items[idx] = item;
      playlist.updatedAt = new Date().toISOString();
      await this.savePlaylist(playlist);
    }
  }

  async duplicatePlaylistItem(playlistId: string, itemId: string): Promise<PlaylistItem | null> {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return null;
    const item = playlist.items.find((i) => i.id === itemId);
    if (!item) return null;

    const duplicated: PlaylistItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customTitle: `${item.customTitle || 'Slide'} (Cópia)`,
      order: playlist.items.length,
    };
    playlist.items.push(duplicated);
    playlist.updatedAt = new Date().toISOString();
    await this.savePlaylist(playlist);
    return duplicated;
  }

  getConfig(): SystemConfig {
    return { ...this.config };
  }

  async saveConfig(cfg: Partial<SystemConfig>): Promise<void> {
    this.config = { ...this.config, ...cfg };
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      client
        .from('system_config')
        .upsert({
          id: this.configDocId(),
          organization_name: this.config.organizationName,
          brand_profile: this.config.brandProfile,
          theme_accent: this.config.themeAccent,
          theme_mode: this.config.themeMode,
          default_layout_mode: this.config.defaultLayoutMode,
          enable_split_mode: this.config.enableSplitMode,
          updated_at: new Date().toISOString(),
        })
        .then(() => {}, () => {});
    }
  }

  getTicker(): TickerConfig {
    return { ...this.ticker };
  }

  async saveTicker(ticker: TickerConfig): Promise<void> {
    this.ticker = { ...ticker };
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      client
        .from('ticker_config')
        .upsert({
          id: this.tickerDocId(),
          enabled: this.ticker.enabled,
          text: this.ticker.text,
          speed: this.ticker.speed,
          accent_title: this.ticker.accentTitle || 'AVISO',
          preset_topic: this.ticker.presetTopic || 'custom',
          updated_at: new Date().toISOString(),
        })
        .then(() => {}, () => {});
    }
  }

  getWeather(): WeatherConfig {
    return { ...this.weather };
  }

  async saveWeather(weather: WeatherConfig): Promise<void> {
    this.weather = { ...weather };
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      client
        .from('weather_config')
        .upsert({
          id: this.weatherDocId(),
          auto_detect: this.weather.autoDetect,
          city: this.weather.city,
          state_code: this.weather.stateCode,
          latitude: this.weather.latitude,
          longitude: this.weather.longitude,
          temp: this.weather.temp,
          temp_min: this.weather.tempMin,
          temp_max: this.weather.tempMax,
          condition: this.weather.condition,
          condition_text: this.weather.conditionText,
          humidity: this.weather.humidity,
          wind_km_h: this.weather.windKmH,
          last_fetched_at: this.weather.lastFetchedAt,
          source: this.weather.source,
        })
        .then(() => {}, () => {});
    }
  }

  getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  async clearAll(): Promise<void> {
    const oldScreenIds = this.screens.map((s) => s.id);
    const oldMediaIds = this.media.map((m) => m.id);
    const oldPlaylistIds = this.playlists.map((p) => p.id);

    this.screens = [];
    this.media = [];
    this.playlists = [];
    this.saveToStorage();
    await this.pushWorkspaceToServer();

    const client = this.getActiveCloudClient();
    if (client && this.activeScope !== 'guest') {
      const prefix = `${this.activeScope}__%`;
      if (oldScreenIds.length > 0) client.from('screens').delete().like('id', prefix).then(() => {}, () => {});
      if (oldMediaIds.length > 0) client.from('media').delete().like('id', prefix).then(() => {}, () => {});
      if (oldPlaylistIds.length > 0) client.from('playlists').delete().like('id', prefix).then(() => {}, () => {});
    }
  }
}

export const db = new ResilientDatabase();
