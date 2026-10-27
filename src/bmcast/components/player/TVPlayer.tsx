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
  Radio,
} from 'lucide-react';
import {
  Screen,
  Playlist,
  MediaItem,
  TickerConfig,
  WeatherConfig,
} from '../../types/signage';
import { storageService, DB_UPDATED_EVENT } from '../../services/storageService';
import { qrService } from '../../services/qrService';

interface TVPlayerProps {
  slug: string;
  onExit?: (() => void) | undefined;
}

export const TVPlayer: React.FC<TVPlayerProps> = ({ slug, onExit }) => {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [companyNameFallback, setCompanyNameFallback] = useState<string>('');
  const [ticker, setTicker] = useState<TickerConfig>({
    enabled: false,
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
  const [mediaLoadError, setMediaLoadError] = useState<boolean>(false);

  const [showControls, setShowControls] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [generatedQrMap, setGeneratedQrMap] = useState<Record<string, string>>({});

  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load screen bundle by short slug (/tv1, /loja) or 4-digit numeric code (/4821)
  const loadData = useCallback(async () => {
    try {
      const bundle = await storageService.getPublicPlayerBundle(slug);
      setScreen(bundle.screen);
      setPlaylist(bundle.playlist);
      setMediaList(bundle.mediaList);
      setTicker(bundle.ticker);
      setWeather(bundle.weather);
      setCompanyNameFallback(bundle.config?.brandProfile?.name || '');
    } catch (e) {
      console.error('Falha ao carregar dados do player:', e);
    }
  }, [slug]);

  useEffect(() => {
    loadData();

    const syncInterval = setInterval(() => {
      loadData();
    }, 15000);

    const handleDBChange = () => {
      loadData();
    };
    window.addEventListener(DB_UPDATED_EVENT, handleDBChange);
    return () => {
      clearInterval(syncInterval);
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

  const activeItems = useMemo(() => {
    if (playlist && playlist.items && playlist.items.length > 0) {
      return playlist.items.map((item) => {
        const media = mediaList.find((m) => m.id === item.mediaId);
        return {
          id: item.id,
          title: item.customTitle || media?.title || 'Slide',
          url: media?.url || '',
          type: media?.type || 'image',
          durationSeconds: item.durationSeconds || media?.durationDefault || 12,
          brandConfig: item.brandConfig || media?.brandConfig,
          qrConfig: item.qrConfig || media?.qrConfig,
          categoryOverlay: item.categoryOverlay || media?.categoryOverlay,
        };
      });
    }

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

  // Keep currentIndex valid if playlist shrinks
  useEffect(() => {
    if (activeItems.length > 0 && currentIndex >= activeItems.length) {
      setCurrentIndex(0);
    }
  }, [activeItems.length, currentIndex]);

  const currentItem = activeItems[currentIndex] || activeItems[0];

  useEffect(() => {
    setMediaLoadError(false);
  }, [currentItem?.url, currentIndex]);

  // Preload next slide image for seamless zero-flicker transitions
  useEffect(() => {
    if (activeItems.length <= 1) return;
    const nextItem = activeItems[(currentIndex + 1) % activeItems.length];
    if (nextItem?.url && nextItem.type !== 'video') {
      const preload = new Image();
      preload.src = nextItem.url;
    }
  }, [activeItems, currentIndex]);

  // Generate high-res QR Code (800px) for current slide
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
      setProgressPercent((prev) => (prev >= 100 ? 100 : prev + step));
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

  const handleRevealControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

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
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const renderWeatherIcon = () => {
    if (weather.condition === 'sunny') return <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />;
    if (weather.condition === 'rainy' || weather.condition === 'storm') {
      return <CloudRain className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400" />;
    }
    return <CloudSun className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" />;
  };

  // Standby screen when account has zero slides registered yet
  if (!currentItem) {
    const hostDisplay = typeof window !== 'undefined' ? window.location.host : 'seusite.com';
    const displaySlug = screen?.slug || slug || 'tv1';
    const displayCode = (screen?.pairingCode || '').replace(/\D/g, '').slice(0, 4);

    return (
      <div className="flex min-h-[100dvh] w-screen flex-col items-center justify-between bg-zinc-950 p-5 sm:p-8 text-center text-white select-none">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              BM <span className="text-blue-500">CAST</span>
            </span>
            <span className="text-xs text-zinc-400">· Aguardando slides</span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="font-bold tabular-nums text-white">{formattedTime}</span>
            <span className="text-zinc-400">
              {weather.temp}°C {weather.city}
            </span>
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            {screen?.name || 'Tela Conectada'}
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-zinc-400">
            Sua tela está conectada e pronta. Envie seus slides pelo painel para iniciar a exibição automaticamente.
          </p>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-1 text-xs">
            <div className="font-mono font-bold text-blue-400 truncate">
              {hostDisplay}/{displaySlug}
            </div>
            {displayCode && (
              <div className="text-zinc-400">
                Código rápido: <strong className="font-mono text-white">{displayCode}</strong>
              </div>
            )}
          </div>

          {onExit && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onExit}
                className="w-full sm:w-auto rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer"
              >
                Voltar ao Painel
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500">
          BM CAST · Transmissão Otimizada para TVs e Totens
        </div>
      </div>
    );
  }

  const slideQr = currentItem.qrConfig;
  const showQr = slideQr?.showQrCode;
  const qrImage =
    slideQr?.qrCodeType === 'custom_upload' && slideQr?.qrCodeCustomImage
      ? slideQr.qrCodeCustomImage
      : slideQr?.qrCodeUrl
        ? generatedQrMap[slideQr.qrCodeUrl] || ''
        : '';

  const slideBrand = currentItem.brandConfig;
  const showBrand = Boolean(
    slideBrand?.showBrand &&
      (slideBrand?.brandName || screen?.brandName || companyNameFallback || slideBrand?.brandLogo)
  );
  const brandName =
    slideBrand?.brandName || screen?.brandName || companyNameFallback || '';
  const brandSlogan = slideBrand?.brandSlogan || screen?.brandSlogan || '';
  const brandLogo = slideBrand?.brandLogo || screen?.brandLogo || '';
  const brandAccent = slideBrand?.accentColor || '#2563EB';
  const brandPosition = slideBrand?.brandPosition || 'top-left';

  const overlay = currentItem.categoryOverlay;
  const imageFit = overlay?.imageFit || 'cover';
  const userDarkness = typeof overlay?.overlayOpacity === 'number' ? overlay.overlayOpacity : 0;

  const hasBottomTextOverlay = Boolean(
    (overlay?.showOverlayBadge !== false && overlay?.badgeText?.trim()) ||
      overlay?.headline?.trim() ||
      overlay?.subheadline?.trim() ||
      (overlay?.showPriceTag !== false &&
        (overlay?.priceOriginal?.trim() || overlay?.pricePromo?.trim()))
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleRevealControls}
      onTouchStart={handleRevealControls}
      onClick={handleRevealControls}
      className="relative h-[100dvh] w-screen overflow-hidden bg-black select-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* 1. HIGH-CLARITY SLIDE MEDIA (Zero forced darkening when pure image!) */}
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-black">
        {currentItem.url && !mediaLoadError ? (
          currentItem.type === 'video' ? (
            <video
              key={currentItem.url}
              src={currentItem.url}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setMediaLoadError(true)}
              className={`h-full w-full ${
                imageFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
            />
          ) : (
            <>
              {imageFit === 'contain' && (
                <img
                  src={currentItem.url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
                />
              )}
              <img
                key={currentItem.url}
                src={currentItem.url}
                alt={currentItem.title}
                decoding="async"
                fetchPriority="high"
                onError={() => setMediaLoadError(true)}
                className={`relative z-10 h-full w-full transition-opacity duration-500 ease-out ${
                  imageFit === 'contain' ? 'object-contain' : 'object-cover'
                }`}
              />
            </>
          )
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${
                overlay?.accentColor || brandAccent || '#2563EB'
              }45 0%, #090d16 100%)`,
            }}
          />
        )}

        {/* Explicit user-configured darkening */}
        {userDarkness > 0 && (
          <div
            className="pointer-events-none absolute inset-0 z-15"
            style={{ backgroundColor: `rgba(0, 0, 0, ${userDarkness / 100})` }}
          />
        )}

        {/* Smart legibility gradient ONLY when bottom text/prices are present */}
        {hasBottomTextOverlay && userDarkness < 40 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-15 h-1/2 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
        )}
      </div>

      {/* 2. SLIM PROGRESS BAR AT TOP */}
      <div className="absolute left-0 right-0 top-0 z-40 h-1 bg-white/15 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3. TOP BAR: OPTIONAL BRAND + LIVE WEATHER & CLOCK */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 sm:p-6">
        {showBrand ? (
          <div
            className={`flex items-center gap-2.5 min-w-0 ${
              brandPosition === 'top-right' ? 'order-2' : 'order-1'
            }`}
          >
            <div
              className="flex items-center gap-2.5 rounded-2xl border bg-black/75 px-3 py-2 shadow-lg backdrop-blur-md"
              style={{ borderColor: `${brandAccent}60` }}
            >
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt="Logo"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded object-contain shrink-0"
                />
              ) : (
                <div
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: brandAccent }}
                >
                  <Store className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xs sm:text-base font-extrabold uppercase leading-tight tracking-wide text-white">
                  {brandName}
                </h1>
                {brandSlogan && (
                  <p className="hidden sm:block max-w-xs truncate text-[11px] font-medium text-zinc-300">
                    {brandSlogan}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="order-1" />
        )}

        <div className="order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/75 px-2.5 py-1.5 sm:px-3 sm:py-2 text-white shadow-lg backdrop-blur-md">
            <div>{renderWeatherIcon()}</div>
            <div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-sm sm:text-lg font-bold tracking-tight tabular-nums">
                  {weather.temp}°C
                </span>
                <span className="hidden sm:inline max-w-[110px] truncate text-xs text-zinc-300">
                  {weather.city}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                <span>{weather.conditionText}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{weather.humidity}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/75 px-2.5 py-1.5 sm:px-3 sm:py-2 text-right shadow-lg backdrop-blur-md">
            <div className="text-sm sm:text-lg font-bold leading-none tracking-tight text-white tabular-nums">
              {formattedTime}
            </div>
            <div className="hidden sm:block mt-0.5 text-[10px] capitalize tracking-wide text-zinc-400">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SLIDE TEXT & PRICING OVERLAY (Only rendered when present) */}
      {hasBottomTextOverlay && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-30 flex flex-col justify-end p-4 sm:p-10 ${
            ticker.enabled && ticker.text ? 'bottom-12 sm:bottom-14' : 'bottom-2 sm:bottom-4'
          }`}
        >
          <div className="max-w-3xl space-y-2 sm:space-y-3">
            {overlay?.showOverlayBadge !== false && overlay?.badgeText && (
              <div className="inline-flex items-center">
                <span
                  className="rounded-lg px-2.5 py-1 text-[10px] sm:text-sm font-black uppercase tracking-wider text-white shadow-xl"
                  style={{
                    backgroundColor: overlay?.accentColor || brandAccent || '#2563EB',
                  }}
                >
                  {overlay.badgeText}
                </span>
              </div>
            )}

            {overlay?.headline && (
              <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-2xl">
                {overlay.headline}
              </h2>
            )}

            {overlay?.subheadline && (
              <p className="max-w-2xl text-xs sm:text-lg font-medium leading-relaxed text-zinc-100 drop-shadow-lg">
                {overlay.subheadline}
              </p>
            )}

            {overlay?.showPriceTag !== false && (overlay?.priceOriginal || overlay?.pricePromo) && (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                {overlay.priceOriginal && (
                  <div className="text-sm sm:text-xl font-semibold text-zinc-300 line-through drop-shadow">
                    {overlay.priceOriginal}
                  </div>
                )}
                {overlay.pricePromo && (
                  <div
                    className="rounded-xl sm:rounded-2xl border border-white/20 px-3.5 py-1 sm:px-4 sm:py-1.5 text-xl sm:text-4xl font-black text-white shadow-2xl"
                    style={{
                      backgroundColor: overlay?.accentColor || brandAccent || '#2563EB',
                    }}
                  >
                    {overlay.pricePromo}
                  </div>
                )}
                {overlay.discountPercent && (
                  <span className="rounded-lg sm:rounded-xl bg-amber-400 px-2.5 py-1 text-xs sm:text-base font-extrabold text-slate-950 shadow-lg">
                    {overlay.discountPercent}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. HIGH-RES QR CODE OVERLAY */}
      {showQr && qrImage && (
        <div
          className={`pointer-events-none absolute z-35 ${
            slideQr.qrCodePosition === 'top-left'
              ? 'left-4 top-20 sm:left-8 sm:top-24'
              : slideQr.qrCodePosition === 'top-right'
                ? 'right-4 top-20 sm:right-8 sm:top-24'
                : slideQr.qrCodePosition === 'bottom-left'
                  ? 'bottom-16 left-4 sm:bottom-24 sm:left-8'
                  : slideQr.qrCodePosition === 'center-right'
                    ? 'right-4 top-1/2 -translate-y-1/2 sm:right-8'
                    : 'bottom-16 right-4 sm:bottom-24 sm:right-8'
          }`}
        >
          <div className="flex flex-col items-center rounded-2xl sm:rounded-3xl border-2 border-white bg-white p-2.5 sm:p-4 shadow-2xl">
            <div
              className={`overflow-hidden rounded-xl ${
                slideQr.qrCodeSize === 'small'
                  ? 'h-20 w-20 sm:h-24 sm:w-24'
                  : slideQr.qrCodeSize === 'large'
                    ? 'h-32 w-32 sm:h-44 sm:w-44'
                    : 'h-24 w-24 sm:h-36 sm:w-36'
              }`}
            >
              <img
                src={qrImage}
                alt="QR Code"
                className="h-full w-full object-contain"
              />
            </div>
            {slideQr.qrCodeLabel && (
              <div className="mt-1.5 max-w-[150px] text-center">
                <p className="text-[10px] sm:text-xs font-black leading-tight text-slate-900">
                  {slideQr.qrCodeLabel}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. BOTTOM RUNNING TICKER MARQUEE BAR */}
      {ticker.enabled && ticker.text && (
        <div className="absolute bottom-0 inset-x-0 z-30 flex h-10 sm:h-14 items-center overflow-hidden border-t border-white/10 bg-zinc-950/95 backdrop-blur">
          <div className="z-10 flex h-full shrink-0 items-center gap-1.5 sm:gap-2 bg-blue-600 px-3 sm:px-6 text-[11px] sm:text-sm font-bold uppercase tracking-wider text-white shadow-md">
            <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            <span>{ticker.accentTitle || 'COMUNICADO'}</span>
          </div>

          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <div
              className={`inline-block text-xs sm:text-base font-semibold tracking-wide text-white ${
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

      {/* 7. FLOATING CONTROLS (Mouse or Touch) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed left-1/2 top-4 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] transition-all duration-300 pointer-events-auto ${
          showControls
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/15 bg-zinc-950/95 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur">
          {onExit && (
            <>
              <button
                type="button"
                onClick={onExit}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-1.5 font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Painel</span>
              </button>
              <div className="h-4 w-px bg-zinc-800" />
            </>
          )}

          <button
            type="button"
            onClick={handlePrevSlide}
            className="rounded-full p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            title="Slide Anterior"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-500 transition cursor-pointer"
            title="Pausar / Reproduzir"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            className="rounded-full p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            title="Próximo Slide"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <span className="px-1 font-semibold tabular-nums text-zinc-300">
            {currentIndex + 1}/{activeItems.length}
          </span>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-full p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
