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
import { DashboardHeader } from './DashboardHeader';
import { PlaylistEditor } from './PlaylistEditor';
import { MediaLibrary } from './MediaLibrary';
import { ScreensManager } from './ScreensManager';
import { SlideCustomizerModal } from './SlideCustomizerModal';
import { WeatherModal } from './WeatherModal';
import { BrandSettingsModal } from './BrandSettingsModal';
import { TickerSettingsModal } from './TickerSettingsModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface DashboardProps {
  onOpenPlayer: (slug: string) => void;
  onSignOut?: () => void;
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
    text: 'BM Cast • Sistema de TV Corporativa e Menus Dinâmicos.',
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

  // Modals state
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [slideModalInitialItem, setSlideModalInitialItem] = useState<MediaItem | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<SlideCategoryType | undefined>();

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);

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
      console.error('Erro ao ler dados:', err);
    }
  }, [selectedScreenSlug]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener(DB_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DB_UPDATED_EVENT, handleUpdate);
  }, [loadData]);

  const activePlaylist = playlists[0] || {
    id: 'playlist-padrao',
    name: 'Programação Principal',
    description: '',
    items: [],
    updatedAt: new Date().toISOString(),
  };

  const handleOpenNewSlideModal = (category?: SlideCategoryType) => {
    setSlideModalInitialItem(null);
    setPreselectedCategory(category);
    setIsSlideModalOpen(true);
  };

  const handleEditSlide = (item: MediaItem) => {
    setSlideModalInitialItem(item);
    setIsSlideModalOpen(true);
  };

  const handleSlideSaved = async (savedItem: MediaItem, addToPlaylist: boolean) => {
    await storageService.saveMedia(savedItem, addToPlaylist);

    const currentScreens = await storageService.getScreens();
    if (currentScreens.length === 0) {
      const defaultScreen: Screen = {
        id: `scr_${Date.now()}`,
        name: 'TV Principal 1',
        location: 'Salão / Recepção',
        slug: 'tv-principal',
        pairingCode: 'TV-1001',
        activePlaylistId: 'playlist-padrao',
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

    loadData();
  };

  const handleDuplicateSlide = async (playlistId: string, itemId: string) => {
    await storageService.duplicatePlaylistItem(playlistId, itemId);
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
        loadData();
      },
    });
  };

  const handleSaveWeather = async (updatedWeather: WeatherConfig) => {
    await storageService.saveWeather(updatedWeather);
    setWeather(updatedWeather);
  };

  const handleSaveBrandProfile = async (updatedProfile: CompanyBrandProfile) => {
    if (config) {
      const updatedConfig = { ...config, brandProfile: updatedProfile, organizationName: updatedProfile.name };
      await storageService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
    }
  };

  const handleSaveTicker = async (updatedTicker: TickerConfig) => {
    await storageService.saveTicker(updatedTicker);
    setTicker(updatedTicker);
  };

  const handleLoadDemoPack = async () => {
    await storageService.loadDemoPack();
    setSelectedScreenSlug('tv-principal');
    loadData();
  };

  const handleClearAll = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Limpar todos os dados?',
      description: 'Isso apagará todas as mídias, playlists e TVs cadastradas.',
      onConfirm: async () => {
        await storageService.clearAll();
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        loadData();
      },
    });
  };

  const brandProfile = config?.brandProfile || {
    name: 'Minha Empresa',
    slogan: 'Comunicação Visual em Alta Definição',
    logoUrl: '',
    accentColor: '#2563EB',
    defaultQrCodeUrl: '',
  };

  const isSystemEmpty = mediaList.length === 0 && screens.length === 0;

  return (
    <div className="min-h-screen bg-[#0d131f] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <DashboardHeader
        screens={screens}
        selectedScreenSlug={selectedScreenSlug}
        onSelectScreenSlug={setSelectedScreenSlug}
        weather={weather}
        brandProfile={brandProfile}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
        onOpenTickerModal={() => setIsTickerModalOpen(true)}
        onOpenNewSlideModal={() => handleOpenNewSlideModal()}
        onLaunchPlayer={onOpenPlayer}
        onSignOut={onSignOut}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Empty State Banner (BL Core Rounded Card) */}
        {isSystemEmpty ? (
          <div className="bg-[#151f32] border border-[#25334a] rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#0d131f] border border-[#25334a] text-[#2dd4bf] flex items-center justify-center mx-auto shadow-inner">
              <Tv className="w-6 h-6" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Nenhuma tela ou slide configurado
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comece criando seu primeiro slide personalizado ou carregue o pacote de demonstração de testes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => handleOpenNewSlideModal()}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-95 text-[#042f2e] font-bold text-xs rounded-full transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Slide</span>
              </button>

              <button
                onClick={handleLoadDemoPack}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#1e293b] hover:bg-[#27364d] text-slate-200 hover:text-white font-medium text-xs rounded-full border border-[#2d3d57] transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span>Carregar Modelos de Exemplo</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Navigation Tabs (BL Core Capsule Rounded-Full) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#25334a] pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-[#151f32] rounded-full border border-[#25334a] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('playlist')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'playlist'
                  ? 'bg-[#2dd4bf] text-[#042f2e] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Grade de Transmissão</span>
              <span className="text-[10px] font-semibold opacity-85">({activePlaylist.items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-[#2dd4bf] text-[#042f2e] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Biblioteca de Mídias</span>
              <span className="text-[10px] font-semibold opacity-85">({mediaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('screens')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'screens'
                  ? 'bg-[#2dd4bf] text-[#042f2e] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Monitores & Telas</span>
              <span className="text-[10px] font-semibold opacity-85">({screens.length})</span>
            </button>
          </div>

          {!isSystemEmpty && (
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 px-2 py-1"
              title="Limpar todos os dados"
            >
              Limpar Tudo
            </button>
          )}
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

      {/* Footer */}
      <footer className="border-t border-[#25334a] bg-[#0d131f] py-4 mt-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BM Cast Pro · Sistema de Sinalização Digital</span>
          <p className="flex items-center gap-1.5 flex-wrap">
            <span>© Desenvolvido por</span>
            <span className="text-white font-semibold">Breno Menon</span>
            <span className="text-slate-600">|</span>
            <span className="text-[#2dd4bf] font-bold">BM Digital</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SlideCustomizerModal
        isOpen={isSlideModalOpen}
        onClose={() => {
          setIsSlideModalOpen(false);
          setSlideModalInitialItem(null);
        }}
        onSuccess={handleSlideSaved}
        initialItem={slideModalInitialItem}
        companyProfile={brandProfile}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        currentWeather={weather}
        onSave={handleSaveWeather}
      />

      <BrandSettingsModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        brandProfile={brandProfile}
        onSave={handleSaveBrandProfile}
      />

      <TickerSettingsModal
        isOpen={isTickerModalOpen}
        onClose={() => setIsTickerModalOpen(false)}
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
