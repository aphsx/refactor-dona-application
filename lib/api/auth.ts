import { apiRequest, setSession } from "@/lib/api/client";
import type { FarmerRegisterInput, FarmerSession } from "@/lib/domain";

function toSession(data: FarmerSession): FarmerSession {
  const session: FarmerSession = {
    token: data.token,
    nationalId: data.nationalId ?? data.farmer?.nationalId ?? "",
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

export async function loginByNationalId(nationalId: string) {
  const data = await apiRequest<FarmerSession>("/auth/login/national-id", {
    method: "POST",
    body: JSON.stringify({ nationalId: nationalId.replace(/\D/g, "") }),
  });
  return toSession(data);
}

export type LineLoginResult =
  | { status: "ok"; session: FarmerSession }
  | { status: "not_found" };

/** LIFF id_token login. Never auto-creates — new users get not_found → register form. */
export async function loginByLine(idToken: string, createIfMissing = false): Promise<LineLoginResult> {
  const data = await apiRequest<FarmerSession | { status: string }>("/auth/line", {
    method: "POST",
    body: JSON.stringify({ idToken, createIfMissing }),
  });
  if (isFarmerSession(data)) return { status: "ok", session: toSession(data) };
  return { status: "not_found" };
}

/** Bind LINE user (from id_token) to an existing farmer matched by national ID. */
export async function linkLineAccount(idToken: string, nationalId: string) {
  const data = await apiRequest<FarmerSession>("/auth/line/link", {
    method: "POST",
    body: JSON.stringify({
      idToken,
      nationalId: nationalId.replace(/\D/g, ""),
    }),
  });
  return toSession(data);
}

/** Self-register then receive the same session shape as national-id login. */
export async function registerFarmer(input: FarmerRegisterInput) {
  const data = await apiRequest<FarmerSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      nationalId: input.nationalId.replace(/\D/g, ""),
    }),
  });
  return toSession(data);
}

/** Full farmer register + bind LINE (same required fields as mill /auth/register). */
export async function registerFarmerWithLine(idToken: string, input: FarmerRegisterInput) {
  const data = await apiRequest<FarmerSession>("/auth/register/line", {
    method: "POST",
    body: JSON.stringify({
      idToken,
      ...input,
      nationalId: input.nationalId.replace(/\D/g, ""),
    }),
  });
  return toSession(data);
}
