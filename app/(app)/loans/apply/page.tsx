"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  LoanField,
  LoanPrimaryButton,
  loanInputClass,
  loanTextareaClass,
} from "@/components/loan-ui";
import { formatNationalId, nationalIdDigits } from "@/lib/api";
import { useLoanApply } from "@/lib/loan-apply-context";

export default function LoanApplyPage() {
  const router = useRouter();
  const { details, setDetails } = useLoanApply();
  const [error, setError] = useState("");

  const ready =
    nationalIdDigits(details.nationalId).length === 13 && Boolean(details.amount.trim());

  return (
    <div className="min-h-full px-5 pb-10 pt-6">
      <Link
        href="/loans"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand"
      >
        <ArrowLeft size={18} />
        กลับ
      </Link>

      <h1 className="mt-5 text-[26px] font-bold text-brand-dark">ขอสินเชื่อ</h1>
      <p className="mt-1 text-[14px] text-brand-dark/55">ขั้นตอน 1/2 — กรอกรายละเอียด</p>

      <div className="mt-4 flex gap-2">
        <span className="h-1.5 flex-1 rounded-full bg-brand" />
        <span className="h-1.5 flex-1 rounded-full bg-brand/15" />
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const requestedAmount = Number(details.amount.replace(/,/g, ""));
          if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            setError("กรุณาระบุจำนวนเงิน");
            return;
          }
          if (nationalIdDigits(details.nationalId).length !== 13) {
            setError("เลขบัตรประชาชนต้องมี 13 หลัก");
            return;
          }
          router.push("/loans/apply/documents");
        }}
      >
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand/10">
          <LoanField label="เลขบัตรประชาชน">
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="X-XXXX-XXXXX-XX-X"
              value={details.nationalId}
              onChange={(event) =>
                setDetails({ ...details, nationalId: formatNationalId(event.target.value) })
              }
              className={loanInputClass}
            />
          </LoanField>

          <LoanField label="จำนวนเงินที่ขอ (บาท)">
            <input
              inputMode="decimal"
              placeholder="เช่น 50000"
              value={details.amount}
              onChange={(event) =>
                setDetails({ ...details, amount: event.target.value.replace(/[^\d.]/g, "") })
              }
              className={loanInputClass}
            />
          </LoanField>

          <LoanField label="วัตถุประสงค์ (ไม่บังคับ)">
            <textarea
              rows={3}
              placeholder="เช่น ซื้อปุ๋ย / เครื่องจักร"
              value={details.purpose}
              onChange={(event) => setDetails({ ...details, purpose: event.target.value })}
              className={loanTextareaClass}
            />
          </LoanField>
        </div>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">
            {error}
          </p>
        )}
        {!ready && !error && (
          <p className="text-center text-[13px] font-semibold text-brand-dark/45">
            กรอกเลขบัตรและจำนวนเงินก่อนไปขั้นถัดไป
          </p>
        )}

        <LoanPrimaryButton type="submit" disabled={!ready} tone="brand">
          ถัดไป — แนบเอกสาร
          <ArrowRight size={18} />
        </LoanPrimaryButton>
      </form>
    </div>
  );
}
