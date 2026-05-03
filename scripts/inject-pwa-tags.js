/**
 * Post-export script: injects Apple PWA meta tags and fixes viewport into dist/index.html.
 * Run after `expo export --platform web`.
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Fix viewport to include viewport-fit=cover (needed for iPhone notch / safe area)
html = html.replace(
  /(<meta[^>]*name="viewport"[^>]*content=")[^"]*"/,
  '$1width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
);

const tags = `
  <!-- PWA manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- Apple PWA: standalone mode, no Safari chrome -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Tier App" />

  <!-- Apple touch icons -->
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="192x192" href="/pwa-192.png" />
`;

// Inject before </head>
html = html.replace('</head>', `${tags}</head>`);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('PWA tags injected into dist/index.html');
