import type { FarmerSession } from "@/lib/domain";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const BASE = "/api/v1";
const SESSION_KEY = "dona.farmer.session";

let accessToken = "";

export function getAccessToken() {
  return accessToken;
}

export function getSession(): FarmerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FarmerSession;
  } catch {
    return null;
  }
}

export function setSession(session: FarmerSession) {
  accessToken = session.token;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  accessToken = "";
  sessionStorage.removeItem(SESSION_KEY);
}

export function restoreSession() {
  const session = getSession();
  if (!session?.token) {
    clearSession();
    return null;
  }
  accessToken = session.token;
  return session;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (ตรวจว่า API รันที่ :8080)", 0);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/login/phone" &&
      path !== "/auth/register"
    ) {
      clearSession();
    }
    const message =
      typeof body?.error === "string"
        ? body.error
        : response.status >= 500
          ? "เซิร์ฟเวอร์มีปัญหา (มักเพราะ API :8080 ยังไม่รัน)"
          : "เกิดข้อผิดพลาด";
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export function apiMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
}
