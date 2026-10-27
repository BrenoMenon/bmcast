import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Monitor,
  Plus,
  Play,
  Tv,
  Wifi,
  HelpCircle,
  CheckCircle2,
  X,
  Store,
  CloudSun,
  Radio,
  Trash2,
} from 'lucide-react';
import {
  Screen,
  MediaItem,
  Playlist,
  SystemConfig,
  TickerConfig,
  WeatherConfig,
  CompanyBrandProfile,
  SlideCategoryType,
  BusinessCategoryType,
} from '../../types/signage';
import { storageService, DB_UPDATED_EVENT } from '../../services/storageService';
import { authService } from '../../services/authService';
import { useTheme } from '../../services/themeService';
import { Logo } from '../common/Logo';
import { DashboardHeader } from './DashboardHeader';
import { PlaylistEditor } from './PlaylistEditor';
import { MediaLibrary } from './MediaLibrary';
import { ScreensManager } from './ScreensManager';
import { SlideCustomizerModal } from './SlideCustomizerModal';
import { WeatherModal } from './WeatherModal';
import { BrandSettingsModal } from './BrandSettingsModal';
import { TickerSettingsModal } from './TickerSettingsModal';
import { ConnectTVModal } from './ConnectTVModal';
import { TutorialModal } from './TutorialModal';
import { CompanyCategoryOnboardingModal } from './CompanyCategoryOnboardingModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface DashboardProps {
  onOpenPlayer: (slug: string) => void;
  onSignOut?: (() => void) | undefined;
}

type TabType = 'playlist' | 'library' | 'screens';

export const Dashboard: React.FC<DashboardProps> = ({ onOpenPlayer, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('playlist');

  const [screens, setScreens] = useState<Screen[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [ticker, setTicker] = useState<TickerConfig>({
    enabled: false,
    text: '',
    speed: 'normal',
    accentTitle: 'AVISO',
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
    conditionText: 'Parcialmente Nublado',
    humidity: 58,
    windKmH: 12,
    lastFetchedAt: new Date().toISOString(),
    source: 'open_meteo_live',
  });

  const [selectedScreenSlug, setSelectedScreenSlug] = useState<string>('');

  // Centralized Theme State
  const { theme: themeMode, toggleTheme } = useTheme();

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [slideModalInitialItem, setSlideModalInitialItem] = useState<MediaItem | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<SlideCategoryType | undefined>();

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [isConnectTVModalOpen, setIsConnectTVModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  // Guided first-run setup: company data -> weather -> ticker -> first slide
  const [setupStep, setSetupStep] = useState<null | 'brand' | 'weather' | 'ticker'>(null);
  const [pendingSlideCategory, setPendingSlideCategory] = useState<SlideCategoryType | undefined>();

  // Confirm delete modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  }, []);

  const loadData = useCallback(
    async (checkOnboarding = false) => {
      try {
        const [s, m, p, c, t, w] = await Promise.all([
          storageService.getScreens(),
          storageService.getMedia(),
          storageService.getPlaylists(),
          storageService.getConfig(),
          storageService.getTicker(),
          storageService.getWeather(),
        ]);

        setScreens(s);
        setMediaList(m);
        setPlaylists(p);
        setConfig(c);
        setTicker(t);
        setWeather(w);

        const firstScreen = s[0];
        if (firstScreen && (!selectedScreenSlug || !s.some((x) => x.slug === selectedScreenSlug))) {
          setSelectedScreenSlug(firstScreen.slug);
        } else if (!firstScreen && selectedScreenSlug) {
          setSelectedScreenSlug('');
        }

        if (checkOnboarding && m.length === 0 && !c?.brandProfile?.onboardingCompleted) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Erro ao ler dados:', err);
      }
    },
    [selectedScreenSlug]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadData(false);
      await storageService.syncFromSupabase(true);
      if (!mounted) return;
      const existingScreens = await storageService.getScreens();
      if (existingScreens.length === 0) {
        const { slug, pairingCode } = await storageService.generateUniqueShortSlug('tv');
        const allPlaylists = await storageService.getPlaylists();
        await storageService.saveScreen({
          id: `scr_${Date.now()}`,
          name: 'TV Principal',
          location: 'Salão / Recepção',
          slug,
          pairingCode,
          activePlaylistId: allPlaylists[0]?.id || 'pl_principal',
          status: 'online',
          resolution: '1080p',
          orientation: 'landscape',
          aspectRatio: '16:9',
          lastPing: new Date().toISOString(),
          pairedAt: new Date().toISOString(),
        });
      }
      if (mounted) {
        await loadData(true);
      }
    })();

    const currentUser = authService.getCurrentUser();
    const userName = currentUser?.name || 'Gestor';
    showToast(`Bem-vindo, ${userName}!`, 'info');

    const handleUpdate = () => {
      loadData(false);
    };

    window.addEventListener(DB_UPDATED_EVENT, handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener(DB_UPDATED_EVENT, handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePlaylist = playlists[0] || {
    id: 'pl_principal',
    name: 'Programação Principal',
    description: '',
    items: [],
    updatedAt: new Date().toISOString(),
  };

  const handleToggleTheme = async () => {
    const nextTheme = toggleTheme();
    if (config) {
      const updatedConfig: SystemConfig = { ...config, themeMode: nextTheme };
      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
    }
  };

  const ensureDefaultScreenExists = async (): Promise<string> => {
    const currentScreens = await storageService.getScreens();
    if (currentScreens.length > 0) {
      return selectedScreenSlug || currentScreens[0]!.slug;
    }

    const { slug, pairingCode } = await storageService.generateUniqueShortSlug('tv');
    const allPlaylists = await storageService.getPlaylists();
    const defaultScreen: Screen = {
      id: `scr_${Date.now()}`,
      name: 'TV Principal',
      location: 'Salão / Recepção',
      slug,
      pairingCode,
      activePlaylistId: allPlaylists[0]?.id || 'pl_principal',
      status: 'online',
      resolution: '1080p',
      orientation: 'landscape',
      aspectRatio: '16:9',
      lastPing: new Date().toISOString(),
      pairedAt: new Date().toISOString(),
    };
    await storageService.saveScreen(defaultScreen);
    setSelectedScreenSlug(defaultScreen.slug);
    return defaultScreen.slug;
  };

  const handleLaunchActivePlayer = async () => {
    const targetSlug = selectedScreenSlug || (await ensureDefaultScreenExists());
    onOpenPlayer(targetSlug);
  };

  const handleOpenConnectTV = async () => {
    await ensureDefaultScreenExists();
    await loadData();
    setIsConnectTVModalOpen(true);
  };

  const handleOpenNewSlideModal = (category?: SlideCategoryType) => {
    setSlideModalInitialItem(null);
    setPreselectedCategory(category);
    setIsSlideModalOpen(true);
  };

  const handleEditSlide = (item: MediaItem) => {
    setSlideModalInitialItem(item);
    setPreselectedCategory(item.category);
    setIsSlideModalOpen(true);
  };

  const handleSlideSaved = async (savedItem: MediaItem, addToPlaylist: boolean) => {
    await storageService.saveMedia(savedItem, addToPlaylist);
    await ensureDefaultScreenExists();
    showToast('Slide salvo na sua conta com sucesso!');
    loadData();
  };

  const handleOnboardingSelectCategory = async (
    category: BusinessCategoryType,
    companyName: string,
    initialSlideCategory: SlideCategoryType
  ) => {
    setIsOnboardingOpen(false);

    if (config) {
      const updatedProfile: CompanyBrandProfile = {
        ...config.brandProfile,
        name: companyName,
        businessCategory: category,
        onboardingCompleted: true,
      };

      const updatedConfig: SystemConfig = {
        ...config,
        organizationName: companyName,
        brandProfile: updatedProfile,
      };

      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
    }

    showToast('Passo 1 de 4: complete os dados da empresa.', 'success');
    setPendingSlideCategory(initialSlideCategory);
    setTimeout(() => {
      setSetupStep('brand');
      setIsBrandModalOpen(true);
    }, 250);
  };

  const handleSkipOnboarding = async () => {
    setIsOnboardingOpen(false);
    if (config) {
      const updatedConfig: SystemConfig = {
        ...config,
        brandProfile: {
          ...config.brandProfile,
          onboardingCompleted: true,
        },
      };
      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
    }
  };

  const advanceSetup = (from: 'brand' | 'weather' | 'ticker') => {
    const next = { brand: 'weather', weather: 'ticker', ticker: null } as const;
    const step = next[from];
    setSetupStep(step);
    setTimeout(() => {
      if (step === 'weather') {
        showToast('Passo 2 de 4: escolha a cidade do clima exibido na TV.', 'info');
        setIsWeatherModalOpen(true);
      } else if (step === 'ticker') {
        showToast('Passo 3 de 4: configure o letreiro opcional da TV.', 'info');
        setIsTickerModalOpen(true);
      } else {
        showToast('Passo 4 de 4: crie seu primeiro slide!', 'success');
        handleOpenNewSlideModal(pendingSlideCategory);
      }
    }, 250);
  };

  const handleDuplicateSlide = async (playlistId: string, itemId: string) => {
    await storageService.duplicatePlaylistItem(playlistId, itemId);
    showToast('Slide duplicado com sucesso!');
    loadData();
  };

  const handleDeleteMedia = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Excluir Slide?',
      description: 'Esta mídia será removida da sua biblioteca e das grades de TV.',
      onConfirm: async () => {
        await storageService.deleteMedia(id);
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        showToast('Slide removido com sucesso.', 'info');
        loadData();
      },
    });
  };

  const handleUpdatePlaylist = async (updated: Playlist) => {
    await storageService.savePlaylist(updated);
    loadData();
  };

  const handleSaveScreen = async (sc: Screen) => {
    await storageService.saveScreen(sc);
    setSelectedScreenSlug(sc.slug);
    showToast('Configurações da TV salvas!');
    loadData();
  };

  const handleDeleteScreen = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Desconectar TV?',
      description: 'A tela será removida da sua conta.',
      onConfirm: async () => {
        await storageService.deleteScreen(id);
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        showToast('Tela desconectada.', 'info');
        loadData();
      },
    });
  };

  const handleSaveWeather = async (updatedWeather: WeatherConfig) => {
    await storageService.saveWeather(updatedWeather);
    setWeather(updatedWeather);
    showToast('Previsão do tempo atualizada!');
  };

  const handleSaveBrandProfile = async (updatedProfile: CompanyBrandProfile) => {
    if (config) {
      const updatedConfig = {
        ...config,
        brandProfile: updatedProfile,
        organizationName: updatedProfile.name,
      };
      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
      showToast('Identidade da empresa salva!');
    }
  };

  const handleSaveTicker = async (updatedTicker: TickerConfig) => {
    await storageService.saveTicker(updatedTicker);
    setTicker(updatedTicker);
    showToast('Letreiro de rodapé atualizado!');
  };

  const handleClearAll = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Limpar todos os dados?',
      description:
        'Isso apagará todas as mídias, playlists e TVs cadastradas na sua conta para recomeçar do zero.',
      onConfirm: async () => {
        await storageService.clearAll();
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        showToast('Dados limpos com sucesso.', 'info');
        loadData();
      },
    });
  };

  const brandProfile = config?.brandProfile || {
    name: '',
    slogan: '',
    logoUrl: '',
    accentColor: '#2563EB',
    defaultQrCodeUrl: '',
  };

  const isSystemEmpty = mediaList.length === 0;

  const navItems: {
    id: TabType;
    label: string;
    shortLabel: string;
    icon: typeof Layers;
    count: number;
  }[] = [
    {
      id: 'playlist',
      label: 'Grade de Transmissão',
      shortLabel: 'Grade',
      icon: Layers,
      count: activePlaylist.items.length,
    },
    {
      id: 'library',
      label: 'Biblioteca de Mídias',
      shortLabel: 'Mídias',
      icon: ImageIcon,
      count: mediaList.length,
    },
    {
      id: 'screens',
      label: 'Telas & Monitores',
      shortLabel: 'Telas',
      icon: Monitor,
      count: screens.length,
    },
  ];

  const totalCycleSeconds = activePlaylist.items.reduce(
    (acc, cur) => acc + (cur.durationSeconds || 12),
    0
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans transition-colors duration-200 overflow-x-hidden">
      {/* ==================================================================== */}
      {/* BLCORE DESKTOP LEFT STICKY SIDEBAR                                   */}
      {/* ==================================================================== */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        {/* Brand Top Bar */}
        <div className="flex h-16 items-center px-5 border-b border-border/80">
          <Logo size="sm" />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <nav className="space-y-1" aria-label="Navegação principal">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Transmissão
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-primary/15 text-primary font-bold shadow-[inset_0_0_0_1px_var(--border)]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Station Quick Controls */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Estação &amp; Ajustes
            </div>

            <button
              type="button"
              onClick={() => setIsBrandModalOpen(true)}
              className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <Store className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">
                {brandProfile.name ? `Marca: ${brandProfile.name}` : 'Dados da Empresa'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsWeatherModalOpen(true)}
              className="group flex w-full items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <span className="flex items-center gap-3 truncate">
                <CloudSun className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Clima da TV</span>
              </span>
              <span className="text-[11px] font-bold text-foreground tabular-nums">
                {weather.temp}°C
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsTickerModalOpen(true)}
              className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <Radio className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Letreiro de Rodapé</span>
            </button>

            <button
              type="button"
              onClick={handleOpenConnectTV}
              className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <Wifi className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Conectar Smart TV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTutorialModalOpen(true)}
              className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Como Usar na TV</span>
            </button>
          </div>
        </div>

        {/* Sidebar Bottom Live TV Launcher */}
        <div className="p-3.5 border-t border-border/80">
          <button
            type="button"
            onClick={handleLaunchActivePlayer}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Abrir Player da TV</span>
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* BLCORE MAIN COLUMN (STICKY TOPBAR + CONTENT CANVAS)                  */}
      {/* ==================================================================== */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          screens={screens}
          selectedScreenSlug={selectedScreenSlug}
          onSelectScreenSlug={setSelectedScreenSlug}
          weather={weather}
          brandProfile={brandProfile}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
          onOpenBrandModal={() => setIsBrandModalOpen(true)}
          onOpenTickerModal={() => setIsTickerModalOpen(true)}
          onOpenNewSlideModal={() => handleOpenNewSlideModal()}
          onOpenConnectTVModal={handleOpenConnectTV}
          onOpenTutorialModal={() => setIsTutorialModalOpen(true)}
          onLaunchPlayer={onOpenPlayer}
          onSignOut={onSignOut}
        />

        {/* Toast Banner */}
        {toastMessage && (
          <div className="fixed inset-x-3 top-18 sm:inset-x-auto sm:right-4 sm:top-20 z-50 sm:max-w-md animate-in slide-in-from-top duration-200">
            <div className="bl-glass flex items-center gap-2.5 rounded-2xl sm:rounded-full px-4 py-2.5 text-xs text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold flex-1 truncate">{toastMessage.text}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                aria-label="Fechar aviso"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-4 pb-28 sm:px-6 sm:py-6 lg:px-8 md:pb-10 space-y-5 overflow-x-hidden">
          {/* Mobile Quick Strip (TV selector + Weather + Live Player) */}
          {!isSystemEmpty && (
            <div className="flex sm:hidden items-center justify-between gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-xs">
              {screens.length > 0 ? (
                <select
                  value={selectedScreenSlug}
                  onChange={(e) => setSelectedScreenSlug(e.target.value)}
                  aria-label="Selecionar TV Ativa"
                  className="min-w-0 flex-1 truncate rounded-full border border-border bg-muted/65 px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                >
                  {screens.map((sc) => (
                    <option key={sc.id} value={sc.slug} className="bg-card text-foreground">
                      {sc.name} (/{sc.slug})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground px-2">Painel Ativo</span>
              )}

              <button
                type="button"
                onClick={() => setIsWeatherModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-bold text-foreground shrink-0"
              >
                <CloudSun className="h-3.5 w-3.5 text-primary" />
                <span className="tabular-nums">{weather.temp}°C</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchActivePlayer}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shrink-0"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>TV</span>
              </button>
            </div>
          )}

          {/* Clean First-Time Welcome Card OR Compact KPI Strip */}
          {isSystemEmpty ? (
            <div className="bl-card rounded-3xl sm:rounded-[2rem] p-5 sm:p-10 text-center space-y-4">
              <div className="mx-auto flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <Tv className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <div className="mx-auto max-w-lg space-y-1.5">
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Sua conta está pronta para começar
                </h1>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Seu painel está 100% limpo. Cadastre seus slides, fotos, preços, marca e telas — tudo o que você criar ficará salvo exclusivamente na sua conta.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenNewSlideModal()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Primeiro Slide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-6 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <Store className="h-4 w-4 text-primary" />
                  <span>Configurar Minha Marca</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                <span className="block truncate text-[11px] font-semibold text-muted-foreground">
                  Slides na Grade
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {activePlaylist.items.length}
                  </span>
                  <span className="text-[11px] font-medium text-primary tabular-nums truncate">
                    {totalCycleSeconds}s ciclo
                  </span>
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                <span className="block truncate text-[11px] font-semibold text-muted-foreground">
                  Biblioteca
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {mediaList.length}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">mídias</span>
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                <span className="block truncate text-[11px] font-semibold text-muted-foreground">
                  Telas Conectadas
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {screens.length}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Online
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWeatherModalOpen(true)}
                className="rounded-2xl sm:rounded-3xl border border-border bg-card p-3.5 sm:p-4 text-left shadow-xs hover:border-primary/40 transition cursor-pointer"
              >
                <span className="block truncate text-[11px] font-semibold text-muted-foreground">
                  Clima na TV
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {weather.temp}°C
                  </span>
                  <span className="text-[11px] font-medium text-primary truncate">
                    {weather.city}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Quick Workspace Toolbar (Desktop Tabs + Clear All) */}
          {!isSystemEmpty && (
            <div className="flex items-center justify-between gap-2">
              <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 p-1">
                {navItems.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        active
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex md:hidden items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTickerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  <span>Letreiro</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer ml-auto"
                title="Limpar todos os slides e telas"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpar Tudo</span>
              </button>
            </div>
          )}

          {/* Active Section Content */}
          {activeTab === 'playlist' && (
            <PlaylistEditor
              playlist={activePlaylist}
              mediaList={mediaList}
              onUpdatePlaylist={handleUpdatePlaylist}
              onEditSlide={handleEditSlide}
              onDuplicateSlide={handleDuplicateSlide}
              onCreateNewSlide={() => handleOpenNewSlideModal()}
              onLaunchPlayer={handleLaunchActivePlayer}
            />
          )}

          {activeTab === 'library' && (
            <MediaLibrary
              mediaList={mediaList}
              onOpenNewSlideModal={handleOpenNewSlideModal}
              onEditSlide={handleEditSlide}
              onDeleteSlide={handleDeleteMedia}
              onAddToPlaylist={(item) => handleSlideSaved(item, true)}
            />
          )}

          {activeTab === 'screens' && (
            <ScreensManager
              screens={screens}
              playlists={playlists}
              onSaveScreen={handleSaveScreen}
              onDeleteScreen={handleDeleteScreen}
              onLaunchPlayer={onOpenPlayer}
            />
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* BLCORE MOBILE FIXED BOTTOM NAVIGATION BAR                            */}
      {/* ==================================================================== */}
      <nav
        aria-label="Navegação móvel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom,6px)] pt-1.5 px-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] md:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold transition cursor-pointer ${
                  active ? 'bg-primary/15 text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-full px-1">{item.shortLabel}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleOpenConnectTV}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold text-muted-foreground transition cursor-pointer"
          >
            <Wifi className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-full px-1">TV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBrandModalOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold text-muted-foreground transition cursor-pointer"
          >
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-full px-1">Empresa</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <CompanyCategoryOnboardingModal
        isOpen={isOnboardingOpen}
        onSelectCategory={handleOnboardingSelectCategory}
        onClose={handleSkipOnboarding}
        initialCompanyName={
          config?.organizationName === 'Minha Empresa' ? '' : config?.organizationName || ''
        }
      />

      <SlideCustomizerModal
        isOpen={isSlideModalOpen}
        onClose={() => {
          setIsSlideModalOpen(false);
          setSlideModalInitialItem(null);
        }}
        onSuccess={handleSlideSaved}
        initialItem={slideModalInitialItem}
        initialCategory={preselectedCategory}
        companyProfile={brandProfile}
      />

      <ConnectTVModal
        isOpen={isConnectTVModalOpen}
        onClose={() => setIsConnectTVModalOpen(false)}
        screens={screens}
        selectedScreenSlug={selectedScreenSlug}
        onSelectScreenSlug={setSelectedScreenSlug}
        onLaunchPlayer={onOpenPlayer}
      />

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        onOpenCreateSlide={() => handleOpenNewSlideModal()}
        onOpenConnectTV={handleOpenConnectTV}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => {
          setIsWeatherModalOpen(false);
          setSetupStep(null);
        }}
        currentWeather={weather}
        setupHint={
          setupStep === 'weather'
            ? 'Passo 2 de 4 · Escolha a cidade para exibir a temperatura oficial ao vivo na TV.'
            : undefined
        }
        onSave={(w) => {
          handleSaveWeather(w);
          setIsWeatherModalOpen(false);
          if (setupStep === 'weather') advanceSetup('weather');
        }}
      />

      <BrandSettingsModal
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false);
          setSetupStep(null);
        }}
        brandProfile={brandProfile}
        onSave={(p) => {
          handleSaveBrandProfile(p);
          setIsBrandModalOpen(false);
          if (setupStep === 'brand') advanceSetup('brand');
        }}
        setupHint={
          setupStep === 'brand'
            ? 'Passo 1 de 4 · Dados da empresa: nome, logo, cor e contatos. Depois seguimos para o clima.'
            : undefined
        }
        onAccountDeleted={async () => {
          await storageService.clearAll();
          await storageService.saveConfig({
            organizationName: '',
            brandProfile: {
              ...brandProfile,
              name: '',
              slogan: '',
              logoUrl: '',
              phoneWhatsApp: '',
              instagramHandle: '',
              defaultQrCodeUrl: '',
              defaultQrCodeImage: '',
              onboardingCompleted: false,
            },
          });
          setIsBrandModalOpen(false);
          onSignOut?.();
        }}
      />

      <TickerSettingsModal
        isOpen={isTickerModalOpen}
        onClose={() => {
          setIsTickerModalOpen(false);
          setSetupStep(null);
        }}
        ticker={ticker}
        setupHint={
          setupStep === 'ticker'
            ? 'Passo 3 de 4 · Defina a faixa de comunicados opcional no rodapé da TV.'
            : undefined
        }
        onSave={(t) => {
          handleSaveTicker(t);
          setIsTickerModalOpen(false);
          if (setupStep === 'ticker') advanceSetup('ticker');
        }}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        description={deleteConfirm.description}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        isDestructive
      />
    </div>
  );
};
