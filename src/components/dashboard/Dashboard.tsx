import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Monitor,
  Plus,
  Tv,
  HelpCircle,
  Store,
  Sparkles,
  Radio,
  CloudSun,
  X,
  Check,
  ExternalLink,
  QrCode,
  Pipette,
  CheckCircle2,
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
} from '../../types/signage';
import { storageService, DB_UPDATED_EVENT } from '../../services/storageService';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { DashboardHeader } from './DashboardHeader';
import { PlaylistEditor } from './PlaylistEditor';
import { MediaLibrary } from './MediaLibrary';
import { ScreensManager } from './ScreensManager';
import { SlideCustomizerModal } from './SlideCustomizerModal';
import { WeatherModal } from './WeatherModal';
import { BrandSettingsModal } from './BrandSettingsModal';
import { TickerSettingsModal } from './TickerSettingsModal';
import { TutorialModal } from './TutorialModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface DashboardProps {
  onOpenPlayer: (slug: string) => void;
  onSignOut?: () => void;
}

type TabType = 'screens' | 'playlist' | 'library' | 'ticker' | 'brand' | 'weather';

// Ícone oficial do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.42C8.86 7.42 8.56 7.49 8.31 7.76C8.06 8.03 7.37 8.68 7.37 10C7.37 11.33 8.34 12.6 8.48 12.78C8.61 12.97 10.39 15.71 13.11 16.89C13.76 17.17 14.26 17.34 14.66 17.46C15.31 17.67 15.9 17.64 16.37 17.57C16.89 17.49 17.98 16.91 18.21 16.27C18.44 15.63 18.44 15.08 18.37 14.96C18.3 14.85 18.12 14.78 17.84 14.64C17.57 14.5 16.21 13.83 15.96 13.74C15.71 13.65 15.53 13.6 15.35 13.88C15.16 14.15 14.65 14.75 14.5 14.93C14.34 15.11 14.19 15.14 13.91 15C13.64 14.86 12.75 14.57 11.71 13.64C10.89 12.92 10.35 12.02 10.21 11.74C10.07 11.47 10.2 11.31 10.33 11.18C10.46 11.05 10.61 10.85 10.76 10.69C10.9 10.52 10.95 10.4 11.04 10.22C11.13 10.03 11.09 9.87 11.02 9.74C10.95 9.6 10.4 8.27 10.18 7.72C9.95 7.18 9.73 7.26 9.56 7.25C9.4 7.25 9.22 7.25 9.04 7.42Z" />
  </svg>
);

// Máscara automática WhatsApp: (xx) xxxxx-xxxx
const formatWhatsAppPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ onOpenPlayer, onSignOut }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<TabType>('screens');
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  const [ticker, setTicker] = useState<TickerConfig>({
    enabled: true,
    text: 'BM CAST • Sistema Profissional de Sinalização Digital & TV Indoor.',
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

  const [selectedScreenSlug, setSelectedScreenSlug] = useState<string>('');

  // Toast / Mensagem de boas-vindas do login / registro
  const [welcomeToast, setWelcomeToast] = useState<{
    visible: boolean;
    message: string;
    type: 'login' | 'signup';
  } | null>(() => {
    try {
      const flash = sessionStorage.getItem('bmcast_auth_flash');
      if (flash) {
        sessionStorage.removeItem('bmcast_auth_flash');
        return JSON.parse(flash);
      }
    } catch {}
    return {
      visible: true,
      message: `Bem-vindo ao BM CAST! Sistema carregado e sincronizado com sucesso.`,
      type: 'login',
    };
  });

  // Salvar feedback local para os tópicos
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Auto-dismiss welcome toast
  useEffect(() => {
    if (welcomeToast?.visible) {
      const t = setTimeout(() => {
        setWelcomeToast(null);
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [welcomeToast]);

  // Modals state
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [slideModalInitialItem, setSlideModalInitialItem] = useState<MediaItem | null>(null);
  const [, setPreselectedCategory] = useState<SlideCategoryType | undefined>();
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

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

      if (s.length > 0 && !selectedScreenSlug) {
        setSelectedScreenSlug(s[0].slug);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do BM CAST:', err);
    }
  }, [selectedScreenSlug]);

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener(DB_UPDATED_EVENT, handleDbChange);
    return () => window.removeEventListener(DB_UPDATED_EVENT, handleDbChange);
  }, [loadData]);

  // Seletor da playlist ativa
  const currentScreen = screens.find((s) => s.slug === selectedScreenSlug) || screens[0];
  const activePlaylist =
    playlists.find((p) => p.id === currentScreen?.activePlaylistId) ||
    playlists[0] || {
      id: 'default',
      name: 'Grade Principal',
      items: [],
      updatedAt: new Date().toISOString(),
    };

  const handleOpenNewSlideModal = (cat?: SlideCategoryType) => {
    setSlideModalInitialItem(null);
    setPreselectedCategory(cat);
    setIsSlideModalOpen(true);
  };

  const handleEditSlide = (item: MediaItem) => {
    setSlideModalInitialItem(item);
    setIsSlideModalOpen(true);
  };

  const handleDuplicateSlide = async (item: MediaItem) => {
    try {
      const copy: MediaItem = {
        ...item,
        id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: `${item.title} (Cópia)`,
        createdAt: new Date().toISOString(),
      };
      await storageService.saveMedia(copy, true);
      await loadData();
    } catch (err) {
      console.error('Erro ao duplicar slide:', err);
    }
  };

  const handleDuplicateSlideInPlaylist = async (playlistId: string, itemId: string) => {
    const targetPlaylist = playlists.find((p) => p.id === playlistId) || activePlaylist;
    const itemIndex = targetPlaylist.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;
    const itemToCopy = targetPlaylist.items[itemIndex];
    const newItems = [...targetPlaylist.items];
    newItems.splice(itemIndex + 1, 0, {
      ...itemToCopy,
      id: `pl_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    });
    await handleUpdatePlaylist({
      ...targetPlaylist,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveScreen = async (screen: Screen) => {
    await storageService.saveScreen(screen);
    await loadData();
    setSelectedScreenSlug(screen.slug);
  };

  const handleDeleteScreen = async (id: string) => {
    const sc = screens.find((s) => s.id === id);
    setDeleteConfirm({
      isOpen: true,
      title: `Excluir Monitor "${sc?.name || 'TV'}"?`,
      description: 'Esta TV será desconectada do sistema. Você pode cadastrar uma nova a qualquer momento.',
      onConfirm: async () => {
        await storageService.deleteScreen(id);
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      },
    });
  };

  const handleSlideSaved = async (savedItem: MediaItem, addToActive = true) => {
    await storageService.saveMedia(savedItem, addToActive);
    setIsSlideModalOpen(false);
    await loadData();
  };

  const handleDeleteMedia = async (id: string) => {
    const item = mediaList.find((m) => m.id === id);
    setDeleteConfirm({
      isOpen: true,
      title: `Excluir Slide "${item?.title || 'Slide'}"?`,
      description: 'Este slide será removido permanentemente da sua biblioteca e da grade da TV.',
      onConfirm: async () => {
        await storageService.deleteMedia(id);
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      },
    });
  };

  const handleUpdatePlaylist = async (updated: Playlist) => {
    await storageService.savePlaylist(updated);
    await loadData();
  };

  const handleSaveBrandProfile = async (updatedBrand: CompanyBrandProfile) => {
    await storageService.saveConfig({
      brandProfile: updatedBrand,
      themeAccent: updatedBrand.accentColor,
    });
    await loadData();
    setSaveSuccessMsg('Marca e identidade visual salvas com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveTickerData = async (updatedTicker: TickerConfig) => {
    await storageService.saveTicker(updatedTicker);
    await loadData();
    setSaveSuccessMsg('Letreiro digital atualizado com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveWeatherData = async (updatedWeather: WeatherConfig) => {
    await storageService.saveWeather(updatedWeather);
    await loadData();
    setSaveSuccessMsg('Dados meteorológicos atualizados com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleClearAll = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Resetar todos os dados locais?',
      description: 'Esta ação irá limpar suas telas, playlists e slides armazenados. Prossiga com cautela.',
      onConfirm: async () => {
        await storageService.clearAll();
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      },
    });
  };

  const brandProfile = config?.brandProfile || {
    name: 'BM CAST',
    slogan: 'Sistema de TV Corporativa',
    logoUrl: '',
    accentColor: '#0284c7',
    secondaryColor: '#0ea5e9',
    phoneWhatsApp: '',
    instagramHandle: '',
    websiteUrl: '',
    defaultQrCodeUrl: '',
  };

  const isSystemEmpty = screens.length === 0 && mediaList.length === 0;

  return (
    <div
      className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200 ${
        isDark ? 'bg-[#090e17] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Header */}
      <DashboardHeader
        screens={screens}
        selectedScreenSlug={selectedScreenSlug || (screens[0]?.slug ?? '')}
        onSelectScreenSlug={setSelectedScreenSlug}
        weather={weather}
        brandProfile={brandProfile}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
        onOpenTickerModal={() => setIsTickerModalOpen(true)}
        onOpenNewSlideModal={() => handleOpenNewSlideModal()}
        onOpenTutorialModal={() => setIsTutorialModalOpen(true)}
        onLaunchPlayer={onOpenPlayer}
        onSignOut={onSignOut}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Toast / Mensagem ao Entrar ou Criar Conta */}
        {welcomeToast?.visible && (
          <div
            className={`flex items-center justify-between gap-3 p-3.5 px-4 rounded-2xl border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              isDark
                ? 'bg-[#0f172a] border-sky-500/30 text-white'
                : 'bg-white border-sky-300 text-slate-900 shadow-sky-100/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {welcomeToast.message}
                </p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {welcomeToast.type === 'signup'
                    ? 'Sua conta foi criada. Comece conectando suas TVs e criando seus primeiros slides.'
                    : 'Sessão autenticada. Gerencie suas telas, playlists e letreiros em tempo real.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setWelcomeToast(null)}
              className={`p-1.5 rounded-lg text-xs cursor-pointer hover:bg-sky-500/10 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Feedback de salvamento nos tópicos */}
        {saveSuccessMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Personalized Welcome Header (sem menção de Supabase) */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark
              ? 'bg-[#0f172a] border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-sm sm:text-base tracking-tight">
                  Olá, {currentUser?.name || 'Administrador'}!
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sincronização Ativa em Tempo Real</span>
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Painel BM CAST pronto. Cadastre suas TVs, slides e transmita nas telas do seu negócio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTutorialModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ver Tutorial</span>
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Marca</span>
            </button>
          </div>
        </div>

        {/* Blank Slate Message (quando vazio) */}
        {isSystemEmpty ? (
          <div
            className={`border rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs transition-colors ${
              isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center mx-auto">
              <Tv className="w-6 h-6" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Painel Pronto · Configure seus monitores e conteúdos
              </h2>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Nenhuma TV ou slide cadastrado ainda. Comece conectando seu primeiro monitor ou montando a identidade visual da sua marca.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setActiveTab('brand')}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>1. Definir Marca & Cores</span>
              </button>

              <button
                onClick={() => setActiveTab('screens')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 border font-semibold text-xs rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-sky-500" />
                <span>2. Conectar Nova TV</span>
              </button>

              <button
                onClick={() => handleOpenNewSlideModal()}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 border font-semibold text-xs rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-sky-500" />
                <span>3. Criar Primeiro Slide</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Navigation Tabs (Com todos os tópicos solicitados) */}
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto max-w-full ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {/* Tópico: Monitores */}
            <button
              onClick={() => setActiveTab('screens')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'screens'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Monitores & Telas</span>
              <span className="text-[10px] font-semibold opacity-90">({screens.length})</span>
            </button>

            {/* Tópico: Grade da TV */}
            <button
              onClick={() => setActiveTab('playlist')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'playlist'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Grade da TV</span>
              <span className="text-[10px] font-semibold opacity-90">({activePlaylist.items.length})</span>
            </button>

            {/* Tópico: Biblioteca de Mídias */}
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Mídias & Slides</span>
              <span className="text-[10px] font-semibold opacity-90">({mediaList.length})</span>
            </button>

            {/* Tópico: Letreiro & Avisos */}
            <button
              onClick={() => setActiveTab('ticker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ticker'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Letreiro da TV</span>
            </button>

            {/* Tópico: Identidade & Marca */}
            <button
              onClick={() => setActiveTab('brand')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'brand'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Identidade & Marca</span>
            </button>

            {/* Tópico: Clima & Previsão */}
            <button
              onClick={() => setActiveTab('weather')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'weather'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
              <span>Clima & Tempo</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isSystemEmpty && (
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0 px-2 py-1"
                title="Resetar dados locais"
              >
                Limpar Tudo
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MONITORES & TELAS */}
        {/* ============================================================== */}
        {activeTab === 'screens' && (
          <ScreensManager
            screens={screens}
            playlists={playlists}
            onSaveScreen={handleSaveScreen}
            onDeleteScreen={handleDeleteScreen}
            onLaunchPlayer={onOpenPlayer}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 2: GRADE DA TV */}
        {/* ============================================================== */}
        {activeTab === 'playlist' && (
          <PlaylistEditor
            playlist={activePlaylist}
            mediaList={mediaList}
            onUpdatePlaylist={handleUpdatePlaylist}
            onEditSlide={handleEditSlide}
            onDuplicateSlide={handleDuplicateSlideInPlaylist}
            onCreateNewSlide={() => handleOpenNewSlideModal()}
            onLaunchPlayer={() => onOpenPlayer(selectedScreenSlug || 'tv-principal')}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 3: BIBLIOTECA DE MÍDIAS */}
        {/* ============================================================== */}
        {activeTab === 'library' && (
          <MediaLibrary
            mediaList={mediaList}
            onOpenNewSlideModal={handleOpenNewSlideModal}
            onEditSlide={handleEditSlide}
            onDeleteSlide={handleDeleteMedia}
            onAddToPlaylist={(item) => handleSlideSaved(item, true)}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 4: LETREIRO & AVISOS AO VIVO */}
        {/* ============================================================== */}
        {activeTab === 'ticker' && (
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-5 transition-colors ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/50">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Radio className="w-4 h-4 text-sky-500" />
                  <span>Letreiro Digital da TV (Ticker em Tempo Real)</span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Barra rolante informativa exibida na base dos monitores e Smart TVs em tempo real.
                </p>
              </div>

              <button
                onClick={() => setIsTickerModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                Configurações Avançadas
              </button>
            </div>

            {/* Live Ticker Preview Bar */}
            <div>
              <span className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Simulação da Barra ao Vivo na TV:
              </span>
              <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 h-11 flex items-center shadow-inner">
                <div className="bg-sky-600 px-3 h-full flex items-center text-[11px] font-black text-white shrink-0 tracking-wider">
                  {ticker.accentTitle || 'AVISO AO VIVO'}
                </div>
                <div className="overflow-hidden flex-1 px-3 whitespace-nowrap text-white text-xs font-medium">
                  <span className="inline-block animate-marquee-normal">
                    {ticker.text || 'BM CAST • Sistema Profissional de Sinalização Digital'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Editor Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2 space-y-2">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mensagem do Letreiro
                </label>
                <textarea
                  rows={3}
                  value={ticker.text}
                  onChange={(e) => setTicker({ ...ticker, text: e.target.value })}
                  placeholder="Digite a mensagem exibida na TV..."
                  className={`w-full p-3 border rounded-xl text-xs font-medium transition-colors focus:outline-none focus:border-sky-500 ${
                    isDark
                      ? 'bg-[#131b2e] border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Título em Destaque
                  </label>
                  <input
                    type="text"
                    value={ticker.accentTitle}
                    onChange={(e) => setTicker({ ...ticker, accentTitle: e.target.value })}
                    placeholder="Ex: AVISO AO VIVO"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:border-sky-500 ${
                      isDark
                        ? 'bg-[#131b2e] border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Velocidade de Rolagem
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['slow', 'normal', 'fast'] as const).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setTicker({ ...ticker, speed: spd })}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          ticker.speed === spd
                            ? 'bg-sky-600 text-white border-sky-600'
                            : isDark
                            ? 'bg-[#131b2e] border-slate-700 text-slate-300 hover:text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {spd === 'slow' ? 'Lento' : spd === 'normal' ? 'Normal' : 'Rápido'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleSaveTickerData(ticker)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Letreiro</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: IDENTIDADE & MARCA */}
        {/* ============================================================== */}
        {activeTab === 'brand' && (
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-5 transition-colors ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/50">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Store className="w-4 h-4 text-sky-500" />
                  <span>Identidade da Marca & Personalização</span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Defina o logotipo, cores personalizadas e contatos que serão impressos nos templates da TV.
                </p>
              </div>

              <button
                onClick={() => setIsBrandModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                Abrir Central de Marca Completa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome e Slogan */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nome da Empresa / Estabelecimento
                </label>
                <input
                  type="text"
                  value={brandProfile.name}
                  onChange={(e) =>
                    handleSaveBrandProfile({ ...brandProfile, name: e.target.value })
                  }
                  placeholder="Ex: BM Digital"
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:border-sky-500 ${
                    isDark
                      ? 'bg-[#131b2e] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Slogan ou Frase de Efeito
                </label>
                <input
                  type="text"
                  value={brandProfile.slogan}
                  onChange={(e) =>
                    handleSaveBrandProfile({ ...brandProfile, slogan: e.target.value })
                  }
                  placeholder="Ex: Sinalização & Tecnologia"
                  className={`w-full px-3 py-2 border rounded-xl text-xs transition-colors focus:outline-none focus:border-sky-500 ${
                    isDark
                      ? 'bg-[#131b2e] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* WhatsApp com ícone e máscara automática */}
              <div>
                <label className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className="text-[#25D366]">
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </span>
                  <span>WhatsApp Oficial (com máscara automática)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366]">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={brandProfile.phoneWhatsApp}
                    onChange={(e) =>
                      handleSaveBrandProfile({
                        ...brandProfile,
                        phoneWhatsApp: formatWhatsAppPhone(e.target.value),
                      })
                    }
                    placeholder="(11) 99999-9999"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:border-sky-500 ${
                      isDark
                        ? 'bg-[#131b2e] border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  URL da Logo da Empresa
                </label>
                <input
                  type="url"
                  value={brandProfile.logoUrl}
                  onChange={(e) =>
                    handleSaveBrandProfile({ ...brandProfile, logoUrl: e.target.value })
                  }
                  placeholder="https://exemplo.com/logo.png"
                  className={`w-full px-3 py-2 border rounded-xl text-xs transition-colors focus:outline-none focus:border-sky-500 ${
                    isDark
                      ? 'bg-[#131b2e] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Cores Livres com Seletor HTML5 completo */}
            <div
              className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <label className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Pipette className="w-3.5 h-3.5 text-sky-500" />
                  <span>Cor Primária da Marca</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandProfile.accentColor}
                    onChange={(e) =>
                      handleSaveBrandProfile({ ...brandProfile, accentColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    title="Selecione qualquer cor no espectro completo"
                  />
                  <input
                    type="text"
                    value={brandProfile.accentColor}
                    onChange={(e) =>
                      handleSaveBrandProfile({ ...brandProfile, accentColor: e.target.value })
                    }
                    className={`w-28 px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold ${
                      isDark ? 'bg-[#090e17] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Pipette className="w-3.5 h-3.5 text-sky-500" />
                  <span>Cor Secundária da Marca</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandProfile.secondaryColor}
                    onChange={(e) =>
                      handleSaveBrandProfile({ ...brandProfile, secondaryColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    title="Selecione qualquer cor no espectro completo"
                  />
                  <input
                    type="text"
                    value={brandProfile.secondaryColor}
                    onChange={(e) =>
                      handleSaveBrandProfile({ ...brandProfile, secondaryColor: e.target.value })
                    }
                    className={`w-28 px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold ${
                      isDark ? 'bg-[#090e17] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: CLIMA & TEMPO */}
        {/* ============================================================== */}
        {activeTab === 'weather' && (
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-5 transition-colors ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/50">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <CloudSun className="w-4 h-4 text-sky-500" />
                  <span>Boletim Meteorológico da TV (Ao Vivo)</span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Exibe a temperatura, cidade e condições climáticas nos slides da sua programação.
                </p>
              </div>

              <button
                onClick={() => setIsWeatherModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                Trocar Cidade / Localização
              </button>
            </div>

            {/* Weather Live Preview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-[#131b2e] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
                  <CloudSun className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Temperatura Atual</span>
                  <span className="text-2xl font-black">{weather.temp}°C</span>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-[#131b2e] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Cidade & Estado</span>
                  <span className="text-sm font-bold truncate block">{weather.city} · {weather.stateCode}</span>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-[#131b2e] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Condição Atual</span>
                  <span className="text-sm font-bold block">{weather.conditionText}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsWeatherModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Configurar Clima na TV
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer corporativo */}
      <footer
        className={`border-t py-4 mt-8 text-xs transition-colors ${
          isDark ? 'border-slate-800 bg-[#090e17] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center text-center">
          <p className="flex items-center gap-1.5 flex-wrap justify-center font-medium">
            <span>Desenvolvido por Breno Menon</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-sky-500 dark:text-sky-400 font-bold">BM Digital</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        onOpenBrand={() => setActiveTab('brand')}
        onOpenNewScreen={() => setActiveTab('screens')}
        onOpenNewSlide={() => handleOpenNewSlideModal()}
        onOpenTicker={() => setActiveTab('ticker')}
        onOpenWeather={() => setActiveTab('weather')}
      />

      {isSlideModalOpen && (
        <SlideCustomizerModal
          isOpen={isSlideModalOpen}
          onClose={() => setIsSlideModalOpen(false)}
          onSuccess={(item, addToPlaylist) => handleSlideSaved(item, addToPlaylist)}
          initialItem={slideModalInitialItem}
          companyProfile={brandProfile}
        />
      )}

      {isWeatherModalOpen && (
        <WeatherModal
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
          currentWeather={weather}
          onSave={handleSaveWeatherData}
        />
      )}

      {isBrandModalOpen && (
        <BrandSettingsModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          brandProfile={brandProfile}
          onSave={handleSaveBrandProfile}
        />
      )}

      {isTickerModalOpen && (
        <TickerSettingsModal
          isOpen={isTickerModalOpen}
          onClose={() => setIsTickerModalOpen(false)}
          ticker={ticker}
          onSave={handleSaveTickerData}
        />
      )}

      {deleteConfirm.isOpen && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={deleteConfirm.title}
          description={deleteConfirm.description}
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};
