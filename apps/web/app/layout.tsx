import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightXI — True Football Intelligence Platform",
  description:
    "AI-powered football intelligence: explainable predictions, tactical analysis, and historical trends. Not a gambling platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-pitch text-white antialiased">
        {children}
      </body>
    </html>
  );
}
