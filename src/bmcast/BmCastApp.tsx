import { useEffect, useState, type ComponentType } from 'react';

/**
 * Loads the BM CAST SPA only in the browser (it relies on localStorage,
 * fullscreen and media APIs), avoiding any SSR/hydration mismatch.
 */
export function BmCastApp() {
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Apply saved theme before first paint of the app
    try {
      const t = localStorage.getItem('bmcast_theme_mode');
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(t === 'light' ? 'light' : 'dark');
    } catch {
      /* ignore */
    }
    let alive = true;
    import('./App').then((m) => alive && setApp(() => m.default));
    return () => {
      alive = false;
    };
  }, []);

  if (!App) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }
  return <App />;
}
