import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Clock,
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Store,
  QrCode,
  Radio,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Screen,
  Playlist,
  MediaItem,
  TickerConfig,
  WeatherConfig,
  PlaylistItem,
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

  // Load all data
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

  // Real-time clock tick
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Resolved list of active items to play
  const activeItems = useMemo(() => {
    if (playlist && playlist.items && playlist.items.length > 0) {
      return playlist.items.map((item) => {
        const media = mediaList.find((m) => m.id === item.mediaId);
        return {
          id: item.id,
          title: item.customTitle || media?.title || 'Slide BM Cast',
          url: media?.url || '',
          type: media?.type || 'image',
          durationSeconds: item.durationSeconds || media?.durationDefault || 12,
          brandConfig: item.brandConfig || media?.brandConfig,
          qrConfig: item.qrConfig || media?.qrConfig,
          categoryOverlay: item.categoryOverlay || media?.categoryOverlay,
        };
      }).filter((item) => Boolean(item.url));
    }

    // Fallback: If playlist empty but media exists, play media directly!
    return mediaList.map((m) => ({
      id: m.id,
      title: m.title,
      url: m.url,
      type: m.type,
      durationSeconds: m.durationDefault || 12,
      brandConfig: m.brandConfig,
      qrConfig: m.qrConfig,
      categoryOverlay: m.categoryOverlay,
    }));
  }, [playlist, mediaList]);

  // Safe current item
  const currentItem = activeItems[currentIndex] || activeItems[0];

  // Pre-generate QR Code for current item if dynamic
  useEffect(() => {
    if (!currentItem?.qrConfig?.showQrCode) return;
    const { qrCodeType, qrCodeUrl } = currentItem.qrConfig;
    if (qrCodeType === 'generated' && qrCodeUrl && !generatedQrMap[qrCodeUrl]) {
      qrService.generateDataUrl(qrCodeUrl, '#000000', '#ffffff').then((url) => {
        if (url) {
          setGeneratedQrMap((prev) => ({ ...prev, [qrCodeUrl]: url }));
        }
      });
    }
  }, [currentItem, generatedQrMap]);

  // Slide Rotation Logic
  const handleNextSlide = useCallback(() => {
    if (activeItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    setProgressPercent(0);
  }, [activeItems.length]);

  const handlePrevSlide = useCallback(() => {
    if (activeItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    setProgressPercent(0);
  }, [activeItems.length]);

  useEffect(() => {
    if (!isPlaying || activeItems.length === 0) return;

    const duration = (currentItem?.durationSeconds || 12) * 1000;
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    setProgressPercent(0);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    slideTimerRef.current = setTimeout(() => {
      handleNextSlide();
    }, duration);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, isPlaying, activeItems.length, currentItem?.durationSeconds, handleNextSlide]);

  // Auto-hide controls after inactivity
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

  // Date formatting in Portuguese
  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Weather Icon
  const renderWeatherIcon = () => {
    if (weather.condition === 'sunny') return <Sun className="w-6 h-6 text-amber-400 animate-spin-slow" />;
    if (weather.condition === 'rainy' || weather.condition === 'storm') {
      return <CloudRain className="w-6 h-6 text-blue-400" />;
    }
    return <CloudSun className="w-6 h-6 text-amber-300" />;
  };

  if (!currentItem) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-between text-white p-8 text-center select-none font-['Plus_Jakarta_Sans']">
        {/* Top Standby Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white font-['Space_Grotesk'] text-lg">
              BM<span className="text-blue-500">CAST</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              STANDBY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-white font-mono">{formattedTime}</div>
            <div className="text-xs text-slate-400">{weather.temp}°C {weather.city}</div>
          </div>
        </div>

        {/* Center Standby Box */}
        <div className="max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
            {screen?.name || 'TV Conectada'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta tela está online e sincronizada com a nuvem. Adicione slides na programação pelo painel de controle para iniciar a transmissão.
          </p>

          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              Código de Pareamento: <strong className="text-blue-400">{screen?.pairingCode || 'TV-1001'}</strong>
            </span>
          </div>

          {onExit && (
            <div className="pt-2">
              <button
                onClick={onExit}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Voltar ao Painel Administrativo
              </button>
            </div>
          )}
        </div>

        {/* Bottom footer */}
        <div className="text-xs text-slate-500 font-mono">
          BM Cast Pro • Transmissão Digital Indoor
        </div>
      </div>
    );
  }

  // QR Code Image Resolution
  const slideQr = currentItem.qrConfig;
  const showQr = slideQr?.showQrCode;
  const qrImage =
    slideQr?.qrCodeType === 'custom_upload' && slideQr?.qrCodeCustomImage
      ? slideQr.qrCodeCustomImage
      : slideQr?.qrCodeUrl
      ? generatedQrMap[slideQr.qrCodeUrl] || ''
      : '';

  // Brand Overlay Configuration
  const slideBrand = currentItem.brandConfig;
  const showBrand = slideBrand?.showBrand;
  const brandName = slideBrand?.brandName || screen?.brandName || 'BM CAST';
  const brandSlogan = slideBrand?.brandSlogan || screen?.brandSlogan || '';
  const brandLogo = slideBrand?.brandLogo || screen?.brandLogo || '';
  const brandAccent = slideBrand?.accentColor || '#2563EB';
  const brandPosition = slideBrand?.brandPosition || 'top-left';

  // Category Overlay Details
  const overlay = currentItem.categoryOverlay;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* 1. SLIDE BACKGROUND MEDIA (IMAGE / VIDEO) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {currentItem.type === 'video' ? (
          <video
            key={currentItem.url}
            src={currentItem.url}
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            key={currentItem.url}
            src={currentItem.url}
            alt={currentItem.title}
            className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
          />
        )}

        {/* Ambient Gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/75 pointer-events-none" />
      </div>

      {/* 2. PROGRESS BAR AT TOP */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 z-40 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-linear shadow-lg shadow-blue-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3. TOP BAR: COMPANY BRAND (IF ACTIVE) + CLOCK + ACCURATE WEATHER */}
      <div className="absolute top-0 inset-x-0 p-5 sm:p-7 flex items-start justify-between z-30 pointer-events-none">
        {/* BRAND SECTION (Se o usuário escolheu mostrar a marca neste slide) */}
        {showBrand ? (
          <div
            className={`flex items-center gap-3 transition-all ${
              brandPosition === 'top-right' ? 'order-2' : 'order-1'
            }`}
          >
            <div
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-black/85 border shadow-md"
              style={{
                borderColor: `${brandAccent}60`,
              }}
            >
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt="Logo"
                  className="w-8 h-8 object-contain rounded"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: brandAccent }}
                >
                  <Store className="w-4 h-4" />
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk'] tracking-wide uppercase leading-tight drop-shadow">
                  {brandName}
                </h1>
                {brandSlogan && (
                  <p className="text-[11px] text-slate-300 font-medium tracking-normal mt-0.5 max-w-sm truncate drop-shadow">
                    {brandSlogan}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="order-1" />
        )}

        {/* WEATHER & CLOCK WIDGET (Top Corner) */}
        <div className="order-3 flex items-center gap-2">
          {/* REAL WEATHER API WIDGET */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/85 border border-slate-800 shadow-md text-white">
            <div className="text-blue-400">
              {renderWeatherIcon()}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-base sm:text-lg font-bold font-mono tracking-tight tabular-nums">
                  {weather.temp}°C
                </span>
                <span className="text-xs text-slate-300 truncate max-w-[100px]">
                  {weather.city}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>{weather.conditionText}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{weather.humidity}% umid</span>
              </div>
            </div>
          </div>

          {/* REAL DIGITAL CLOCK */}
          <div className="px-3 py-2 rounded-lg bg-black/85 border border-slate-800 shadow-md text-right">
            <div className="text-base sm:text-lg font-bold text-white font-mono tracking-tight leading-none tabular-nums">
              {formattedTime}
            </div>
            <div className="text-[10px] text-slate-400 capitalize mt-0.5 tracking-wide">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SLIDE CONTENT & PRICING BANNER (Bottom-Left) */}
      <div className="absolute bottom-16 inset-x-0 p-6 sm:p-10 z-30 pointer-events-none flex flex-col justify-end">
        <div className="max-w-3xl space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Category Badge Tag */}
          {overlay?.showOverlayBadge !== false && overlay?.badgeText && (
            <div className="inline-flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-xl backdrop-blur-md"
                style={{
                  backgroundColor: overlay?.accentColor || brandAccent || '#2563EB',
                }}
              >
                {overlay.badgeText}
              </span>
            </div>
          )}

          {/* Main Headline */}
          {overlay?.headline && (
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
              {overlay.headline}
            </h2>
          )}

          {/* Subheadline / Description */}
          {overlay?.subheadline && (
            <p className="text-sm sm:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed drop-shadow-lg">
              {overlay.subheadline}
            </p>
          )}

          {/* Price Tags */}
          {overlay?.showPriceTag !== false && (overlay?.priceOriginal || overlay?.pricePromo) && (
            <div className="flex items-baseline gap-3 pt-2">
              {overlay.priceOriginal && (
                <div className="text-base sm:text-xl text-slate-400 line-through font-semibold drop-shadow">
                  {overlay.priceOriginal}
                </div>
              )}
              {overlay.pricePromo && (
                <div
                  className="text-2xl sm:text-4xl font-black text-white px-4 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20"
                  style={{
                    backgroundColor: overlay?.accentColor || brandAccent || '#2563EB',
                  }}
                >
                  {overlay.pricePromo}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. QR CODE OVERLAY (DYNÂMICO OU UPLOAD REAL - POSICIONÁVEL) */}
      {showQr && qrImage && (
        <div
          className={`absolute z-35 pointer-events-none ${
            slideQr.qrCodePosition === 'top-left'
              ? 'top-24 left-8'
              : slideQr.qrCodePosition === 'top-right'
              ? 'top-24 right-8'
              : slideQr.qrCodePosition === 'bottom-left'
              ? 'bottom-24 left-8'
              : slideQr.qrCodePosition === 'center-right'
              ? 'top-1/2 -translate-y-1/2 right-8'
              : 'bottom-24 right-8' // Default: bottom-right
          }`}
        >
          <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-2xl border-2 border-white flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div
              className={`rounded-2xl overflow-hidden ${
                slideQr.qrCodeSize === 'small'
                  ? 'w-24 h-24'
                  : slideQr.qrCodeSize === 'large'
                  ? 'w-44 h-44'
                  : 'w-32 h-32 sm:w-36 sm:h-36'
              }`}
            >
              <img
                src={qrImage}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            {slideQr.qrCodeLabel && (
              <div className="mt-2 text-center max-w-[160px]">
                <p className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {slideQr.qrCodeLabel}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. BOTTOM RUNNING TICKER MARQUEE BAR */}
      {ticker.enabled && ticker.text && (
        <div className="absolute bottom-0 inset-x-0 h-12 sm:h-14 bg-[#0A0C14]/95 backdrop-blur border-t border-[#1E2436] z-30 flex items-center overflow-hidden">
          {/* Professional Broadcast Badge */}
          <div className="h-full px-4 sm:px-6 bg-blue-600 text-white font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shrink-0 z-10 shadow-md">
            <Radio className="w-4 h-4 text-white" />
            <span>{ticker.accentTitle || 'COMUNICADO'}</span>
          </div>

          {/* Marquee Content */}
          <div className="flex-1 overflow-hidden whitespace-nowrap relative">
            <div
              className={`inline-block text-sm sm:text-base font-semibold text-white tracking-wide ${
                ticker.speed === 'slow'
                  ? 'animate-[marquee_45s_linear_infinite]'
                  : ticker.speed === 'fast'
                  ? 'animate-[marquee_20s_linear_infinite]'
                  : 'animate-[marquee_30s_linear_infinite]'
              }`}
            >
              {ticker.text} &nbsp; • &nbsp; {ticker.text}
            </div>
          </div>
        </div>
      )}

      {/* 7. FLOATING CONTROLS (Appears on Mouse Movement, Auto-Hides) */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121520]/95 backdrop-blur border border-[#22293C] shadow-2xl text-white text-xs">
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181D2B] hover:bg-[#20273A] transition-colors cursor-pointer text-slate-300 hover:text-white"
              title="Voltar ao Painel (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
              Painel
            </button>
          )}

          <div className="h-4 w-px bg-[#262F48] mx-1" />

          <button
            onClick={handlePrevSlide}
            className="p-2 rounded-lg hover:bg-[#1E253B] transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Slide Anterior (Seta Esquerda)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            title="Pausar / Reproduzir (Espaço)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={handleNextSlide}
            className="p-2 rounded-lg hover:bg-[#1E253B] transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Próximo Slide (Seta Direita)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#262F48] mx-1" />

          <span className="font-mono text-slate-300 px-1 font-semibold">
            {currentIndex + 1} / {activeItems.length}
          </span>

          <div className="h-4 w-px bg-[#262F48] mx-1" />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-[#1E253B] transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Tela Cheia (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
