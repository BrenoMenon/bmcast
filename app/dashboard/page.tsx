'use client';

import React from 'react';
import { Dashboard } from '../../src/components/dashboard/Dashboard';

export default function DashboardPage() {
  const handleOpenPlayer = (slug: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/play/${slug}`;
    }
  };

  return <Dashboard onOpenPlayer={handleOpenPlayer} />;
}
