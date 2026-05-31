import "./mobile.css";

/**
 * Layout for the mobile PWA experience. Imports the (scoped) mobile shell
 * styles for this route subtree only; the desktop chrome is intentionally
 * absent here.
 */
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
