import { apiRequest, getAccessToken } from "@/lib/api/client";
import type {
  LoanApplication,
  LoanApplicationCreateInput,
  LoanApplicationDocument,
} from "@/lib/domain";
import { compressLoanDocument } from "@/lib/loan-document";

type LoanPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export function listMyLoanApplications(query: { page?: number; pageSize?: number } = {}) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 20),
  });
  return apiRequest<LoanPage<LoanApplication>>(`/loans/applications/me?${params}`);
}

export function getLoanApplication(id: string) {
  return apiRequest<LoanApplication>(`/loans/applications/${encodeURIComponent(id)}`);
}

export function createLoanApplication(input: LoanApplicationCreateInput) {
  return apiRequest<LoanApplication>("/loans/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function setLoanApplicationDocumentStorage(
  applicationId: string,
  kindId: number,
  storagePath: string,
) {
  return apiRequest<LoanApplicationDocument>(
    `/loans/applications/${encodeURIComponent(applicationId)}/documents/${kindId}`,
    { method: "POST", body: JSON.stringify({ storagePath }) },
  );
}

/** Upload PDF/image via Next → Supabase (`loan-documents`), then save public URL. */
export async function uploadLoanDocument(applicationId: string, kindId: number, file: File) {
  const token = getAccessToken();
  if (!token) throw new Error("ต้องเข้าสู่ระบบก่อน");

  const prepared = await compressLoanDocument(file);

  const form = new FormData();
  form.set("applicationId", applicationId);
  form.set("kindId", String(kindId));
  form.set("file", prepared);

  const response = await fetch("/api/loan-document", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "อัปโหลดเอกสารไม่สำเร็จ");
  }
  return body as LoanApplicationDocument;
}
