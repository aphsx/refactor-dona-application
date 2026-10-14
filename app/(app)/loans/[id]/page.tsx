"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, FileUp, Send } from "lucide-react";
import {
  LoanConfirmDialog,
  LoanDangerOutlineButton,
  LoanPrimaryButton,
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
  LOAN_APPLICATION_STATUS_RETURNED_DOCS_ID,
  LOAN_APPLICATION_STATUS_REVIEWING_ID,
  loanRequiredDocumentProgress,
  resubmitLoanApplication,
  uploadLoanDocument,
  type LoanApplication,
  type LoanApplicationDocument,
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
  const [busyKindId, setBusyKindId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmResubmit, setConfirmResubmit] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
  const isReviewing = item?.statusId === LOAN_APPLICATION_STATUS_REVIEWING_ID;
  const isReturned = item?.statusId === LOAN_APPLICATION_STATUS_RETURNED_DOCS_ID;
  const canCancel = isReviewing || isReturned;
  const canEditDocs = isReturned;
  const requiredReady = progress.attached >= progress.total && progress.total > 0;
  const showSticky = canCancel || isReturned;

  function patchDoc(kindId: number, doc: LoanApplicationDocument) {
    setItem((current) => {
      if (!current) return current;
      return {
        ...current,
        documents: current.documents.map((row) =>
          row.kindId === kindId ? { ...row, ...doc } : row,
        ),
      };
    });
  }

  async function onUpload(kindId: number, file: File) {
    if (!item) return;
    setBusyKindId(kindId);
    setActionError("");
    try {
      const doc = await uploadLoanDocument(item.id, kindId, file);
      patchDoc(kindId, doc);
    } catch (err) {
      setActionError(apiMessage(err));
    } finally {
      setBusyKindId(null);
    }
  }

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

  async function onResubmit() {
    if (!item) return;
    setActionBusy(true);
    setActionError("");
    try {
      const updated = await resubmitLoanApplication(item.id);
      setItem(updated);
      setConfirmResubmit(false);
    } catch (err) {
      setActionError(apiMessage(err));
      setConfirmResubmit(false);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className={`min-h-full px-5 pt-6 ${showSticky ? "pb-36" : "pb-10"}`}>
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

          {isReturned && (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <p className="text-[13px] font-bold text-amber-900">โรงสีขอให้แก้ไขเอกสาร</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] font-semibold text-amber-950">
                {item.reviewNote?.trim() || "กรุณาตรวจสอบและอัปโหลดเอกสารใหม่"}
              </p>
              {item.actedBy?.trim() && (
                <p className="mt-2 text-[12px] text-amber-900/70">
                  โดย {item.actedBy.trim()}
                  {item.actedAt ? ` · ${formatThaiDateTime(item.actedAt)}` : ""}
                </p>
              )}
              <p className="mt-2 text-[13px] text-amber-900/80">
                แก้เอกสารด้านล่างแล้วกดส่งใหม่เพื่อเข้าสู่รอการตรวจสอบอีกครั้ง
              </p>
            </div>
          )}

          {!isReturned && item.actedBy?.trim() && (
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
                const uploading = busyKindId === doc.kindId;
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
                          {uploading ? "กำลังอัปโหลด…" : doc.attached ? "แนบแล้ว" : "ยังไม่แนบ"}
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
                    {canEditDocs && (
                      <div className="mt-3">
                        <input
                          ref={(el) => {
                            fileRefs.current[doc.kindId] = el;
                          }}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) void onUpload(doc.kindId, file);
                          }}
                        />
                        <button
                          type="button"
                          disabled={actionBusy || busyKindId != null}
                          onClick={() => fileRefs.current[doc.kindId]?.click()}
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand/15 bg-brand-light px-3 text-[14px] font-bold text-brand disabled:opacity-40"
                        >
                          <FileUp size={16} />
                          {doc.attached ? "อัปโหลดใหม่" : "แนบไฟล์"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {showSticky && (
            <LoanStickyBar>
              {isReturned && (
                <LoanPrimaryButton
                  disabled={actionBusy || busyKindId != null || !requiredReady}
                  onClick={() => setConfirmResubmit(true)}
                >
                  <Send size={18} />
                  ส่งเอกสารใหม่
                </LoanPrimaryButton>
              )}
              {canCancel && (
                <LoanDangerOutlineButton
                  disabled={actionBusy || busyKindId != null}
                  onClick={() => setConfirmCancel(true)}
                >
                  ยกเลิกคำขอ
                </LoanDangerOutlineButton>
              )}
            </LoanStickyBar>
          )}

          {confirmCancel && (
            <LoanConfirmDialog
              danger
              title="ยืนยันยกเลิกคำขอ?"
              body={
                isReturned
                  ? "คำขอนี้ถูกตีกลับเอกสาร — ยกเลิกแล้วกู้คืนไม่ได้"
                  : "คำขอนี้อยู่ในสถานะรอการตรวจสอบ — ยกเลิกแล้วกู้คืนไม่ได้"
              }
              confirmLabel="ยืนยันยกเลิก"
              cancelLabel="ยังไม่ยกเลิก"
              busy={actionBusy}
              onCancel={() => {
                if (!actionBusy) setConfirmCancel(false);
              }}
              onConfirm={() => void onCancel()}
            />
          )}

          {confirmResubmit && (
            <LoanConfirmDialog
              title="ส่งเอกสารใหม่?"
              body="คำขอจะกลับไปสถานะรอการตรวจสอบให้โรงสีตรวจอีกครั้ง"
              confirmLabel="ยืนยันส่งใหม่"
              cancelLabel="ยังก่อน"
              busy={actionBusy}
              onCancel={() => {
                if (!actionBusy) setConfirmResubmit(false);
              }}
              onConfirm={() => void onResubmit()}
            />
          )}
        </>
      )}
    </div>
  );
}
