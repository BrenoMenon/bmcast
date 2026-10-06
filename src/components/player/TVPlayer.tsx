import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Clock, Sun, CloudRain, Wind, Droplets, 
  Maximize2, Minimize2, ArrowLeft, Play, Pause, 
  SkipForward, Layout, Volume2, VolumeX, Monitor, QrCode, Wifi,
  Tv, Sparkles
} from 'lucide-react';
import { storageService, DB_UPDATED_EVENT } from '../../services/storageService';
import { Screen, Playlist, MediaItem, TickerConfig, WeatherConfig, TVLayoutMode } from '../../types/signage';
import { Logo } from '../common/Logo';

interface TVPlayerProps {
  slug: string;
  onExit?: () => void;
}

export const TVPlayer: React.FC<TVPlayerProps> = ({ slug, onExit }) => {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [layoutMode, setLayoutMode] = useState<TVLayoutMode>('clean_media');

  const [ticker, setTicker] = useState<TickerConfig>({
    enabled: true,
    text: '',
    speed: 'normal',
    accentTitle: 'COMUNICADO',
  });
  const [weather, setWeather] = useState<WeatherConfig>({
    city: 'São Paulo',
    stateCode: 'SP',
    temp: 24,
    condition: 'partly_cloudy',
    conditionText: 'Parcialmente Nublado',
    humidity: 58,
    windKmH: 12,
    tempMin: 18,
    tempMax: 26,
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // User explicitly requested: "quando abrir nao tenha esse cabeçalho"
  // Header starts hidden by default on TV and only appears temporarily on mouse movement
  const [showControls, setShowControls] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load screen & broadcast data
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

      if (foundScreen) {
        setLayoutMode(foundScreen.layoutMode || 'clean_media');
        if (foundScreen.activePlaylistId) {
          const active = allPlaylists.find((p) => p.id === foundScreen.activePlaylistId);
          setPlaylist(active || null);
        } else {
          setPlaylist(allPlaylists[0] || null);
        }
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

  // Real-time clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // CRITICAL FIX: If user registered a TV and hasn't linked a playlist yet,
  // but has media uploaded in the library, automatically play the media items
  // so the TV is NEVER stuck on a black screen!
  const resolvedItems = useMemo(() => {
    if (playlist && playlist.items && playlist.items.length > 0) {
      const items = playlist.items
        .map((item) => {
          const media = mediaList.find((m) => m.id === item.mediaId);
          return {
            ...item,
            media,
          };
        })
        .filter((item): item is typeof item & { media: MediaItem } => Boolean(item.media));

      if (items.length > 0) return items;
    }

    // Direct fallback to all media available in library
    if (mediaList.length > 0) {
      return mediaList.map((m, idx) => ({
        id: `auto-${m.id}`,
        mediaId: m.id,
        durationSeconds: m.durationDefault || 10,
        order: idx,
        customTitle: m.title,
        media: m,
      }));
    }

    return [];
  }, [playlist, mediaList]);

  // Safe bounds check
  const safeIndex = currentIndex >= resolvedItems.length ? 0 : currentIndex;
  const currentItem = resolvedItems[safeIndex];
  const nextItem = resolvedItems.length > 1
    ? resolvedItems[(safeIndex + 1) % resolvedItems.length]
    : currentItem;

  const goToNextSlide = useCallback(() => {
    if (resolvedItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % resolvedItems.length);
    setProgress(0);
  }, [resolvedItems.length]);

  const goToPrevSlide = useCallback(() => {
    if (resolvedItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + resolvedItems.length) % resolvedItems.length);
    setProgress(0);
  }, [resolvedItems.length]);

  // Progression timer
  useEffect(() => {
    if (!isPlaying || !currentItem) return;

    const durationSec = currentItem.durationSeconds || currentItem.media.durationDefault || 10;
    const durationMs = durationSec * 1000;
    const stepMs = 100;
    let elapsed = 0;

    setProgress(0);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);

    progressTimerRef.current = setInterval(() => {
      elapsed += stepMs;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
    }, stepMs);

    slideTimerRef.current = setTimeout(() => {
      goToNextSlide();
    }, durationMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [safeIndex, isPlaying, currentItem, goToNextSlide]);

  // Mouse move temporarily reveals controls and auto-hides after 2s
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation for TV remotes and PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && onExit) {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, onExit]);

  // Layout switcher
  const cycleLayoutMode = () => {
    const modes: TVLayoutMode[] = ['clean_media', 'menu_brand', 'corporate_split', 'promo_qr'];
    const currentIdx = modes.indexOf(layoutMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setLayoutMode(nextMode);
  };

  // Clock formatters
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const brandTitle = screen?.brandName || 'BM Cast';
  const brandSlogan = screen?.brandSlogan || 'Sinalização Digital';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-black text-slate-100 flex flex-col select-none cursor-default font-sans"
    >
      {/* 
        FLOATING CONTROL BAR:
        Hidden by default so the TV starts 100% clean without headers!
        Only reveals briefly when moving mouse/tapping.
      */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 px-6 py-2.5 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-full pointer-events-none'
        } bg-[#0A0D14]/90 border-b border-[#1E2738]/80 flex items-center justify-between backdrop-blur-md shadow-2xl`}
      >
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] text-slate-200 text-xs font-semibold border border-[#232F46] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel</span>
            </button>
          )}

          <Logo size="sm" showSubtitle={false} />

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">
              {screen?.name || `Terminal (${slug})`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Mode Switcher */}
          <button
            onClick={cycleLayoutMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] border border-[#232F46] text-blue-300 text-xs font-semibold transition"
            title="Alternar Layout"
          >
            <Layout className="w-3.5 h-3.5" />
            <span>
              {layoutMode === 'clean_media' && 'Somente Imagens'}
              {layoutMode === 'menu_brand' && 'Cardápio / Marca'}
              {layoutMode === 'corporate_split' && 'Corporativo (75/25)'}
              {layoutMode === 'promo_qr' && 'Promo com QR Code'}
            </span>
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] border border-[#232F46] text-slate-300"
            title="Pausar / Retomar"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={goToNextSlide}
            className="p-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] border border-[#232F46] text-slate-300"
            title="Próximo Slide"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-lg bg-[#141B2B] hover:bg-[#1B253B] border border-[#232F46] text-slate-300"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main TV Screen Content (Takes 100% full viewport) */}
      <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">
        {resolvedItems.length === 0 ? (
          /* High-End TV Standby Broadcast Screen */
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#07080C] relative">
            <div className="max-w-lg w-full p-8 rounded-2xl bg-[#0D1017] border border-[#1C2230] shadow-2xl space-y-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Tv className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Smart TV Conectada</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {screen?.name || slug}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta televisão está pronta para transmissão. Acesse o painel e adicione suas fotos, vídeos ou crie um layout personalizado com a marca da sua empresa.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
                {onExit && (
                  <button
                    onClick={onExit}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Abrir Painel de Controle
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* LAYOUT 1: PURE CLEAN MEDIA (100% Imagem/Vídeo em tela cheia) */}
            {layoutMode === 'clean_media' && currentItem && (
              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                {currentItem.media.type === 'video' ? (
                  <video
                    ref={videoRef}
                    key={currentItem.media.id}
                    src={currentItem.media.url}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    key={currentItem.media.id}
                    src={currentItem.media.url}
                    alt={currentItem.customTitle || currentItem.media.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Thin countdown progress bar at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-black/30 z-30 pointer-events-none">
                  <div
                    className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* LAYOUT 2: MENU / CARDÁPIO COM LOGO DA EMPRESA */}
            {layoutMode === 'menu_brand' && currentItem && (
              <div className="relative w-full h-full flex flex-col bg-[#07080C] overflow-hidden">
                {/* Top Brand Banner */}
                <div className="px-8 py-3.5 bg-[#0C0F17] border-b border-[#1A2234] flex items-center justify-between z-20 shrink-0">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-white uppercase">{brandTitle}</h1>
                    <p className="text-xs text-blue-400 font-semibold">{brandSlogan}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-white tabular-nums">{hours}:{minutes}</span>
                    <span className="text-xs text-slate-400 block capitalize">{formattedDate.split(',')[0]}</span>
                  </div>
                </div>

                {/* Media area */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                  {currentItem.media.type === 'video' ? (
                    <video ref={videoRef} key={currentItem.media.id} src={currentItem.media.url} autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img key={currentItem.media.id} src={currentItem.media.url} alt="Menu" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 z-30">
                    <div className="h-full bg-blue-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 3: CORPORATIVO DIVIDIDO (75% / 25%) */}
            {layoutMode === 'corporate_split' && currentItem && (
              <div className="w-full h-full flex flex-row overflow-hidden">
                {/* 75% Stage */}
                <div className="w-[75%] h-full relative bg-black flex items-center justify-center overflow-hidden">
                  {currentItem.media.type === 'video' ? (
                    <video ref={videoRef} key={currentItem.media.id} src={currentItem.media.url} autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img key={currentItem.media.id} src={currentItem.media.url} alt="Slide" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 z-30">
                    <div className="h-full bg-blue-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* 25% Sidebar */}
                <div className="w-[25%] h-full bg-[#0A0D15] border-l border-[#1E293B] flex flex-col justify-between p-6">
                  <div className="space-y-5">
                    <div className="pb-3 border-b border-[#1E293B] flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white uppercase">{brandTitle}</h2>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>

                    {/* Clock */}
                    <div className="p-4 rounded-xl bg-[#0F1422] border border-[#1E293B] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Horário</span>
                      <div className="text-3xl font-bold text-white tabular-nums">
                        {hours}<span className="text-blue-400 animate-pulse">:</span>{minutes}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">{seconds}</span>
                      </div>
                      <div className="text-xs text-slate-400 capitalize">{formattedDate}</div>
                    </div>

                    {/* Weather */}
                    <div className="p-4 rounded-xl bg-[#0F1422] border border-[#1E293B] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Clima</span>
                        <span className="text-slate-300 font-semibold">{weather.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{weather.temp}°C</span>
                        <span className="text-xs text-slate-400">{weather.conditionText}</span>
                      </div>
                    </div>

                    {/* Next slide */}
                    {nextItem && (
                      <div className="p-4 rounded-xl bg-[#0F1422] border border-[#1E293B] space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          A Seguir
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded bg-black overflow-hidden shrink-0">
                            {nextItem.media.type === 'video' ? (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-slate-400">VÍDEO</div>
                            ) : (
                              <img src={nextItem.media.thumbnail || nextItem.media.url} alt="Next" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-xs text-white font-medium truncate">
                            {nextItem.customTitle || nextItem.media.title}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 pt-4 border-t border-[#1E293B] flex items-center justify-between">
                    <span>{screen?.location || 'Ao Vivo'}</span>
                    <span>BM Cast TV</span>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 4: PROMO COM QR CODE */}
            {layoutMode === 'promo_qr' && currentItem && (
              <div className="w-full h-full flex flex-row overflow-hidden bg-black">
                {/* 80% Main Promo Slide */}
                <div className="w-[80%] h-full relative flex items-center justify-center overflow-hidden">
                  {currentItem.media.type === 'video' ? (
                    <video ref={videoRef} key={currentItem.media.id} src={currentItem.media.url} autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img key={currentItem.media.id} src={currentItem.media.url} alt="Promo" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 z-30">
                    <div className="h-full bg-blue-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* 20% QR Code Sidebar */}
                <div className="w-[20%] h-full bg-[#0C101A] border-l border-[#1E293B] p-6 flex flex-col justify-between items-center text-center">
                  <div className="space-y-4 w-full">
                    <div className="px-2 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                      PEÇA PELO CELULAR
                    </div>

                    <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center aspect-square mx-auto max-w-[180px]">
                      <div className="flex flex-col items-center justify-center text-black">
                        <QrCode className="w-28 h-28 stroke-[1.8]" />
                        <span className="text-[9px] font-bold tracking-tight uppercase mt-1">Escanear QR Code</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                      Aponte a câmera do seu celular para fazer pedidos ou acessar o Wi-Fi da loja.
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3 w-full">
                    BM Cast Digital
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Optional ticker footer if enabled */}
      {ticker.enabled && ticker.text && (
        <div className="h-9 bg-[#090D18] border-t border-[#1A2234] flex items-center overflow-hidden shrink-0 z-20">
          <div className="px-3 py-1 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <span>{ticker.accentTitle || 'INFORMATIVO'}</span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="bm-ticker-track text-xs text-slate-200 font-medium">
              <span className="px-8">{ticker.text}</span>
              <span className="px-8">{ticker.text}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
