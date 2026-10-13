import { apiRequest } from "@/lib/api/client";
import type { NamePrefix } from "@/lib/domain";

export async function listNamePrefixes() {
  const data = await apiRequest<{ items: NamePrefix[] }>("/name-prefixes");
  return data.items ?? [];
}
