import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { displayFont, monoFont, Providers, sansFont } from '@/app-layer';
import '@/app-layer/styles/globals.css';

export const metadata: Metadata = {
  title: 'Переговорка — бронирование',
  description: 'Бронирование переговорной комнаты на рабочий день',
};

export const viewport: Viewport = {
  themeColor: '#8584bd',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
