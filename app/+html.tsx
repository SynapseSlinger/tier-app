import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* PWA basics */}
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="Tier App" />
        <link rel="manifest" href="/manifest.json" />

        {/* Apple PWA — standalone mode, no Safari chrome */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tier App" />

        {/* Apple touch icons (iOS uses first match ≥ requested size) */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/pwa-192.png" />

        {/* Prevent rubber-band scroll on the root */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root { height: 100%; background: #000; }
          body { overflow: hidden; -webkit-overflow-scrolling: touch; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
