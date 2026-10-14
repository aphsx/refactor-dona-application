"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";
import {
  LoanConfirmDialog,
  LoanDangerOutlineButton,
  LoanProgress,
  LoanStickyBar,
  formatBaht,
  loanStatusTone,
} from "@/components/loan-ui";
import {
  apiMessage,
  cancelLoanApplication,
  formatThaiDate,
  formatThaiDateTime,
  getLoanApplication,
  isLoanDocumentRequired,
  LOAN_APPLICATION_STATUS_REVIEWING_ID,
  loanRequiredDocumentProgress,
  type LoanApplication,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
      {!loading && error && (
        <p className="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">
          {error}
        </p>
      )}

      {!loading && item && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-bold tabular-nums text-brand-dark">
              {formatBaht(item.requestedAmount)} บาท
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${loanStatusTone(item.status?.name || "")}`}
            >
              {item.status?.name || "—"}
            </span>
          </div>
          <p className="mt-1 text-[14px] text-brand-dark/55">
            ยื่นเมื่อ {formatThaiDate(item.submittedOn?.slice(0, 10) || "")}
          </p>
          {item.purpose?.trim() && (
            <p className="mt-2 text-[15px] text-brand-dark/80">{item.purpose}</p>
          )}
          {item.actedBy?.trim() && (
            <div className="mt-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-brand/10">
              <p className="text-[13px] font-bold text-brand-dark/55">ผลการดำเนินการ</p>
              <p className="mt-1 text-[15px] font-bold text-brand-dark">
                {item.status?.name || "ดำเนินการ"}โดย {item.actedBy.trim()}
              </p>
              {item.actedAt && (
                <p className="mt-0.5 text-[13px] text-brand-dark/55">
                  {formatThaiDateTime(item.actedAt)}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <LoanProgress attached={progress.attached} total={progress.total} />

            <h2 className="text-[16px] font-bold text-brand-dark">เอกสารประกอบ</h2>

            {actionError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">
                {actionError}
              </p>
            )}

            <ul className="space-y-3">
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
                        <p className="mt-1 text-[13px] text-brand-dark/50">
                          {doc.attached ? "แนบแล้ว" : "ยังไม่แนบ"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {doc.attached ? (
                          <CheckCircle2 className="text-brand" size={22} />
                        ) : (
                          <CircleAlert className="text-amber-500" size={22} />
                        )}
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
          </div>

          {canCancel && (
            <LoanStickyBar>
              <LoanDangerOutlineButton
                disabled={actionBusy}
                onClick={() => setConfirmCancel(true)}
              >
                ยกเลิกคำขอ
              </LoanDangerOutlineButton>
            </LoanStickyBar>
          )}

          {confirmCancel && (
            <LoanConfirmDialog
              danger
              title="ยืนยันยกเลิกคำขอ?"
              body="คำขอนี้อยู่ในสถานะรอการตรวจสอบ — ยกเลิกแล้วกู้คืนไม่ได้"
              confirmLabel="ยืนยันยกเลิก"
              cancelLabel="ยังไม่ยกเลิก"
              busy={actionBusy}
              onCancel={() => {
                if (!actionBusy) setConfirmCancel(false);
              }}
              onConfirm={() => void onCancel()}
            />
          )}
        </>
      )}
    </div>
  );
}
