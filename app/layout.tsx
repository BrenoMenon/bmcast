import React from 'react';
import '../src/index.css';

export const metadata = {
  title: 'BM Cast - Digital Signage & TV Menu',
  description: 'BM Cast - Plataforma corporativa de sinalização digital e menus dinâmicos para Smart TVs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
