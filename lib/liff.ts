"use client";

import liff from "@line/liff";

const ID_TOKEN_KEY = "dona.farmer.lineIdToken";

let initPromise: Promise<boolean> | null = null;

export function getLiffId() {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

export function isLiffConfigured() {
  return Boolean(getLiffId());
}

/**
 * LIFF Endpoint in LINE Console is production (e.g. donathai.online).
 * Opening localhost with that LIFF ID triggers a native "400 Bad Request" alert.
 */
export function isLiffEndpointCompatible() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return false;
  const endpoint = process.env.NEXT_PUBLIC_LIFF_ENDPOINT_ORIGIN?.trim();
  if (!endpoint) return true;
  try {
    return new URL(endpoint).origin === window.location.origin;
  } catch {
    return true;
  }
}

/** Prefer LINE only when LIFF is configured and this origin matches the Endpoint URL. */
export function shouldUseLiffAuth() {
  return isLiffConfigured() && isLiffEndpointCompatible();
}

/** Where to send logged-out users: LINE/LIFF when safe, else national-id login. */
export function authEntryPath(next?: string) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  if (shouldUseLiffAuth()) return `/line${q}`;
  // direct=1 skips the /line redirect on the login page
  return next ? `/login?direct=1&next=${encodeURIComponent(next)}` : "/login?direct=1";
}

/** Init LIFF once. Returns true when running inside a LIFF context. */
export async function ensureLiff(): Promise<boolean> {
  const liffId = getLiffId();
  if (!liffId) return false;
  if (!initPromise) {
    initPromise = liff
      .init({ liffId })
      .then(() => true)
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export async function ensureLiffLoggedIn(redirectUri?: string) {
  const ready = await ensureLiff();
  if (!ready) return false;
  if (!liff.isLoggedIn()) {
    liff.login(redirectUri ? { redirectUri } : undefined);
    return false;
  }
  return true;
}

export function getLiffIdToken(): string | null {
  if (!liff.isLoggedIn()) return null;
  const token = liff.getIDToken();
  return token?.trim() || null;
}

export function stashLineIdToken(idToken: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ID_TOKEN_KEY, idToken);
}

export function peekLineIdToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ID_TOKEN_KEY);
}

export function clearLineIdToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ID_TOKEN_KEY);
}

export type LiffProfileHint = {
  displayName: string;
  pictureUrl: string;
};

/** Best-effort LINE profile for pre-filling register form (user still confirms/edits). */
export async function getLiffProfileHint(): Promise<LiffProfileHint | null> {
  try {
    const ready = await ensureLiff();
    if (!ready || !liff.isLoggedIn()) return null;
    const profile = await liff.getProfile();
    return {
      displayName: profile.displayName?.trim() || "",
      pictureUrl: profile.pictureUrl?.trim() || "",
    };
  } catch {
    return null;
  }
}
