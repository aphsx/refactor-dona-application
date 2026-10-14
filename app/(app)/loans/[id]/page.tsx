"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Upload } from "lucide-react";
import {
  apiMessage,
  cancelLoanApplication,
  formatThaiDate,
  getLoanApplication,
  isLoanDocumentRequired,
  LOAN_APPLICATION_STATUS_PREPARING_ID,
  LOAN_APPLICATION_STATUS_REVIEWING_ID,
  loanRequiredDocumentProgress,
  submitLoanApplication,
  uploadLoanDocument,
  type LoanApplication,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function formatBaht(value: number) {
  return Number(value).toLocaleString("th-TH");
}

export default function LoanDetailPage() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [item, setItem] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKind, setBusyKind] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [actionBusy, setActionBusy] = useState<"submit" | "cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!session || !id) return;
    setLoading(true);
    setError("");
    void getLoanApplication(id)
      .then(setItem)
      .catch((err) => {
        setError(apiMessage(err));
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [session, id]);

  const progress = loanRequiredDocumentProgress(item?.documents ?? []);
  const statusId = item?.statusId ?? 0;
  const isPreparing = statusId === LOAN_APPLICATION_STATUS_PREPARING_ID;
  const isReviewing = statusId === LOAN_APPLICATION_STATUS_REVIEWING_ID;
  const canUpload = isPreparing;
  const canSubmit = isPreparing && progress.attached >= progress.total && progress.total > 0;
  const canCancel = isPreparing || isReviewing;
  const anyBusy = busyKind != null || actionBusy != null;

  async function onSubmit() {
    if (!item) return;
    setActionBusy("submit");
    setUploadError("");
    try {
      const updated = await submitLoanApplication(item.id);
      setItem(updated);
    } catch (err) {
      setUploadError(apiMessage(err));
    } finally {
      setActionBusy(null);
    }
  }

  async function onCancel() {
    if (!item) return;
    setActionBusy("cancel");
    setUploadError("");
    try {
      const updated = await cancelLoanApplication(item.id);
      setConfirmCancel(false);
      setItem(updated);
      router.replace("/loans");
    } catch (err) {
      setUploadError(apiMessage(err));
      setConfirmCancel(false);
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className={`min-h-full px-5 pt-6 ${canSubmit || canCancel ? "pb-32" : "pb-10"}`}>
      <Link
        href="/loans"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand"
      >
        <ArrowLeft size={18} />
        คำขอของฉัน
      </Link>

      {loading && <p className="mt-8 text-[14px] text-brand-dark/50">กำลังโหลด…</p>}
      {!loading && error && <p className="mt-8 text-[14px] font-semibold text-danger">{error}</p>}

      {!loading && item && (
        <>
          <header className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-bold text-brand-dark">
                {formatBaht(item.requestedAmount)} บาท
              </h1>
              <span className="rounded-lg bg-brand-light px-2.5 py-1 text-[12px] font-semibold text-brand">
                {item.status?.name || "—"}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-brand-dark/55">
              ยื่นเมื่อ {formatThaiDate(item.submittedOn?.slice(0, 10) || "")}
            </p>
            {item.purpose?.trim() && (
              <p className="mt-2 text-[15px] text-brand-dark/80">{item.purpose}</p>
            )}
          </header>

          <section className="mt-8">
            <h2 className="text-[16px] font-bold text-brand-dark">เอกสารประกอบ</h2>
            <p className="mt-0.5 text-[13px] text-brand-dark/50">
              {canUpload
                ? `แนบ PDF หรือรูป (บีบอัตโนมัติ) · จำเป็น ${progress.attached}/${progress.total}`
                : `แนบแล้ว ${progress.attached}/${progress.total} รายการที่จำเป็น`}
            </p>

            {uploadError && (
              <p className="mt-3 text-[14px] font-semibold text-danger">{uploadError}</p>
            )}

            <ul className="mt-4 space-y-3">
              {(item.documents ?? []).map((doc) => {
                const required = isLoanDocumentRequired(doc);
                const busy = busyKind === doc.kindId;
                return (
                  <li
                    key={doc.kindId}
                    className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-brand/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-brand-dark">
                          {doc.name}
                          {required && <span className="text-danger"> *</span>}
                        </p>
                        <p className="mt-1 text-[13px] text-brand-dark/55">
                          {doc.attached ? "แนบแล้ว" : "ยังไม่แนบ"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {doc.attached && <CheckCircle2 className="text-brand" size={22} />}
                        {doc.attached && doc.storagePath?.startsWith("http") && (
                          <a
                            href={doc.storagePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] font-bold text-brand underline-offset-2 hover:underline"
                          >
                            ดูไฟล์
                          </a>
                        )}
                        {canUpload && !doc.attached && (
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[13px] font-bold text-white has-[:disabled]:opacity-50">
                            <Upload size={16} />
                            {busy ? "กำลังอัป…" : "แนบไฟล์"}
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png,image/webp"
                              className="sr-only"
                              disabled={anyBusy}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (!file) return;
                                void (async () => {
                                  setBusyKind(doc.kindId);
                                  setUploadError("");
                                  try {
                                    const updated = await uploadLoanDocument(
                                      item.id,
                                      doc.kindId,
                                      file,
                                    );
                                    setItem((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            documents: prev.documents.map((d) =>
                                              d.kindId === doc.kindId ? { ...d, ...updated } : d,
                                            ),
                                          }
                                        : prev,
                                    );
                                  } catch (err) {
                                    setUploadError(apiMessage(err));
                                  } finally {
                                    setBusyKind(null);
                                  }
                                })();
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {(canSubmit || canCancel) && (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand/10 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="mx-auto flex max-w-lg flex-col gap-3">
                {isPreparing && !canSubmit && (
                  <p className="text-center text-[12px] font-semibold text-brand-dark/55">
                    แนบเอกสารจำเป็นให้ครบก่อนส่ง
                  </p>
                )}
                {isPreparing && (
                  <button
                    type="button"
                    disabled={anyBusy || !canSubmit}
                    onClick={() => void onSubmit()}
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white disabled:bg-brand/35"
                  >
                    {actionBusy === "submit" ? "กำลังส่งเอกสาร…" : "ส่งเอกสาร"}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    disabled={anyBusy}
                    onClick={() => setConfirmCancel(true)}
                    className="flex h-12 w-full items-center justify-center rounded-2xl border border-danger/30 text-[15px] font-bold text-danger disabled:opacity-40"
                  >
                    {actionBusy === "cancel" ? "กำลังยกเลิก…" : "ยกเลิกคำขอ"}
                  </button>
                )}
              </div>
            </div>
          )}

          {confirmCancel && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-6 text-center shadow-lg">
                <p className="text-[16px] font-bold text-brand-dark">
                  {isReviewing
                    ? "ยืนยันยกเลิกคำขอที่รอการตรวจสอบ?"
                    : "ยืนยันยกเลิกคำขอนี้?"}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={anyBusy}
                    onClick={() => setConfirmCancel(false)}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-brand/20 text-[15px] font-bold text-brand"
                  >
                    ไม่ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={anyBusy}
                    onClick={() => void onCancel()}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-danger text-[15px] font-bold text-white"
                  >
                    ยืนยันยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
