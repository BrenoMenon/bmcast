'use client';

import React from 'react';
import { TVPlayer } from '../../../src/components/player/TVPlayer';

interface PlayPageProps {
  params: {
    slug: string;
  };
}

export default function PlayScreenPage({ params }: PlayPageProps) {
  const slug = params?.slug || 'tv-balcao-principal';

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return <TVPlayer slug={slug} onExit={handleExit} />;
}
