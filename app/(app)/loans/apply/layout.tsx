"use client";

import { formatNationalId } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LoanApplyProvider } from "@/lib/loan-apply-context";

export default function LoanApplyLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const initialNationalId = formatNationalId(
    session?.farmer?.nationalId || session?.nationalId || "",
  );

  return <LoanApplyProvider initialNationalId={initialNationalId}>{children}</LoanApplyProvider>;
}
