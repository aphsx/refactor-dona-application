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

/** Where to send logged-out users: LINE/LIFF when configured, else phone login. */
export function authEntryPath(next?: string) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return isLiffConfigured() ? `/line${q}` : `/login${q}`;
}

function liffErrorMessage(err: unknown, liffId: string) {
  const raw =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message)
      : err instanceof Error
        ? err.message
        : String(err ?? "");
  const lower = raw.toLowerCase();
  if (lower.includes("channel not found") || lower.includes("invalid liff id")) {
    return (
      `LINE ไม่รู้จัก LIFF นี้ (channel not found). ` +
      `ตรวจว่า NEXT_PUBLIC_LIFF_ID ตรงกับ LIFF ในช่อง LINE Login ` +
      `และกด Redeploy หลังแก้ env (ค่า NEXT_PUBLIC_* ถูกใส่ตอน build). ` +
      `LIFF ที่แอปใช้ตอนนี้: ${liffId}`
    );
  }
  return raw || "เริ่ม LIFF ไม่สำเร็จ";
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
        throw new Error(liffErrorMessage(err, liffId));
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
