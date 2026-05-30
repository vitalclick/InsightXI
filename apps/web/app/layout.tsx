import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "../components/nav";
import { ServiceWorkerRegistrar } from "../components/service-worker";

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
  themeColor: "#0a0f1c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-pitch text-white antialiased">
        <Providers>
          <ServiceWorkerRegistrar />
          <Nav />
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
