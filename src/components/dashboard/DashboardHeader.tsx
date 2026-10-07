import React, { useState } from 'react';
import {
  Play,
  CloudSun,
  Store,
  Radio,
  Plus,
  LogOut,
  Menu,
  X,
  Tv,
  HelpCircle,
  Database,
  Sun,
  Moon,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { WeatherConfig, Screen, CompanyBrandProfile } from '../../types/signage';

interface DashboardHeaderProps {
  screens: Screen[];
  selectedScreenSlug: string;
  onSelectScreenSlug: (slug: string) => void;
  weather: WeatherConfig;
  brandProfile: CompanyBrandProfile;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenWeatherModal: () => void;
  onOpenBrandModal: () => void;
  onOpenTickerModal: () => void;
  onOpenNewSlideModal: () => void;
  onOpenConnectTVModal: () => void;
  onOpenTutorialModal: () => void;
  onOpenSupabaseModal: () => void;
  onLaunchPlayer: (slug: string) => void;
  onSignOut?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  screens,
  selectedScreenSlug,
  onSelectScreenSlug,
  weather,
  brandProfile,
  themeMode,
  onToggleTheme,
  onOpenWeatherModal,
  onOpenBrandModal,
  onOpenTickerModal,
  onOpenNewSlideModal,
  onOpenConnectTVModal,
  onOpenTutorialModal,
  onOpenSupabaseModal,
  onLaunchPlayer,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-700/60 dark:border-slate-800 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand mark + Screen Selector */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Logo size="md" />

          {screens.length > 0 && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-700">
              <span className="text-xs text-slate-400 font-semibold">TV Ativa:</span>
              <select
                value={selectedScreenSlug}
                onChange={(e) => onSelectScreenSlug(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-full px-3.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
              >
                {screens.map((sc) => (
                  <option key={sc.id} value={sc.slug} className="bg-slate-800 text-white">
                    {sc.name} ({sc.orientation === 'landscape' ? '16:9' : '9:16'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center / Right Zone: Rounded Controls */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Weather Button */}
          <button
            onClick={onOpenWeatherModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
            title="Previsão do Tempo Oficial via API / GPS"
          >
            <CloudSun className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">{weather.temp}°C</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 max-w-[100px] truncate">{weather.city}</span>
          </button>

          {/* Letreiro */}
          <button
            onClick={onOpenTickerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
            title="Personalizar letreiro rotativo no rodapé"
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Letreiro</span>
          </button>

          {/* Identidade */}
          <button
            onClick={onOpenBrandModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
            title="Nome, logotipo e cores da sua empresa"
          >
            <Store className="w-3.5 h-3.5 text-blue-400" />
            <span>Empresa</span>
          </button>

          {/* Tutorial / Ajuda */}
          <button
            onClick={onOpenTutorialModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
            title="Guia rápido passo a passo de como usar a TV"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Tutorial</span>
          </button>

          {/* Supabase / Nuvem */}
          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
            title="Configurar chaves do Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nuvem</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={themeMode === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Conectar TV Button */}
          <button
            onClick={onOpenConnectTVModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-blue-500/50 hover:border-blue-400 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Gerar Link e QR Code para Telões e TVs"
          >
            <Wifi className="w-3.5 h-3.5 text-blue-400" />
            <span>Conectar TV</span>
          </button>

          {/* Criar Slide - Primary Blue */}
          <button
            onClick={onOpenNewSlideModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Slide</span>
          </button>

          {/* Logout */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex lg:hidden items-center gap-1.5">
          {/* Theme switch mobile */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
            title="Alternar Tema"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {/* Conectar TV mobile */}
          <button
            onClick={onOpenConnectTVModal}
            className="p-2 rounded-full bg-slate-800 text-blue-400 border border-slate-700 cursor-pointer"
            title="Conectar TV"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Criar Slide mobile */}
          <button
            onClick={onOpenNewSlideModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold cursor-pointer active:scale-95 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Slide</span>
          </button>

          {/* Hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3.5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {screens.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-bold">Tela da TV Selecionada:</span>
              <select
                value={selectedScreenSlug}
                onChange={(e) => {
                  onSelectScreenSlug(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {screens.map((sc) => (
                  <option key={sc.id} value={sc.slug}>
                    {sc.name} ({sc.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onOpenWeatherModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-left text-xs text-slate-200 cursor-pointer"
            >
              <CloudSun className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white">{weather.temp}°C</div>
                <div className="text-[10px] text-slate-400 truncate">{weather.city}</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenConnectTVModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-800 border border-blue-500/40 text-left text-xs text-slate-200 cursor-pointer"
            >
              <Wifi className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Conectar TV</div>
                <div className="text-[10px] text-slate-400">Link &amp; QR Code</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenBrandModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-left text-xs text-slate-200 cursor-pointer"
            >
              <Store className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Empresa</div>
                <div className="text-[10px] text-slate-400">Logo e Cores</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenTickerModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-left text-xs text-slate-200 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Letreiro</div>
                <div className="text-[10px] text-slate-400">Rodapé da TV</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenTutorialModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-left text-xs text-slate-200 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Tutorial</div>
                <div className="text-[10px] text-slate-400">Como usar a TV</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenSupabaseModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-left text-xs text-slate-200 cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Nuvem</div>
                <div className="text-[10px] text-slate-400">Supabase API</div>
              </div>
            </button>

            {onSignOut && (
              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-red-950/20 border border-red-900/40 text-xs text-red-300 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="font-bold">Desconectar da Conta</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
