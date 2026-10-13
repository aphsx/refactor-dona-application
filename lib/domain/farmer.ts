export type Farmer = {
  id: string;
  firstName: string;
  lastName: string;
  tel: string; // may be "" for LINE-first accounts
  address: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  groupId: string | null;
  deliveredKg: number;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FarmerSession = {
  token: string;
  tel: string;
  displayName: string;
  role: "member" | "leader";
  farmerId: string;
  farmer: Farmer;
};

export type FarmerRegisterInput = {
  firstName: string;
  lastName: string;
  tel: string;
  address: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
};

export type FarmerUpdateInput = {
  firstName: string;
  lastName: string;
  tel: string;
  address: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  groupId: string | null;
};

export function farmerDisplayName(farmer: Pick<Farmer, "firstName" | "lastName">) {
  return `${farmer.firstName} ${farmer.lastName}`.trim() || "—";
}

export function formatTelInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
