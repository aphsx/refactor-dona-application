export type Farmer = {
  id: string;
  prefixId: number | null;
  prefixName?: string;
  firstName: string;
  lastName: string;
  /** DB generated: firstName + lastName (no prefix). */
  fullName?: string;
  nationalId: string;
  dateOfBirth: string; // YYYY-MM-DD
  farmerNumber?: string;
  tel?: string; // legacy; omit on new records
  address: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  groupId: string | null;
  groupName?: string;
  plotCount?: number;
  deliveredKg?: number;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FarmerSession = {
  token: string;
  nationalId: string;
  displayName: string;
  role: "member" | "leader";
  farmerId: string;
  farmer: Farmer;
};

export type FarmerRegisterInput = {
  prefixId: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  farmerNumber?: string;
  address: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
};

export type FarmerUpdateInput = {
  prefixId: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  farmerNumber?: string;
  address: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  groupId: string | null;
};

export type NamePrefix = {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export function farmerDisplayName(
  farmer: Pick<Farmer, "firstName" | "lastName" | "prefixName" | "fullName">,
) {
  const base = (farmer.fullName?.trim() || `${farmer.firstName} ${farmer.lastName}`.trim());
  if (!base) return "—";
  const prefix = farmer.prefixName?.trim();
  return prefix ? `${prefix}${base}` : base;
}

/** Format Thai national ID for display: X-XXXX-XXXXX-XX-X (max 13 digits). */
export function formatNationalId(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
  }
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
}
