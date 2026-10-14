"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, FileUp, Send } from "lucide-react";
import {
  LoanConfirmDialog,
  LoanPrimaryButton,
  LoanProgress,
  formatBaht,
} from "@/components/loan-ui";
import {
  apiMessage,
  createLoanApplication,
  nationalIdDigits,
  uploadLoanDocument,
} from "@/lib/api";
import { LOAN_DOCUMENT_KINDS, LOAN_REQUIRED_DOCUMENT_KIND_IDS } from "@/lib/domain";
import { useLoanApply } from "@/lib/loan-apply-context";

export default function LoanApplyDocumentsPage() {
  const router = useRouter();
  const { details, files, setFile, clear } = useLoanApply();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const requiredAttached = useMemo(
    () => [...LOAN_REQUIRED_DOCUMENT_KIND_IDS].filter((id) => Boolean(files[id])).length,
    [files],
  );
  const requiredReady = requiredAttached >= LOAN_REQUIRED_DOCUMENT_KIND_IDS.size;
  const amount = Number(details.amount.replace(/,/g, ""));
  const detailsReady =
    nationalIdDigits(details.nationalId).length === 13 && Number.isFinite(amount) && amount > 0;

  useEffect(() => {
    if (!detailsReady) router.replace("/loans/apply");
  }, [detailsReady, router]);

  async function submitAll() {
    setBusy(true);
    setError("");
    try {
      if (!detailsReady) throw new Error("กรุณากรอกรายละเอียดให้ครบก่อน");
      if (!requiredReady) throw new Error("กรุณาแนบเอกสารที่จำเป็นให้ครบก่อนส่ง");

      const created = await createLoanApplication({
        nationalId: nationalIdDigits(details.nationalId),
        requestedAmount: amount,
        purpose: details.purpose.trim(),
      });

      for (const kind of LOAN_DOCUMENT_KINDS) {
        const file = files[kind.kindId];
        if (!file) continue;
        await uploadLoanDocument(created.id, kind.kindId, file);
      }

      clear();
      setConfirmSend(false);
      router.replace(`/loans/${created.id}`);
    } catch (err) {
      setError(apiMessage(err));
      setConfirmSend(false);
    } finally {
      setBusy(false);
    }
  }

  if (!detailsReady) {
    return (
      <div className="flex min-h-full items-center justify-center px-5 text-[14px] text-brand-dark/50">
        กำลังกลับไปกรอกรายละเอียด…
      </div>
    );
  }

  return (
    <div className="min-h-full px-5 pb-10 pt-6">
      <Link
        href="/loans/apply"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand"
      >
        <ArrowLeft size={18} />
        กลับ
      </Link>

      <h1 className="mt-5 text-[26px] font-bold text-brand-dark">แนบเอกสาร</h1>
      <p className="mt-1 text-[14px] text-brand-dark/55">
        ขั้นตอน 2/2 — ขอ {formatBaht(amount)} บาท
      </p>

      <div className="mt-4 flex gap-2">
        <span className="h-1.5 flex-1 rounded-full bg-brand" />
        <span className="h-1.5 flex-1 rounded-full bg-brand" />
      </div>

      <div className="mt-6 space-y-4">
        <LoanProgress attached={requiredAttached} total={LOAN_REQUIRED_DOCUMENT_KIND_IDS.size} />

        <ul className="space-y-3">
          {LOAN_DOCUMENT_KINDS.map((kind) => {
            const file = files[kind.kindId] ?? null;
            return (
              <li
                key={kind.kindId}
                className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-brand/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-brand-dark">
                      {kind.name}
                      {kind.required && <span className="text-danger"> *</span>}
                    </p>
                    <p className="mt-1 truncate text-[13px] text-brand-dark/50">
                      {file ? file.name : kind.required ? "ยังไม่เลือก (จำเป็น)" : "ไม่บังคับ"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {file ? (
                      <CheckCircle2 className="text-brand" size={22} />
                    ) : (
                      <span className="h-5 w-5 rounded-full border-2 border-brand/20" />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[12px] font-bold text-white has-[:disabled]:opacity-50">
                      <FileUp size={14} />
                      {file ? "เปลี่ยน" : "เลือกไฟล์"}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={busy}
                        onChange={(event) => {
                          const next = event.target.files?.[0] ?? null;
                          event.target.value = "";
                          setFile(kind.kindId, next);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">
            {error}
          </p>
        )}
        {!requiredReady && !error && (
          <p className="text-center text-[13px] font-semibold text-brand-dark/45">
            แนบเอกสารจำเป็นให้ครบก่อนส่ง
          </p>
        )}

        <LoanPrimaryButton
          tone="brand"
          disabled={busy || !requiredReady}
          onClick={() => setConfirmSend(true)}
        >
          <Send size={18} />
          ส่งเอกสาร
        </LoanPrimaryButton>
      </div>

      {confirmSend && (
        <LoanConfirmDialog
          title="ยืนยันส่งคำขอสินเชื่อ?"
          body={`จำนวน ${formatBaht(amount)} บาท จะเข้าสู่สถานะรอการตรวจสอบทันที`}
          confirmLabel="ยืนยันส่ง"
          busy={busy}
          onCancel={() => {
            if (!busy) setConfirmSend(false);
          }}
          onConfirm={() => void submitAll()}
        />
      )}
    </div>
  );
}
