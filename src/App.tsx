import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { TVPlayer } from './components/player/TVPlayer';
import { LoginScreen } from './components/auth/LoginScreen';
import { ThemeProvider } from './context/ThemeContext';
import { authService } from './services/authService';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentRoute, setCurrentRoute] = useState<{
    view: 'dashboard' | 'player';
    slug?: string;
  }>({
    view: 'dashboard',
  });

  // Track auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('bmcast_auth_changed', handleAuthChange);
    return () => window.removeEventListener('bmcast_auth_changed', handleAuthChange);
  }, []);

  // Parse current URL path and query parameters
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      // 1. Query param: ?screen=slug or ?view=player&slug=...
      const screenParam = search.get('screen');
      if (screenParam) {
        setCurrentRoute({ view: 'player', slug: screenParam });
        return;
      }

      // 2. Path: /play/[slug]
      const playPathMatch = path.match(/\/play\/([^/?#]+)/);
      if (playPathMatch && playPathMatch[1]) {
        setCurrentRoute({ view: 'player', slug: playPathMatch[1] });
        return;
      }

      // 3. Hash: #/play/[slug] or #screen=...
      const hashMatch = hash.match(/#\/?play\/([^/?#]+)/);
      if (hashMatch && hashMatch[1]) {
        setCurrentRoute({ view: 'player', slug: hashMatch[1] });
        return;
      }

      // Default: Dashboard
      setCurrentRoute({ view: 'dashboard' });
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const handleOpenPlayer = (slug: string) => {
    setCurrentRoute({ view: 'player', slug });
    const newUrl = `${window.location.pathname}?screen=${slug}`;
    window.history.pushState({ view: 'player', slug }, '', newUrl);
  };

  const handleExitPlayer = () => {
    setCurrentRoute({ view: 'dashboard' });
    const cleanUrl = window.location.pathname;
    window.history.pushState({ view: 'dashboard' }, '', cleanUrl);
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
  };

  // 1. TV Player view (direct URL for Smart TVs to open without login)
  if (currentRoute.view === 'player' && currentRoute.slug) {
    return <TVPlayer slug={currentRoute.slug} onExit={handleExitPlayer} />;
  }

  // 2. Authentication Screen (when not logged in)
  if (!currentUser) {
    return <LoginScreen onSuccess={(user) => setCurrentUser(user)} />;
  }

  // 3. Management Dashboard
  return (
    <Dashboard
      onOpenPlayer={handleOpenPlayer}
      onSignOut={handleSignOut}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
