import { apiRequest, getAccessToken, ApiError } from "@/lib/api/client";
import { nationalIdDigits, type Farmer, type FarmerUpdateInput } from "@/lib/domain";

export async function listGroupFarmers(groupId: string) {
  const data = await apiRequest<{ items: Farmer[] }>(
    `/farmers?groupId=${encodeURIComponent(groupId)}&page=1&pageSize=100`,
  );
  return data.items ?? [];
}

export async function getFarmer(id: string) {
  return apiRequest<Farmer>(`/farmers/${id}`);
}

export async function updateFarmer(id: string, input: FarmerUpdateInput) {
  return apiRequest<Farmer>(`/farmers/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...input,
      nationalId: nationalIdDigits(input.nationalId),
    }),
  });
}

export async function setFarmerAvatar(id: string, avatarUrl: string) {
  return apiRequest<Farmer>(`/farmers/${id}/avatar`, {
    method: "PUT",
    body: JSON.stringify({ avatarUrl }),
  });
}

/** Upload a pre-compressed avatar via Next.js → Supabase Storage, then save URL. */
export async function uploadFarmerAvatar(farmerId: string, file: Blob) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new ApiError("ต้องเข้าสู่ระบบก่อน", 401);
  const form = new FormData();
  form.append("farmerId", farmerId);
  form.append("file", file, "profile.webp");

  let response: Response;
  try {
    response = await fetch("/api/avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
  } catch {
    throw new ApiError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", 0);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      typeof body?.error === "string" ? body.error : "อัปโหลดรูปไม่สำเร็จ",
      response.status,
    );
  }
  return body as Farmer;
}

export async function getGroup(id: string) {
  return apiRequest<{ id: string; name: string; leaderId: string }>(`/groups/${id}`);
}
