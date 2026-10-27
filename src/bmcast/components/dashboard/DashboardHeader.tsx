import React, { useState, useRef, useEffect } from 'react';
import {
  CloudSun,
  Store,
  Radio,
  Plus,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  Wifi,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { WeatherConfig, Screen, CompanyBrandProfile } from '../../types/signage';
import { authService } from '../../services/authService';

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
  onLaunchPlayer: (slug: string) => void;
  onSignOut?: (() => void) | undefined;
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
  onSignOut,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = brandProfile.name || currentUser?.name || 'Minha Empresa';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'BM';

  return (
    <header className="sticky top-0 z-30 flex h-15 sm:h-16 items-center justify-between gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md sm:px-6 lg:px-8 transition-colors">
      {/* Left: Mobile Logo + Active TV Selector + Live Weather */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="md:hidden shrink-0">
          <Logo size="sm" showSubtitle={false} />
        </div>

        {screens.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="hidden lg:inline text-xs font-semibold text-muted-foreground whitespace-nowrap">
              TV Ativa:
            </span>
            <select
              value={selectedScreenSlug}
              onChange={(e) => onSelectScreenSlug(e.target.value)}
              aria-label="Selecionar TV Ativa"
              className="max-w-[175px] xl:max-w-[230px] truncate rounded-full border border-border bg-muted/65 px-3.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none cursor-pointer transition"
            >
              {screens.map((sc) => (
                <option key={sc.id} value={sc.slug} className="bg-card text-foreground">
                  {sc.name} ({sc.orientation === 'landscape' ? '16:9' : '9:16'})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenWeatherModal}
          className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer whitespace-nowrap"
          title="Configurar cidade e previsão do tempo ao vivo"
        >
          <CloudSun className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-bold tabular-nums">{weather.temp}°C</span>
          <span className="text-muted-foreground">·</span>
          <span className="max-w-[110px] truncate text-muted-foreground">{weather.city}</span>
        </button>
      </div>

      {/* Right: Connect TV + Primary CTA + Icon-Only Theme Switcher + Profile Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenConnectTVModal}
          className="flex h-9 w-9 sm:w-auto sm:px-3.5 items-center justify-center gap-1.5 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer whitespace-nowrap shrink-0"
          title="Link rápido e código para Smart TV"
          aria-label="Conectar Smart TV"
        >
          <Wifi className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
          <span className="hidden lg:inline">Conectar TV</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewSlideModal}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-4 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="sm:hidden">Slide</span>
          <span className="hidden sm:inline">Criar Slide</span>
        </button>

        {/* ICON-ONLY LIGHT/DARK THEME TOGGLE */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={themeMode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={themeMode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer shrink-0"
        >
          {themeMode === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* User / Station Avatar Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-label="Abrir menu da conta"
            aria-expanded={profileMenuOpen}
            className="flex h-9 items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-card p-1 pr-2 sm:pr-2.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
          >
            {brandProfile.logoUrl ? (
              <img
                src={brandProfile.logoUrl}
                alt={displayName}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                {initials}
              </span>
            )}
            <span className="hidden xl:inline max-w-[120px] truncate">{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-[min(16.5rem,calc(100vw-1.5rem))] origin-top-right rounded-3xl border border-border bg-popover p-2 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-3 py-2.5 border-b border-border/80 mb-1">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                {currentUser?.email && (
                  <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenBrandModal();
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Store className="h-4 w-4 text-primary shrink-0" />
                <span>Dados da Empresa &amp; Conta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenWeatherModal();
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                <CloudSun className="h-4 w-4 text-primary shrink-0" />
                <span>Clima ao Vivo ({weather.temp}°C)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenTickerModal();
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Radio className="h-4 w-4 text-primary shrink-0" />
                <span>Letreiro de Rodapé</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenConnectTVModal();
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Wifi className="h-4 w-4 text-primary shrink-0" />
                <span>Link &amp; Código da TV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenTutorialModal();
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                <span>Como Usar na Smart TV</span>
              </button>

              {onSignOut && (
                <>
                  <div className="my-1 border-t border-border/80" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sair da Conta</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
