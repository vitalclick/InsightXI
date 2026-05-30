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
