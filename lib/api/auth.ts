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

export async function loginByPhone(tel: string) {
  const data = await apiRequest<FarmerSession>("/auth/login/phone", {
    method: "POST",
    body: JSON.stringify({ tel }),
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
