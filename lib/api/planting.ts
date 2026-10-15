import { apiRequest } from "@/lib/api/client";
import type { PlantingPlan } from "@/lib/domain";

export async function getMyPlantingPlan(opts?: { plotId?: string; farmerId?: string }) {
  const params = new URLSearchParams();
  if (opts?.plotId) params.set("plotId", opts.plotId);
  if (opts?.farmerId) params.set("farmerId", opts.farmerId);
  const qs = params.toString();
  return apiRequest<PlantingPlan>(`/planting-plan${qs ? `?${qs}` : ""}`);
}
