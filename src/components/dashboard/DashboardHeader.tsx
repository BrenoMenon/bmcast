import React, { useState } from 'react';
import { 
  Tv, Layers, UploadCloud, Settings, ExternalLink, 
  BookOpen, User, LogOut, LogIn, ChevronDown
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { Screen, MediaItem, Playlist, SystemConfig } from '../../types/signage';
import { AuthUser } from '../../services/supabaseClient';

interface DashboardHeaderProps {
  activeTab: 'screens' | 'media' | 'playlists';
  onSelectTab: (tab: 'screens' | 'media' | 'playlists') => void;
  onOpenSettings: () => void;
  onLaunchPlayer: () => void;
  onToggleGuide: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  currentUser: AuthUser | null;
  screens: Screen[];
  media: MediaItem[];
  playlists: Playlist[];
  config: SystemConfig;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onLaunchPlayer,
  onToggleGuide,
  onOpenAuth,
  onSignOut,
  currentUser,
  screens,
  media,
  playlists,
  config,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="space-y-3 sm:space-y-4">
      {/* Top Navbar Card */}
      <div className="bm-card p-3 sm:px-5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Status */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <Logo size="md" />

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 pl-3 border-l border-slate-800">
            <span className="flex items-center gap-1.5 text-blue-400 font-medium">
              <span>Transmissão em Tempo Real</span>
            </span>
          </div>

          {/* Mobile User Profile Button (Top Right on small screens) */}
          <div className="md:hidden relative">
            {currentUser ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs"
              >
                {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold"
              >
                Entrar
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Tutorial Button */}
          <button
            onClick={onToggleGuide}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#111726] hover:bg-[#182136] border border-[#1E293B] text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Ver Tutorial de Instalação e Uso"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Guia Rápido</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#111726] hover:bg-[#182136] border border-[#1E293B] text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Ajustes de Letreiro, Clima e Padrões da TV"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Ajustes da TV</span>
          </button>

          {/* Launch Player */}
          {screens.length > 0 && (
            <button
              onClick={onLaunchPlayer}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Player da TV</span>
            </button>
          )}

          {/* User Account Menu (Desktop) */}
          <div className="hidden md:block relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111726] hover:bg-[#182136] border border-[#1E293B] text-slate-200 text-xs font-semibold transition"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{currentUser.name || currentUser.email}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 p-2 rounded-xl bg-[#0F1422] border border-[#1E293B] shadow-2xl z-50 space-y-1">
                    <div className="px-2.5 py-1.5 border-b border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Conta Conectada</span>
                      <span className="text-xs font-medium text-slate-200 block truncate">{currentUser.email}</span>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#162035] hover:bg-[#1E2B47] border border-[#23314E] text-blue-300 hover:text-white text-xs font-bold transition"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Entrar / Criar Conta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile User Dropdown if clicked on mobile */}
      {userMenuOpen && currentUser && (
        <div className="md:hidden p-3 rounded-xl bg-[#0F1422] border border-[#1E293B] space-y-2">
          <div className="text-xs text-slate-300">
            Conectado como: <strong>{currentUser.email}</strong>
          </div>
          <button
            onClick={() => {
              setUserMenuOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 text-xs font-bold border border-rose-800/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      )}

      {/* Navigation Tabs (Mobile-Friendly Pill Bar) */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
        <nav className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5" aria-label="Abas de Gestão">
          <button
            onClick={() => onSelectTab('screens')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'screens'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111726]'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            <span className="truncate">Telas e TVs</span>
            <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.2 rounded-full ${
              activeTab === 'screens' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {screens.length}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('media')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'media'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111726]'
            }`}
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span className="truncate">Mídias</span>
            <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.2 rounded-full ${
              activeTab === 'media' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {media.length}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('playlists')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'playlists'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111726]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate">Playlists</span>
            <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.2 rounded-full ${
              activeTab === 'playlists' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {playlists.length}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
