"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL_PUBLIC } from "../services/api-client";
import type { LiveSnapshot } from "../lib/types";

/**
 * Shared live-match feed. A single websocket is multiplexed across every
 * consumer (ticker, dashboard, live page) and refcounted so it closes when
 * the last subscriber unmounts.
 */
let socket: Socket | null = null;
let refs = 0;
let lastSnap: LiveSnapshot | null = null;
let connected = false;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function ensureSocket() {
  if (socket) return;
  socket = io(API_URL_PUBLIC, { transports: ["websocket"] });
  socket.on("connect", () => {
    connected = true;
    socket?.emit("subscribe");
    emitChange();
  });
  socket.on("disconnect", () => {
    connected = false;
    emitChange();
  });
  socket.on("live:update", (s: LiveSnapshot) => {
    lastSnap = s;
    emitChange();
  });
}

export interface LiveFeed {
  snapshot: LiveSnapshot | null;
  connected: boolean;
}

export function useLive(): LiveFeed {
  const [, force] = useState(0);

  useEffect(() => {
    refs += 1;
    ensureSocket();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
      refs -= 1;
      if (refs <= 0 && socket) {
        socket.close();
        socket = null;
        lastSnap = null;
        connected = false;
      }
    };
  }, []);

  return { snapshot: lastSnap, connected };
}
