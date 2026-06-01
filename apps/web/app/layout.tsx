import type { Metadata } from "next";
import "./globals.css";
import "./design-system.css";
import "./responsive.css";
import { Providers } from "./providers";
import { ServiceWorkerRegistrar } from "../components/service-worker";
import { ClientInit } from "../components/client-init";

export const metadata: Metadata = {
  title: "InsightXI — True Football Intelligence Platform",
  description:
    "AI-powered football intelligence: explainable predictions, tactical analysis, and historical trends. Not a gambling platform.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "InsightXI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = {
  themeColor: "#070b14",
};

// Applied before paint to avoid a flash of the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('ix-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

// Phone-sized viewports get the dedicated mobile app at /m. Runs before paint
// so the base URL (and any app route) redirects with no flash; the /m route
// and larger screens are left alone. A resize listener also handles the
// desktop→phone case after load (see PhoneRedirect in the (app) layout).
const MOBILE_REDIRECT = `(function(){try{var p=location.pathname;if(p==='/m'||p.indexOf('/m/')===0)return;if(window.matchMedia&&window.matchMedia('(max-width: 520px)').matches){location.replace('/m');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: MOBILE_REDIRECT }} />
      </head>
      <body>
        <Providers>
          <ServiceWorkerRegistrar />
          <ClientInit />
          {children}
        </Providers>
      </body>
    </html>
  );
}
