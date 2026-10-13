import { apiRequest, setSession } from "@/lib/api/client";
import type { FarmerRegisterInput, FarmerSession } from "@/lib/domain";

function toSession(data: FarmerSession): FarmerSession {
  const session: FarmerSession = {
    token: data.token,
    tel: data.tel ?? "",
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

export type LineLoginResult =
  | { status: "ok"; session: FarmerSession }
  | { status: "not_found" };

/** LIFF id_token login. createIfMissing=true auto-registers from LINE profile. */
export async function loginByLine(idToken: string, createIfMissing = true): Promise<LineLoginResult> {
  const data = await apiRequest<FarmerSession | { status: string }>("/auth/line", {
    method: "POST",
    body: JSON.stringify({ idToken, createIfMissing }),
  });
  if (isFarmerSession(data)) return { status: "ok", session: toSession(data) };
  return { status: "not_found" };
}

/** Bind LINE user (from id_token) to an existing farmer matched by tel. */
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
