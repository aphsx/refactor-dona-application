import { apiRequest } from "@/lib/api/client";
import type { Plot, PlotCard, PlotCreateInput } from "@/lib/domain";

export async function listMyPlots(farmerId: string) {
  const data = await apiRequest<{ items: Plot[] }>(`/plots?farmerId=${encodeURIComponent(farmerId)}&page=1&pageSize=100`);
  return data.items ?? [];
}

export async function listGroupPlots(groupId: string) {
  const data = await apiRequest<{ items: Plot[] }>(`/plots?groupId=${encodeURIComponent(groupId)}&page=1&pageSize=100`);
  return data.items ?? [];
}

/** Fast farmer-app plot list (no boundary GeoJSON). scope: mine | group */
export async function getMyPlots(scope: "mine" | "group" = "mine") {
  const data = await apiRequest<{ items: PlotCard[]; scope: string }>(
    `/plots/me?scope=${encodeURIComponent(scope)}`,
  );
  return data.items ?? [];
}

export async function getPlot(id: string) {
  return apiRequest<Plot>(`/plots/${encodeURIComponent(id)}`);
}

export async function createPlot(input: PlotCreateInput) {
  return apiRequest<Plot>("/plots", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function measurePlotArea(polygon: number[][]) {
  return apiRequest<{ areaRai: number; areaSqm: number }>("/plots/measure-area", {
    method: "POST",
    body: JSON.stringify({ polygon }),
  });
}
