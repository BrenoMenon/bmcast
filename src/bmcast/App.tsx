import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { TVPlayer } from './components/player/TVPlayer';
import { LoginScreen } from './components/auth/LoginScreen';
import { authService } from './services/authService';

const RESERVED_PATHS = new Set([
  '',
  'index.html',
  'login',
  'entrar',
  'cadastro',
  'painel',
  'dashboard',
  'admin',
]);

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentRoute, setCurrentRoute] = useState<{
    view: 'dashboard' | 'player';
    slug?: string;
  }>({
    view: 'dashboard',
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('bmcast_auth_changed', handleAuthChange);
    return () => window.removeEventListener('bmcast_auth_changed', handleAuthChange);
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window === 'undefined') return;

      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      // 1. Query params (?tv=tv1 or ?screen=tv1)
      const tvParam = search.get('tv') || search.get('screen');
      if (tvParam && tvParam.trim()) {
        setCurrentRoute({ view: 'player', slug: tvParam.trim() });
        return;
      }

      // 2. Explicit /tv/slug or /play/slug
      const playPathMatch = path.match(/^\/(?:play|tv)\/([^/?#]+)\/?$/i);
      if (playPathMatch && playPathMatch[1]) {
        setCurrentRoute({ view: 'player', slug: decodeURIComponent(playPathMatch[1]) });
        return;
      }

      // 3. Ultra-short single segment URL: /tv1 or /4821
      const shortMatch = path.match(/^\/([a-zA-Z0-9_-]{1,32})\/?$/);
      if (shortMatch && shortMatch[1]) {
        const candidate = decodeURIComponent(shortMatch[1]);
        if (!RESERVED_PATHS.has(candidate.toLowerCase()) && !candidate.includes('.')) {
          setCurrentRoute({ view: 'player', slug: candidate });
          return;
        }
      }

      // 4. Hash fallback: #tv1 or #/tv/tv1
      const hashMatch = hash.match(/^#\/?(?:(?:play|tv)\/)?([a-zA-Z0-9_-]{1,32})$/);
      if (hashMatch && hashMatch[1] && !RESERVED_PATHS.has(hashMatch[1].toLowerCase())) {
        setCurrentRoute({ view: 'player', slug: hashMatch[1] });
        return;
      }

      setCurrentRoute({ view: 'dashboard' });
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenPlayer = (slug: string) => {
    const clean = slug.trim().replace(/^\/+/, '');
    if (!clean) return;
    setCurrentRoute({ view: 'player', slug: clean });
    window.history.pushState({ view: 'player', slug: clean }, '', `/${encodeURIComponent(clean)}`);
  };

  const handleExitPlayer = () => {
    setCurrentRoute({ view: 'dashboard' });
    window.history.pushState({ view: 'dashboard' }, '', '/');
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
  };

  if (currentRoute.view === 'player' && currentRoute.slug) {
    return <TVPlayer slug={currentRoute.slug} onExit={handleExitPlayer} />;
  }

  if (!currentUser) {
    return <LoginScreen onSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <Dashboard
      onOpenPlayer={handleOpenPlayer}
      onSignOut={handleSignOut}
    />
  );
}
