import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sun,
  CloudSun,
  CloudRain,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Store,
  Tv,
} from 'lucide-react';
import {
  Screen,
  Playlist,
  MediaItem,
  TickerConfig,
  WeatherConfig,
  PlaylistItem,
  SlideQrCodeConfig,
} from '../../types/signage';
import { storageService, DB_UPDATED_EVENT } from '../../services/storageService';
import { qrService } from '../../services/qrService';

interface TVPlayerProps {
  slug: string;
  onExit?: () => void;
}

export const TVPlayer: React.FC<TVPlayerProps> = ({ slug, onExit }) => {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [ticker, setTicker] = useState<TickerConfig>({
    enabled: true,
    text: '',
    speed: 'normal',
    accentTitle: 'COMUNICADO',
  });
  const [weather, setWeather] = useState<WeatherConfig>({
    autoDetect: false,
    city: 'São Paulo',
    stateCode: 'SP',
    latitude: -23.5505,
    longitude: -46.6333,
    temp: 24,
    tempMin: 18,
    tempMax: 27,
    condition: 'partly_cloudy',
    conditionText: 'Tempo Bom',
    humidity: 58,
    windKmH: 12,
    lastFetchedAt: new Date().toISOString(),
    source: 'open_meteo_live',
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Auto-hide controls
  const [showControls, setShowControls] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // QR Code cache for current slide
  const [generatedQrMap, setGeneratedQrMap] = useState<Record<string, string>>({});

  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const screens = await storageService.getScreens();
      const allMedia = await storageService.getMedia();
      const allPlaylists = await storageService.getPlaylists();
      const t = await storageService.getTicker();
      const w = await storageService.getWeather();

      const cleanSlug = slug.toLowerCase().trim();
      const foundScreen = screens.find((s) => s.slug.toLowerCase().trim() === cleanSlug) || screens[0];

      setScreen(foundScreen || null);
      setMediaList(allMedia);
      setTicker(t);
      setWeather(w);

      if (foundScreen && foundScreen.activePlaylistId) {
        const active = allPlaylists.find((p) => p.id === foundScreen.activePlaylistId);
        setPlaylist(active || allPlaylists[0] || null);
      } else {
        setPlaylist(allPlaylists[0] || null);
      }
    } catch (e) {
      console.error('Falha ao carregar dados do player:', e);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
    const handleDBChange = () => {
      loadData();
    };
    window.addEventListener(DB_UPDATED_EVENT, handleDBChange);
    return () => {
      window.removeEventListener(DB_UPDATED_EVENT, handleDBChange);
    };
  }, [loadData]);

  // Clock tick
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Playlist items resolved
  const items: PlaylistItem[] = useMemo(() => {
    return playlist?.items || [];
  }, [playlist]);

  const currentItem = items[currentIndex];

  // Associated Media
  const currentMedia = useMemo(() => {
    if (!currentItem) return null;
    return mediaList.find((m) => m.id === currentItem.mediaId) || null;
  }, [currentItem, mediaList]);

  // Combined Configurations
  const activeBrandConfig = useMemo(() => {
    return currentItem?.brandConfig || currentMedia?.brandConfig || {
      showBrand: false,
    };
  }, [currentItem, currentMedia]);

  const activeQrConfig: SlideQrCodeConfig = useMemo(() => {
    return currentItem?.qrConfig || currentMedia?.qrConfig || {
      showQrCode: false,
      qrCodeType: 'generated',
      qrCodePosition: 'bottom-right' as const,
      qrCodeSize: 'medium' as const,
    };
  }, [currentItem, currentMedia]);

  const activeOverlayConfig = useMemo(() => {
    return currentItem?.categoryOverlay || currentMedia?.categoryOverlay || {
      showOverlayBadge: false,
      showPriceTag: false,
    };
  }, [currentItem, currentMedia]);

  // Generate QR Code if needed
  useEffect(() => {
    let isMounted = true;
    if (activeQrConfig?.showQrCode && activeQrConfig.qrCodeType === 'generated' && activeQrConfig.qrCodeUrl) {
      const url = activeQrConfig.qrCodeUrl;
      if (!generatedQrMap[url]) {
        qrService.generateDataUrl(url).then((dataUrl) => {
          if (isMounted) {
            setGeneratedQrMap((prev) => ({ ...prev, [url]: dataUrl }));
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [activeQrConfig, generatedQrMap]);

  const handleNextSlide = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setProgressPercent(0);
  }, [items.length]);

  const handlePrevSlide = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setProgressPercent(0);
  }, [items.length]);

  // Slide duration and timer loop
  useEffect(() => {
    if (!isPlaying || items.length === 0) return;

    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    const durationSec = currentItem?.durationSeconds || currentMedia?.durationDefault || 12;
    const durationMs = durationSec * 1000;
    const startTime = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgressPercent(pct);
    }, 100);

    slideTimerRef.current = setTimeout(() => {
      handleNextSlide();
    }, durationMs);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, isPlaying, items.length, currentItem, currentMedia, handleNextSlide]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && onExit) {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSlide, handlePrevSlide, onExit]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Erro ao entrar em fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const renderWeatherIcon = () => {
    if (weather.condition === 'sunny') return <Sun className="w-5 h-5 text-amber-400" />;
    if (weather.condition === 'rainy' || weather.condition === 'storm') {
      return <CloudRain className="w-5 h-5 text-sky-400" />;
    }
    return <CloudSun className="w-5 h-5 text-amber-300" />;
  };

  // Standby screen if no slide is in the playlist
  if (!currentItem) {
    return (
      <div className="w-screen h-screen bg-[#070b14] flex flex-col items-center justify-between text-white p-8 text-center select-none font-sans">
        {/* Top Standby Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white text-lg">
              BM<span className="text-sky-400">CAST</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              STANDBY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-white font-mono">{formattedTime}</div>
            <div className="text-xs text-slate-400">{weather.temp}°C {weather.city}</div>
          </div>
        </div>

        {/* Center Standby Box */}
        <div className="max-w-md p-8 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
            <Tv className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {screen?.name || 'TV Conectada'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta tela está online e pronta. Adicione slides na grade pelo painel de controle para iniciar a transmissão.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              Código de Pareamento: <strong className="text-sky-400 font-bold">{screen?.pairingCode || 'TV-1001'}</strong>
            </span>
          </div>
        </div>

        {/* Bottom Standby Footer */}
        <div className="w-full flex items-center justify-between text-xs text-slate-500">
          <span>Resolução Nativa 1080p FULL HD</span>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active QR Code Image URL
  const qrImageUrl =
    activeQrConfig.qrCodeType === 'custom_upload'
      ? activeQrConfig.qrCodeCustomImage
      : activeQrConfig.qrCodeUrl
      ? generatedQrMap[activeQrConfig.qrCodeUrl]
      : '';

  const isPortrait = screen?.orientation === 'portrait';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen bg-black overflow-hidden select-none font-sans ${
        isPortrait ? 'aspect-[9/16]' : 'aspect-video'
      }`}
    >
      {/* Top Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-white/10 z-40">
        <div
          className="h-full bg-sky-400 transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Slide Media Surface */}
      <div className="absolute inset-0 z-0">
        {currentMedia?.type === 'video' ? (
          <video
            src={currentMedia.url}
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentMedia?.url}
            alt={currentItem.customTitle || currentMedia?.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        )}

        {/* Gradient shadow for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/60 pointer-events-none" />
      </div>

      {/* Top Header Overlay: Station & Weather */}
      <header className="absolute top-4 inset-x-6 z-30 flex items-center justify-between pointer-events-none">
        {/* Brand Bar (Top Left) */}
        {activeBrandConfig.showBrand && (
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border shadow-lg backdrop-blur-md pointer-events-auto ${
              activeBrandConfig.brandPosition === 'top-right'
                ? 'order-2'
                : 'order-1'
            }`}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: `${activeBrandConfig.accentColor || '#0d9488'}60`,
            }}
          >
            {activeBrandConfig.brandLogo ? (
              <img
                src={activeBrandConfig.brandLogo}
                alt="Logo"
                className="w-7 h-7 object-contain rounded-lg"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase leading-none">
                {activeBrandConfig.brandName || 'Empório & Café Bella Vista'}
              </div>
              {activeBrandConfig.brandSlogan && (
                <div className="text-slate-300 text-[10px] tracking-tight mt-0.5 leading-none">
                  {activeBrandConfig.brandSlogan}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Clock & Live Weather Pill */}
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md shadow-lg pointer-events-auto ${
            activeBrandConfig.showBrand && activeBrandConfig.brandPosition === 'top-right'
              ? 'order-1'
              : 'order-2'
          }`}
        >
          <div className="flex items-center gap-2">
            {renderWeatherIcon()}
            <div className="leading-none">
              <span className="text-white font-extrabold text-sm sm:text-base">
                {weather.temp}°C
              </span>
              <span className="text-[10px] text-slate-300 block truncate max-w-[100px]">
                {weather.city}
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-white/20" />

          <div className="font-mono font-bold text-white text-xs sm:text-sm tracking-wide">
            {formattedTime}
          </div>
        </div>
      </header>

      {/* Floating QR Code (Positioned dynamically) */}
      {activeQrConfig.showQrCode && qrImageUrl && (
        <div
          className={`absolute z-30 pointer-events-none p-3 ${
            activeQrConfig.qrCodePosition === 'bottom-left'
              ? 'bottom-20 left-6'
              : activeQrConfig.qrCodePosition === 'top-left'
              ? 'top-20 left-6'
              : activeQrConfig.qrCodePosition === 'top-right'
              ? 'top-20 right-6'
              : 'bottom-20 right-6'
          }`}
        >
          <div className="bg-white p-2.5 rounded-2xl shadow-2xl flex flex-col items-center border border-slate-200">
            <div
              className={`${
                activeQrConfig.qrCodeSize === 'small'
                  ? 'w-20 h-20'
                  : activeQrConfig.qrCodeSize === 'large'
                  ? 'w-36 h-36'
                  : 'w-28 h-28'
              }`}
            >
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            {activeQrConfig.qrCodeLabel && (
              <span className="text-[10px] font-bold text-slate-900 text-center leading-tight mt-1 max-w-[130px]">
                {activeQrConfig.qrCodeLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Slide Overlay Content (Headline, Subheadline & Price Tag) */}
      <div className="absolute bottom-16 inset-x-6 z-20 pointer-events-none max-w-2xl space-y-2">
        {activeOverlayConfig.showOverlayBadge && activeOverlayConfig.badgeText && (
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase text-white shadow-lg"
            style={{
              backgroundColor: activeOverlayConfig.accentColor || '#0d9488',
            }}
          >
            {activeOverlayConfig.badgeText}
          </span>
        )}

        {activeOverlayConfig.headline && (
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
            {activeOverlayConfig.headline}
          </h1>
        )}

        {activeOverlayConfig.subheadline && (
          <p className="text-sm sm:text-lg text-slate-200 max-w-xl font-medium leading-relaxed drop-shadow-md">
            {activeOverlayConfig.subheadline}
          </p>
        )}

        {activeOverlayConfig.showPriceTag &&
          (activeOverlayConfig.priceOriginal || activeOverlayConfig.pricePromo) && (
            <div className="flex items-baseline gap-3 pt-1">
              {activeOverlayConfig.priceOriginal && (
                <span className="text-base sm:text-xl text-slate-400 line-through font-mono drop-shadow">
                  {activeOverlayConfig.priceOriginal}
                </span>
              )}
              {activeOverlayConfig.pricePromo && (
                <span
                  className="text-2xl sm:text-4xl font-black text-white px-3.5 py-1 rounded-xl shadow-xl font-mono"
                  style={{
                    backgroundColor: activeOverlayConfig.accentColor || '#0d9488',
                  }}
                >
                  {activeOverlayConfig.pricePromo}
                </span>
              )}
            </div>
          )}
      </div>

      {/* Bottom Rolling Ticker Bar */}
      {ticker.enabled && ticker.text && (
        <div className="absolute bottom-0 inset-x-0 h-12 bg-black/90 backdrop-blur-md border-t border-white/10 z-30 flex items-center overflow-hidden">
          <div className="px-4 h-full bg-sky-600 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 z-10 uppercase tracking-wider">
            <span>{ticker.accentTitle || 'AVISO AO VIVO'}</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div
              className={`whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-100 ${
                ticker.speed === 'slow'
                  ? 'animate-marquee-slow'
                  : ticker.speed === 'fast'
                  ? 'animate-marquee-fast'
                  : 'animate-marquee-normal'
              }`}
            >
              {ticker.text}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls Bar (Appears on mouse move) */}
      <div
        className={`absolute top-20 right-6 z-40 flex items-center gap-2 p-2 rounded-2xl bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={handlePrevSlide}
          className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
          title="Slide Anterior"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors cursor-pointer"
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <button
          onClick={handleNextSlide}
          className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
          title="Próximo Slide"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
          title="Tela Cheia (F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {onExit && (
          <button
            onClick={onExit}
            className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer ml-1"
            title="Sair do Player (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
