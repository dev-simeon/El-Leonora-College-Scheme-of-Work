import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Elleonora College" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <ScrollViewStyleReset />
      </head>
      <body>
        <div className="ios-pwa-status-strip" aria-hidden="true" />
        {children}
        <style>{`
          .ios-pwa-status-strip { display: none; }
          @media (display-mode: standalone) {
            .ios-pwa-status-strip {
              display: block;
              position: fixed;
              inset: 0 0 auto;
              height: 11px;
              pointer-events: none;
              z-index: 2147483647;
              background-color: var(--ios-pwa-status-surface, #fff);
              -webkit-background-clip: text;
              background-clip: text;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
