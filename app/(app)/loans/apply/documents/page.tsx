"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Upload } from "lucide-react";
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

  const requiredAttached = useMemo(
    () => [...LOAN_REQUIRED_DOCUMENT_KIND_IDS].filter((id) => Boolean(files[id])).length,
    [files],
  );
  const requiredReady = requiredAttached >= LOAN_REQUIRED_DOCUMENT_KIND_IDS.size;
  const detailsReady =
    nationalIdDigits(details.nationalId).length === 13 &&
    Number(details.amount.replace(/,/g, "")) > 0;

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
        requestedAmount: Number(details.amount.replace(/,/g, "")),
        purpose: details.purpose.trim(),
      });

      for (const kind of LOAN_DOCUMENT_KINDS) {
        const file = files[kind.kindId];
        if (!file) continue;
        await uploadLoanDocument(created.id, kind.kindId, file);
      }

      clear();
      router.replace(`/loans/${created.id}`);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!detailsReady) {
    return (
      <div className="min-h-full px-5 pb-10 pt-6">
        <p className="text-[14px] text-brand-dark/50">กำลังกลับไปกรอกรายละเอียด…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full px-5 pb-28 pt-6">
      <Link
        href="/loans/apply"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand"
      >
        <ArrowLeft size={18} />
        กลับแก้รายละเอียด
      </Link>

      <h1 className="mt-5 text-[26px] font-bold text-brand-dark">แนบเอกสาร</h1>
      <p className="mt-1 text-[14px] text-brand-dark/55">
        แนบให้ครบ แล้วกดส่งเอกสาร — จะเข้าสู่รอการตรวจสอบทันที
      </p>

      <div className="mt-5 flex gap-2 text-[13px] font-semibold">
        <span className="text-brand-dark/40">1. รายละเอียด</span>
        <span className="text-brand-dark/30">→</span>
        <span className="text-brand">2. เอกสาร + ส่ง</span>
      </div>

      <p className="mt-6 text-[13px] text-brand-dark/50">
        จำเป็น {requiredAttached}/{LOAN_REQUIRED_DOCUMENT_KIND_IDS.size}
      </p>

      {error && <p className="mt-3 text-[14px] font-semibold text-danger">{error}</p>}

      <ul className="mt-4 space-y-3">
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
                  <p className="mt-1 truncate text-[13px] text-brand-dark/55">
                    {file ? file.name : "ยังไม่เลือกไฟล์"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {file && <CheckCircle2 className="text-brand" size={22} />}
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[13px] font-bold text-white has-[:disabled]:opacity-50">
                    <Upload size={16} />
                    {file ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand/10 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          {!requiredReady && (
            <p className="mb-2 text-center text-[12px] font-semibold text-brand-dark/55">
              แนบเอกสารจำเป็นให้ครบก่อนส่ง
            </p>
          )}
          <button
            type="button"
            disabled={busy || !requiredReady}
            onClick={() => void submitAll()}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white disabled:bg-brand/35"
          >
            {busy ? "กำลังส่งเอกสาร…" : "ส่งเอกสาร"}
          </button>
        </div>
      </div>
    </div>
  );
}
