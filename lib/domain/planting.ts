export type PlantingPlanStatus = {
  id: number;
  code: string;
  name: string;
};

/** planting_plan_statuses.id from seed (4xx) — stable; do not look up by code/name. */
export const PLANTING_PLAN_STATUS_PENDING_ID = 401; // pending / ต้องทำ
export const PLANTING_PLAN_STATUS_DONE_ID = 402; // done / เสร็จ

export type PlantingPlanItem = {
  key: string;
  type: string;
  title: string;
  statusId: number;
  date: string;
  dateKind: "actual" | "planned" | string;
  plotId: string;
  plotName: string;
  plantingId: string;
  varietyName: string;
  note?: string;
};

export type PlantingPlan = {
  items: PlantingPlanItem[];
  statuses: PlantingPlanStatus[];
  pendingCount: number;
};

export function formatThaiDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
