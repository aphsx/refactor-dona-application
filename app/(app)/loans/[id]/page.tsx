"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  apiMessage,
  cancelLoanApplication,
  formatThaiDate,
  getLoanApplication,
  isLoanDocumentRequired,
  LOAN_APPLICATION_STATUS_REVIEWING_ID,
  loanRequiredDocumentProgress,
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
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState("");

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
  const canCancel = item?.statusId === LOAN_APPLICATION_STATUS_REVIEWING_ID;

  async function onCancel() {
    if (!item) return;
    setActionBusy(true);
    setActionError("");
    try {
      await cancelLoanApplication(item.id);
      setConfirmCancel(false);
      router.replace("/loans");
    } catch (err) {
      setActionError(apiMessage(err));
      setConfirmCancel(false);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className={`min-h-full px-5 pt-6 ${canCancel ? "pb-28" : "pb-10"}`}>
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
              แนบแล้ว {progress.attached}/{progress.total} รายการที่จำเป็น
            </p>

            {actionError && (
              <p className="mt-3 text-[14px] font-semibold text-danger">{actionError}</p>
            )}

            <ul className="mt-4 space-y-3">
              {(item.documents ?? []).map((doc) => {
                const required = isLoanDocumentRequired(doc);
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
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {canCancel && (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand/10 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="mx-auto max-w-lg">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setConfirmCancel(true)}
                  className="flex h-12 w-full items-center justify-center rounded-2xl border border-danger/30 text-[15px] font-bold text-danger disabled:opacity-40"
                >
                  {actionBusy ? "กำลังยกเลิก…" : "ยกเลิกคำขอ"}
                </button>
              </div>
            </div>
          )}

          {confirmCancel && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-6 text-center shadow-lg">
                <p className="text-[16px] font-bold text-brand-dark">
                  ยืนยันยกเลิกคำขอที่รอการตรวจสอบ?
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setConfirmCancel(false)}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-brand/20 text-[15px] font-bold text-brand"
                  >
                    ไม่ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
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
