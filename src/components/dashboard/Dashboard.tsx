import React, { useState, useEffect, useCallback } from 'react';
import { storageService, DB_UPDATED_EVENT } from '../../services/storageService';
import { authService, AuthUser } from '../../services/supabaseClient';
import { Screen, MediaItem, Playlist, SystemConfig } from '../../types/signage';
import { DashboardHeader } from './DashboardHeader';
import { OnboardingGuide } from './OnboardingGuide';
import { ScreensManager } from './ScreensManager';
import { MediaLibrary } from './MediaLibrary';
import { PlaylistEditor } from './PlaylistEditor';
import { SettingsModal } from './SettingsModal';
import { AuthModal } from '../auth/AuthModal';

interface DashboardProps {
  onOpenPlayer: (slug: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenPlayer }) => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [config, setConfig] = useState<SystemConfig>({
    supabaseUrl: 'https://dkjjgszyrkhdcrwycaej.supabase.co',
    supabaseAnonKey: 'sb_publishable_kyAFAx-RJG9MTLjTMmySTw_qoIqy9bD',
    isSupabaseConfigured: true,
    organizationName: 'BM Cast',
    themeAccent: '#3B82F6',
    themeMode: 'dark',
    defaultLayoutMode: 'clean_media',
    enableSplitMode: true,
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'screens' | 'media' | 'playlists'>('screens');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Always enforce pure dark mode per user instruction
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [s, m, p, c] = await Promise.all([
        storageService.getScreens(),
        storageService.getMedia(),
        storageService.getPlaylists(),
        storageService.getConfig(),
      ]);
      setScreens(s);
      setMedia(m);
      setPlaylists(p);
      setConfig(c);
      setCurrentUser(authService.getCurrentUser());
    } catch (e) {
      console.error('Falha ao sincronizar dados em nuvem:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };

    window.addEventListener(DB_UPDATED_EVENT, handleUpdate);
    window.addEventListener('bmcast_auth_changed', handleAuthChange);

    return () => {
      window.removeEventListener(DB_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('bmcast_auth_changed', handleAuthChange);
    };
  }, [refreshData]);

  const handleLaunchDefaultPlayer = () => {
    const defaultScreen = screens[0];
    if (defaultScreen) {
      onOpenPlayer(defaultScreen.slug);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] text-slate-400 flex items-center justify-center text-xs font-medium">
        Carregando BM Cast...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col antialiased selection:bg-blue-600/30 selection:text-blue-200 overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1">
        {/* Header */}
        <DashboardHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLaunchPlayer={handleLaunchDefaultPlayer}
          onToggleGuide={() => setShowGuide((prev) => !prev)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
          currentUser={currentUser}
          screens={screens}
          media={media}
          playlists={playlists}
          config={config}
        />

        {/* Onboarding Guide */}
        {showGuide && (
          <OnboardingGuide
            onStartScreen={() => setActiveTab('screens')}
            onStartMedia={() => setActiveTab('media')}
            onStartPlaylist={() => setActiveTab('playlists')}
            hasScreens={screens.length > 0}
            hasMedia={media.length > 0}
            hasPlaylists={playlists.length > 0}
          />
        )}

        {/* Main Tab Area */}
        <main>
          {activeTab === 'screens' && (
            <ScreensManager
              screens={screens}
              playlists={playlists}
              onOpenPlayer={onOpenPlayer}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'media' && (
            <MediaLibrary
              media={media}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistEditor
              screens={screens}
              playlists={playlists}
              media={media}
              onRefresh={refreshData}
              onOpenPlayer={onOpenPlayer}
            />
          )}
        </main>
      </div>

      {/* Settings Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefresh={refreshData}
      />

      {/* Login & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
        }}
      />
    </div>
  );
};
