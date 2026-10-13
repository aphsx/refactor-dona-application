import { apiRequest, setSession } from "@/lib/api/client";
import type { FarmerRegisterInput, FarmerSession } from "@/lib/domain";

function toSession(data: FarmerSession): FarmerSession {
  const session: FarmerSession = {
    token: data.token,
    tel: data.tel,
    displayName: data.displayName,
    role: data.role,
    farmerId: data.farmerId,
    farmer: data.farmer,
  };
  setSession(session);
  return session;
}

function isFarmerSession(data: unknown): data is FarmerSession {
  return Boolean(data && typeof data === "object" && "token" in data && (data as FarmerSession).token);
}

export async function loginByPhone(tel: string) {
  const data = await apiRequest<FarmerSession>("/auth/login/phone", {
    method: "POST",
    body: JSON.stringify({ tel }),
  });
  return toSession(data);
}

/** LIFF id_token login. Returns session when linked, or needs_link. */
export async function loginByLine(idToken: string) {
  const data = await apiRequest<FarmerSession | { status: "needs_link" }>("/auth/line", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  if (isFarmerSession(data)) return { status: "linked" as const, session: toSession(data) };
  return { status: "needs_link" as const };
}

/** Bind LINE user (from id_token) to farmer matched by tel. */
export async function linkLineAccount(idToken: string, tel: string) {
  const data = await apiRequest<FarmerSession>("/auth/line/link", {
    method: "POST",
    body: JSON.stringify({ idToken, tel }),
  });
  return toSession(data);
}

/** Self-register then receive the same session shape as phone login. */
export async function registerFarmer(input: FarmerRegisterInput) {
  const data = await apiRequest<FarmerSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toSession(data);
}
