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
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { WeatherConfig, Screen, CompanyBrandProfile } from '../../types/signage';

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
  onLaunchPlayer: (slug: string) => void;
  onSignOut?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  screens,
  selectedScreenSlug,
  onSelectScreenSlug,
  weather,
  brandProfile: _brandProfile,
  onOpenWeatherModal,
  onOpenBrandModal,
  onOpenTickerModal,
  onOpenNewSlideModal,
  onLaunchPlayer,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#25334a] bg-[#0d131f]/95 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand mark + Screen Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo size="md" />

          {screens.length > 0 && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#25334a]">
              <span className="text-xs text-slate-400 font-medium">TV:</span>
              <select
                value={selectedScreenSlug}
                onChange={(e) => onSelectScreenSlug(e.target.value)}
                className="bg-[#151f32] border border-[#25334a] rounded-full px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-[#2dd4bf] cursor-pointer transition-colors"
              >
                {screens.map((sc) => (
                  <option key={sc.id} value={sc.slug} className="bg-[#151f32] text-white">
                    {sc.name} ({sc.orientation === 'landscape' ? '16:9' : '9:16'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center / Right Zone: BL Core Rounded Buttons */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Live Weather Readout */}
          <button
            onClick={onOpenWeatherModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151f32] hover:bg-[#1e293b] border border-[#25334a] text-xs text-slate-300 transition-all cursor-pointer"
            title="Previsão do Tempo Oficial via API"
          >
            <CloudSun className="w-4 h-4 text-[#2dd4bf]" />
            <span className="font-semibold text-white">{weather.temp}°C</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 max-w-[110px] truncate">{weather.city}</span>
          </button>

          {/* Marca */}
          <button
            onClick={onOpenBrandModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#151f32] hover:bg-[#1e293b] border border-[#25334a] text-xs text-slate-300 transition-all cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>Identidade</span>
          </button>

          {/* Letreiro */}
          <button
            onClick={onOpenTickerModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#151f32] hover:bg-[#1e293b] border border-[#25334a] text-xs text-slate-300 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>Letreiro</span>
          </button>

          <div className="h-4 w-px bg-[#25334a] mx-1" />

          {/* Criar Slide - Rounded Full Button */}
          <button
            onClick={onOpenNewSlideModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2dd4bf] hover:bg-[#20b8a4] active:scale-95 text-[#042f2e] rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Slide</span>
          </button>

          {/* Abrir TV Player - Rounded Full Secondary Button */}
          <button
            onClick={() => onLaunchPlayer(selectedScreenSlug)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1e293b] hover:bg-[#27364d] border border-[#2d3d57] active:scale-95 text-slate-100 rounded-full text-xs font-semibold transition-all cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span>Transmitir na TV</span>
          </button>

          {/* Logout */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-1"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOpenNewSlideModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#2dd4bf] text-[#042f2e] rounded-full text-xs font-bold cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Slide</span>
          </button>

          <button
            onClick={() => onLaunchPlayer(selectedScreenSlug)}
            className="p-2 bg-[#151f32] text-[#2dd4bf] rounded-full border border-[#25334a] cursor-pointer"
            title="Abrir TV Player"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-[#151f32] text-slate-400 hover:text-white border border-[#25334a] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#25334a] bg-[#0d131f] px-4 py-3.5 space-y-3">
          {screens.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Tela Ativa:</span>
              <select
                value={selectedScreenSlug}
                onChange={(e) => {
                  onSelectScreenSlug(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#151f32] border border-[#25334a] rounded-xl p-2.5 text-xs text-white"
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
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#151f32] border border-[#25334a] text-left text-xs text-slate-200 cursor-pointer"
            >
              <CloudSun className="w-4 h-4 text-[#2dd4bf] shrink-0" />
              <div>
                <div className="font-semibold text-white">{weather.temp}°C</div>
                <div className="text-[10px] text-slate-400 truncate">{weather.city}</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenBrandModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#151f32] border border-[#25334a] text-left text-xs text-slate-200 cursor-pointer"
            >
              <Store className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Marca</div>
                <div className="text-[10px] text-slate-400">Logo e Cores</div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenTickerModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#151f32] border border-[#25334a] text-left text-xs text-slate-200 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Letreiro</div>
                <div className="text-[10px] text-slate-400">Rodapé da TV</div>
              </div>
            </button>

            {onSignOut && (
              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-red-950/20 border border-red-900/40 text-left text-xs text-red-300 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="font-semibold">Sair</div>
                  <div className="text-[10px] text-red-400/70">Desconectar</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
