export type Plot = {
  id: string;
  farmerId: string;
  name: string;
  areaRai: number;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  previewUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  polygon: number[][];
};

/** Lean plot row from GET /me/plots (no GeoJSON). */
export type PlotCard = {
  id: string;
  farmerId: string;
  name: string;
  areaRai: number;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  previewUrl?: string | null;
  hasBoundary: boolean;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PlotCreateInput = {
  farmerId: string;
  name: string;
  areaRai: number;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  polygon?: number[][];
};

export function formatAreaRai(totalRai: number): string {
  if (!totalRai || totalRai <= 0) return "-";
  let fullRai = Math.floor(totalRai);
  let ngan = Math.round((totalRai - fullRai) * 4);
  if (ngan === 4) {
    fullRai += 1;
    ngan = 0;
  }
  return `${fullRai} ไร่${ngan > 0 ? ` ${ngan} งาน` : ""}`;
}
