import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bmcast_theme_mode';
export const THEME_CHANGED_EVENT = 'bmcast_theme_changed';

class ThemeService {
  getTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      /* ignore storage errors */
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('light')) return 'light';
      if (document.documentElement.classList.contains('dark')) return 'dark';
    }
    return 'dark';
  }

  applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    root.style.colorScheme = mode;
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        /* ignore storage errors */
      }
      window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGED_EVENT, { detail: mode }));
    }
  }

  toggleTheme(): ThemeMode {
    const next: ThemeMode = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }
}

export const themeService = new ThemeService();

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => themeService.getTheme());

  useEffect(() => {
    // Ensure DOM matches current stored theme on mount
    const current = themeService.getTheme();
    themeService.applyTheme(current);
    setThemeState(current);

    const handleThemeEvent = (e: Event) => {
      const custom = e as CustomEvent<ThemeMode>;
      const next = custom.detail || themeService.getTheme();
      setThemeState(next);
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        themeService.applyTheme(e.newValue);
        setThemeState(e.newValue);
      }
    };

    window.addEventListener(THEME_CHANGED_EVENT, handleThemeEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    themeService.setTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    return themeService.toggleTheme();
  }, []);

  return { theme, setTheme, toggleTheme };
}
