import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Monitor,
  Plus,
  Play,
  RotateCcw,
  Tv,
  FolderOpen,
  Wifi,
  Sparkles,
  HelpCircle,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
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
    enabled: true,
    text: 'BM CAST • Sistema Corporativo de TV e Mídia Indoor • Personalize seu letreiro pelo painel.',
    speed: 'normal',
    accentTitle: 'AVISO AO VIVO',
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

  const [selectedScreenSlug, setSelectedScreenSlug] = useState<string>('tv-principal');

  // Theme State
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bmcast_theme_mode');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'light';
  });

  // Welcome Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [slideModalInitialItem, setSlideModalInitialItem] = useState<MediaItem | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<SlideCategoryType | undefined>();
  const [preselectedStockImageId, setPreselectedStockImageId] = useState<string | undefined>();

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

  // Apply theme to document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (themeMode === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
      localStorage.setItem('bmcast_theme_mode', themeMode);
    }
  }, [themeMode]);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const loadData = useCallback(async () => {
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
      if (firstScreen && !selectedScreenSlug) {
        setSelectedScreenSlug(firstScreen.slug);
      }

      // Check if onboarding is needed (empty media and onboarding not completed)
      if (m.length === 0 && !c?.brandProfile?.onboardingCompleted) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Erro ao ler dados:', err);
    }
  }, [selectedScreenSlug]);

  useEffect(() => {
    loadData();

    // Show initial warm welcome message on mount
    const currentUser = authService.getCurrentUser();
    const userName = currentUser?.name || 'Gestor';
    showToast(`Bem-vindo, ${userName}! Seu sistema de TV Corporativa BM CAST está ativo.`, 'info');

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener(DB_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DB_UPDATED_EVENT, handleUpdate);
  }, [loadData, showToast]);

  const activePlaylist = playlists[0] || {
    id: 'playlist-padrao',
    name: 'Programação Principal',
    description: '',
    items: [],
    updatedAt: new Date().toISOString(),
  };

  const handleToggleTheme = async () => {
    const nextTheme: 'dark' | 'light' = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    if (config) {
      const updatedConfig: SystemConfig = { ...config, themeMode: nextTheme };
      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
    }
    showToast(nextTheme === 'light' ? 'Modo Claro ativado' : 'Modo Escuro ativado', 'info');
  };

  const handleOpenNewSlideModal = (category?: SlideCategoryType, stockImageId?: string) => {
    setSlideModalInitialItem(null);
    setPreselectedCategory(category);
    setPreselectedStockImageId(stockImageId);
    setIsSlideModalOpen(true);
  };

  const handleEditSlide = (item: MediaItem) => {
    setSlideModalInitialItem(item);
    setPreselectedCategory(item.category);
    setPreselectedStockImageId(undefined);
    setIsSlideModalOpen(true);
  };

  const handleSlideSaved = async (savedItem: MediaItem, addToPlaylist: boolean) => {
    await storageService.saveMedia(savedItem, addToPlaylist);

    // If no screen exists yet, create the initial default screen automatically
    const currentScreens = await storageService.getScreens();
    if (currentScreens.length === 0) {
      const defaultScreen: Screen = {
        id: `scr_${Date.now()}`,
        name: 'TV Principal 1',
        location: 'Salão / Recepção',
        slug: 'tv-principal',
        pairingCode: `TV-${Math.floor(1000 + Math.random() * 9000)}`,
        activePlaylistId: (await storageService.getPlaylists())[0]?.id || 'playlist-padrao',
        status: 'online',
        resolution: '1080p',
        orientation: 'landscape',
        aspectRatio: '16:9',
        lastPing: new Date().toISOString(),
        pairedAt: new Date().toISOString(),
      };
      await storageService.saveScreen(defaultScreen);
      setSelectedScreenSlug(defaultScreen.slug);
    }

    showToast('Slide publicado com sucesso na programação da TV!');
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
    }, 300);
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
        showToast('Passo 3 de 4: escreva o aviso que corre no rodapé da TV.', 'info');
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
      description: 'Esta mídia será removida da biblioteca e das grades de TV.',
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
    showToast('Configurações da TV salvas!');
    loadData();
  };

  const handleDeleteScreen = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Desconectar TV?',
      description: 'A tela será removida do painel.',
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
      const updatedConfig = { ...config, brandProfile: updatedProfile, organizationName: updatedProfile.name };
      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
      showToast('Identidade da empresa salva!');
    }
  };

  const handleSaveTicker = async (updatedTicker: TickerConfig) => {
    await storageService.saveTicker(updatedTicker);
    setTicker(updatedTicker);
    showToast('Letreiro rodapé atualizado!');
  };

  const handleLoadDemoPack = async () => {
    await storageService.loadDemoPack();
    setSelectedScreenSlug('tv-principal');
    showToast('Modelos de exemplo carregados!');
    loadData();
  };

  const handleClearAll = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Limpar todos os dados?',
      description: 'Isso apagará todas as mídias, playlists e TVs cadastradas para você começar 100% do zero.',
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

  const isSystemEmpty = mediaList.length === 0 && screens.length === 0;

  return (
    <div className="app-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
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
        onOpenConnectTVModal={() => setIsConnectTVModalOpen(true)}
        onOpenTutorialModal={() => setIsTutorialModalOpen(true)}
        onOpenSupabaseModal={() => setIsBrandModalOpen(true)}
        onLaunchPlayer={onOpenPlayer}
        onSignOut={onSignOut}
      />

      {/* Real-time Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-slate-800/95 border border-sky-400 dark:border-sky-500/50 rounded-2xl shadow-xl backdrop-blur-md text-xs text-slate-900 dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-semibold flex-1">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Empty State Banner (Clean Slate, No Pre-Registration) */}
        {isSystemEmpty ? (
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Tv className="w-7 h-7" />
            </div>

            <div className="max-w-lg mx-auto space-y-1.5">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Tudo pronto para cadastrar a programação da sua empresa!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Painel 100% em branco e limpo. Comece criando seu primeiro slide personalizado
                ou conecte diretamente seus telões e Smart TVs pelo link.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleOpenNewSlideModal()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Slide</span>
              </button>

              <button
                onClick={() => setIsConnectTVModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-xs sm:text-sm rounded-full border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
              >
                <Wifi className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Conectar com a TV / Telão</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Navigation Tabs (Rounded-Full) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-4">
          <div role="tablist" className="grid grid-cols-3 sm:flex w-full sm:w-auto items-stretch gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl sm:rounded-full border border-slate-300 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab('playlist')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs leading-tight text-center font-bold transition-all cursor-pointer sm:whitespace-nowrap min-w-0 ${
                activeTab === 'playlist'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span><span className="sm:hidden">Grade</span><span className="hidden sm:inline">Grade de Transmissão</span></span>
              <span className="text-[10px] font-bold opacity-85">({activePlaylist.items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs leading-tight text-center font-bold transition-all cursor-pointer sm:whitespace-nowrap min-w-0 ${
                activeTab === 'library'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span><span className="sm:hidden">Mídias</span><span className="hidden sm:inline">Biblioteca de Mídias</span></span>
              <span className="text-[10px] font-bold opacity-85">({mediaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('screens')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs leading-tight text-center font-bold transition-all cursor-pointer sm:whitespace-nowrap min-w-0 ${
                activeTab === 'screens'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span><span className="sm:hidden">Telas</span><span className="hidden sm:inline">Monitores &amp; Telas</span></span>
              <span className="text-[10px] font-bold opacity-85">({screens.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsConnectTVModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-400 rounded-full border border-slate-300 dark:border-sky-500/30 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Link da TV</span>
            </button>

            {!isSystemEmpty && (
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0 px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                title="Limpar todos os dados e começar do zero"
              >
                Limpar Tudo
              </button>
            )}
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'playlist' && (
          <PlaylistEditor
            playlist={activePlaylist}
            mediaList={mediaList}
            onUpdatePlaylist={handleUpdatePlaylist}
            onEditSlide={handleEditSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onCreateNewSlide={() => handleOpenNewSlideModal()}
            onLaunchPlayer={() => onOpenPlayer(selectedScreenSlug || 'tv-principal')}
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


      {/* Modals */}
      <CompanyCategoryOnboardingModal
        isOpen={isOnboardingOpen}
        onSelectCategory={handleOnboardingSelectCategory}
        initialCompanyName={config?.organizationName === 'Minha Empresa' ? '' : config?.organizationName || ''}
      />

      <SlideCustomizerModal
        isOpen={isSlideModalOpen}
        onClose={() => {
          setIsSlideModalOpen(false);
          setSlideModalInitialItem(null);
          setPreselectedStockImageId(undefined);
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
        onOpenConnectTV={() => setIsConnectTVModalOpen(true)}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => {
          setIsWeatherModalOpen(false);
          if (setupStep === 'weather') advanceSetup('weather');
        }}
        currentWeather={weather}
        onSave={handleSaveWeather}
      />

      <BrandSettingsModal
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false);
          if (setupStep === 'brand') advanceSetup('brand');
        }}
        brandProfile={brandProfile}
        onSave={handleSaveBrandProfile}
        setupHint={setupStep === 'brand' ? 'Passo 1 de 4 · Dados da empresa: nome, logo, cor e contatos. Depois seguimos para o clima.' : undefined}
        onAccountDeleted={async () => {
          await storageService.clearAll();
          await storageService.saveConfig({ organizationName: '', brandProfile: { ...brandProfile, name: '', slogan: '', logoUrl: '', phoneWhatsApp: '', instagramHandle: '', defaultQrCodeUrl: '', defaultQrCodeImage: '', onboardingCompleted: false } });
          setIsBrandModalOpen(false);
          onSignOut?.();
        }}
      />

      <TickerSettingsModal
        isOpen={isTickerModalOpen}
        onClose={() => {
          setIsTickerModalOpen(false);
          if (setupStep === 'ticker') advanceSetup('ticker');
        }}
        ticker={ticker}
        onSave={handleSaveTicker}
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
