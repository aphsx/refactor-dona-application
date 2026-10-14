"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type LoanApplyDetails = {
  nationalId: string;
  amount: string;
  purpose: string;
};

type LoanApplyContextValue = {
  details: LoanApplyDetails;
  setDetails: (next: LoanApplyDetails) => void;
  files: Record<number, File | null>;
  setFile: (kindId: number, file: File | null) => void;
  clear: () => void;
};

const LoanApplyContext = createContext<LoanApplyContextValue | null>(null);

const emptyDetails: LoanApplyDetails = {
  nationalId: "",
  amount: "",
  purpose: "",
};

export function LoanApplyProvider({
  children,
  initialNationalId = "",
}: {
  children: ReactNode;
  initialNationalId?: string;
}) {
  const [details, setDetails] = useState<LoanApplyDetails>({
    ...emptyDetails,
    nationalId: initialNationalId,
  });
  const [files, setFiles] = useState<Record<number, File | null>>({});

  const value = useMemo<LoanApplyContextValue>(
    () => ({
      details,
      setDetails,
      files,
      setFile: (kindId, file) => {
        setFiles((current) => ({ ...current, [kindId]: file }));
      },
      clear: () => {
        setDetails({ ...emptyDetails, nationalId: initialNationalId });
        setFiles({});
      },
    }),
    [details, files, initialNationalId],
  );

  return <LoanApplyContext.Provider value={value}>{children}</LoanApplyContext.Provider>;
}

export function useLoanApply() {
  const ctx = useContext(LoanApplyContext);
  if (!ctx) throw new Error("useLoanApply ต้องอยู่ภายใต้ LoanApplyProvider");
  return ctx;
}
