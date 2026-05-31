"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { api } from "../../services/api-client";
import type { AuthResponse } from "../../lib/types";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "";

interface SocialAuthProps {
  onSuccess: (auth: AuthResponse) => void;
  /** Email used for sandbox/demo sign-in when a provider isn't configured. */
  demoEmail?: string;
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.1 29.5 5 24 5 16 5 9.1 9.5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.5 15.9 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4 5.5l6.3 5.3C41.9 36.7 45 31 45 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.36 12.78c.02 2.6 2.28 3.46 2.3 3.47-.02.06-.36 1.24-1.19 2.46-.72 1.05-1.46 2.1-2.64 2.12-1.15.02-1.52-.68-2.84-.68-1.31 0-1.72.66-2.81.7-1.13.04-1.99-1.13-2.72-2.18-1.48-2.15-2.62-6.07-1.09-8.72.76-1.31 2.11-2.14 3.58-2.16 1.11-.02 2.16.75 2.84.75.68 0 1.95-.92 3.29-.79.56.02 2.13.23 3.14 1.7-.08.05-1.87 1.1-1.85 3.27M14.2 4.84c.6-.73 1.01-1.74.9-2.75-.87.03-1.92.58-2.55 1.31-.56.64-1.05 1.67-.92 2.66.97.07 1.96-.49 2.57-1.22" />
    </svg>
  );
}

export function SocialAuth({ onSuccess, demoEmail }: SocialAuthProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const googleReady = useRef(false);

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setBusy("google");
      setError(null);
      try {
        onSuccess(await api.oauthGoogle(idToken));
      } catch {
        setError("Google sign-in failed.");
      } finally {
        setBusy(null);
      }
    },
    [onSuccess],
  );

  // Initialize Google Identity Services once its script has loaded.
  const initGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || googleReady.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => void handleGoogleCredential(resp.credential),
    });
    googleReady.current = true;
  }, [handleGoogleCredential]);

  useEffect(() => {
    initGoogle();
  }, [initGoogle]);

  async function signInGoogle() {
    if (GOOGLE_CLIENT_ID) {
      initGoogle();
      window.google?.accounts.id.prompt();
      return;
    }
    // Sandbox: no client id configured — use a demo identity.
    await handleGoogleCredential(`mock:google:${demoEmail || "google.user@insightxi.dev"}`);
  }

  async function signInApple() {
    setError(null);
    setBusy("apple");
    try {
      if (APPLE_CLIENT_ID && window.AppleID) {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: "name email",
          redirectURI: `${window.location.origin}/account`,
          usePopup: true,
        });
        const res = await window.AppleID.auth.signIn();
        const name = res.user?.name
          ? `${res.user.name.firstName ?? ""} ${res.user.name.lastName ?? ""}`.trim()
          : undefined;
        onSuccess(await api.oauthApple(res.authorization.id_token, name || undefined));
      } else {
        // Sandbox: no client id configured — use a demo identity.
        onSuccess(await api.oauthApple(`mock:apple:${demoEmail || "apple.user@insightxi.dev"}`));
      }
    } catch {
      setError("Apple sign-in failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex col gap-10">
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogle}
        />
      )}
      {APPLE_CLIENT_ID && (
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="afterInteractive"
        />
      )}

      <button
        type="button"
        onClick={signInGoogle}
        disabled={busy !== null}
        className="btn social-btn"
        aria-label="Continue with Google"
      >
        <GoogleMark />
        <span>{busy === "google" ? "Connecting…" : "Continue with Google"}</span>
      </button>

      <button
        type="button"
        onClick={signInApple}
        disabled={busy !== null}
        className="btn social-btn apple"
        aria-label="Continue with Apple"
      >
        <AppleMark />
        <span>{busy === "apple" ? "Connecting…" : "Continue with Apple"}</span>
      </button>

      {error && <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>}
    </div>
  );
}
