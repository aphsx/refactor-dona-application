export type LoanLookup = { id: number; code: string; name: string };

export type LoanApplicationDocument = {
  kindId: number;
  code: string;
  name: string;
  attached: boolean;
  required?: boolean;
  storagePath?: string | null;
};

/** Same required set as mill app / API seed (ทะเบียนสมรส optional). */
export const LOAN_REQUIRED_DOCUMENT_KIND_IDS = new Set([1101, 1102, 1104, 1105]);

export const LOAN_APPLICATION_STATUS_PREPARING_ID = 901;
export const LOAN_APPLICATION_STATUS_REVIEWING_ID = 902;
export const LOAN_APPLICATION_STATUS_CANCELLED_ID = 905;

export function isLoanDocumentRequired(doc: Pick<LoanApplicationDocument, "kindId" | "required">) {
  if (typeof doc.required === "boolean") return doc.required;
  return LOAN_REQUIRED_DOCUMENT_KIND_IDS.has(doc.kindId);
}

export function loanRequiredDocumentProgress(documents: LoanApplicationDocument[]) {
  const required = documents.filter((doc) => isLoanDocumentRequired(doc));
  return {
    attached: required.filter((doc) => doc.attached).length,
    total: required.length || LOAN_REQUIRED_DOCUMENT_KIND_IDS.size,
  };
}

export type LoanApplication = {
  id: string;
  farmerId: string | null;
  farmerName: string;
  tel: string;
  nationalId: string;
  requestedAmount: number;
  purpose: string;
  submittedOn: string;
  statusId: number;
  status: LoanLookup;
  documents: LoanApplicationDocument[];
};

export type LoanApplicationCreateInput = {
  requestedAmount: number;
  purpose: string;
  nationalId: string;
};
