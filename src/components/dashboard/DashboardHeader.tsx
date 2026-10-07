import React, { useState } from 'react';
import {
  Tv,
  Plus,
  CloudSun,
  Store,
  Radio,
  Play,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { Screen, WeatherConfig, CompanyBrandProfile } from '../../types/signage';

interface DashboardHeaderProps {
  screens: Screen[];
  selectedScreenSlug: string;
  onSelectScreenSlug: (slug: string) => void;
  weather: WeatherConfig;
  brandProfile: CompanyBrandProfile;
  onOpenWeatherModal: () => void;
  onOpenBrandModal: () => void;
  onOpenTickerModal: () => void;
  onOpenNewSlideModal: () => void;
  onOpenTutorialModal: () => void;
  onLaunchPlayer: (slug: string) => void;
  onSignOut?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  screens,
  selectedScreenSlug,
  onSelectScreenSlug,
  weather,
  onOpenWeatherModal,
  onOpenBrandModal,
  onOpenTickerModal,
  onOpenNewSlideModal,
  onOpenTutorialModal,
  onLaunchPlayer,
  onSignOut,
}) => {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = theme === 'dark';

  return (
    <header
      className={`border-b sticky top-0 z-40 transition-colors backdrop-blur-md ${
        isDark
          ? 'bg-[#090e17]/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left Zone: Brand Logo & Screen Selector */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Logo size="md" showSubtitle={false} className="shrink-0" />

          {screens.length > 0 && (
            <div
              className={`hidden md:flex items-center gap-2 pl-3 border-l shrink-0 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                TV:
              </span>
              <select
                value={selectedScreenSlug}
                onChange={(e) => onSelectScreenSlug(e.target.value)}
                className={`border rounded-full px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer transition-colors max-w-[160px] truncate ${
                  isDark
                    ? 'bg-[#152033] border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {screens.map((sc) => (
                  <option
                    key={sc.id}
                    value={sc.slug}
                    className={isDark ? 'bg-[#152033] text-white' : 'bg-white text-slate-900'}
                  >
                    {sc.name} ({sc.orientation === 'landscape' ? '16:9' : '9:16'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center / Right Zone: Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {/* Live Weather Readout */}
          <button
            onClick={onOpenWeatherModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Previsão do Tempo Oficial via API"
          >
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {weather.temp}°C
            </span>
            <span className="text-slate-400">·</span>
            <span className={`max-w-[85px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {weather.city}
            </span>
          </button>

          {/* Marca / Identidade */}
          <button
            onClick={onOpenBrandModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>Marca</span>
          </button>

          {/* Letreiro */}
          <button
            onClick={onOpenTickerModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>Letreiro</span>
          </button>

          {/* Tutorial / Como Usar */}
          <button
            onClick={onOpenTutorialModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-400'
                : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700'
            }`}
            title="Abrir Tutorial Passo a Passo"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tutorial</span>
          </button>

          <div className={`h-4 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Criar Slide */}
          <button
            onClick={onOpenNewSlideModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Slide</span>
          </button>

          {/* Transmitir na TV */}
          <button
            onClick={() => onLaunchPlayer(selectedScreenSlug)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 border active:scale-95 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#152033] hover:bg-slate-700 border-slate-700 text-slate-100'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-xs'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            <span>Transmitir na TV</span>
          </button>

          {/* Logout */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sair do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle no Canto Superior Direito */}
          <div className="pl-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Header Controls: Clean, non-crowded, Theme Toggle at top right corner */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOpenNewSlideModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 active:scale-95 text-white rounded-full text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Slide</span>
          </button>

          <button
            onClick={() => onLaunchPlayer(selectedScreenSlug)}
            className={`p-1.5 rounded-full border cursor-pointer ${
              isDark
                ? 'bg-[#152033] text-sky-400 border-slate-700'
                : 'bg-slate-100 text-sky-600 border-slate-300'
            }`}
            title="Abrir TV Player"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Theme Toggle explicitly at top-right for mobile */}
          <ThemeToggle />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#152033] border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b px-4 py-4 space-y-3 transition-colors ${
            isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {screens.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Monitor Selecionado
              </label>
              <select
                value={selectedScreenSlug}
                onChange={(e) => {
                  onSelectScreenSlug(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold ${
                  isDark ? 'bg-[#152033] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {screens.map((sc) => (
                  <option key={sc.id} value={sc.slug}>
                    {sc.name} ({sc.orientation === 'landscape' ? '16:9' : '9:16'})
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
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                isDark ? 'bg-[#152033] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <CloudSun className="w-4 h-4 text-sky-400" />
              <span>Clima ({weather.temp}°C)</span>
            </button>

            <button
              onClick={() => {
                onOpenBrandModal();
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                isDark ? 'bg-[#152033] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Store className="w-4 h-4 text-slate-400" />
              <span>Marca</span>
            </button>

            <button
              onClick={() => {
                onOpenTickerModal();
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                isDark ? 'bg-[#152033] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Radio className="w-4 h-4 text-slate-400" />
              <span>Letreiro</span>
            </button>

            <button
              onClick={() => {
                onOpenTutorialModal();
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Tutorial</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onLaunchPlayer(selectedScreenSlug);
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 px-3 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mr-2"
            >
              <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
              <span>Abrir Player</span>
            </button>

            {onSignOut && (
              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
