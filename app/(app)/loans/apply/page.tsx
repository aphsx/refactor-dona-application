"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatNationalId, nationalIdDigits } from "@/lib/api";
import { useLoanApply } from "@/lib/loan-apply-context";

export default function LoanApplyPage() {
  const router = useRouter();
  const { details, setDetails } = useLoanApply();
  const [error, setError] = useState("");

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
      <p className="mt-1 text-[14px] text-brand-dark/55">
        กรอกรายละเอียด แล้วแนบเอกสารให้ครบก่อนกดส่งครั้งเดียว
      </p>

      <div className="mt-5 flex gap-2 text-[13px] font-semibold">
        <span className="text-brand">1. รายละเอียด</span>
        <span className="text-brand-dark/30">→</span>
        <span className="text-brand-dark/40">2. เอกสาร + ส่ง</span>
      </div>

      <form
        className="mt-8 space-y-4"
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
        <label className="block">
          <span className="text-[13px] font-semibold text-brand-dark/70">เลขบัตรประชาชน</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            placeholder="X-XXXX-XXXXX-XX-X"
            value={details.nationalId}
            onChange={(event) =>
              setDetails({ ...details, nationalId: formatNationalId(event.target.value) })
            }
            className="mt-1 h-12 w-full rounded-xl border border-brand/15 bg-white px-3 text-[15px] outline-none focus:border-brand/35"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-brand-dark/70">จำนวนเงินที่ขอ (บาท)</span>
          <input
            inputMode="decimal"
            placeholder="เช่น 50000"
            value={details.amount}
            onChange={(event) =>
              setDetails({ ...details, amount: event.target.value.replace(/[^\d.]/g, "") })
            }
            className="mt-1 h-12 w-full rounded-xl border border-brand/15 bg-white px-3 text-[15px] outline-none focus:border-brand/35"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-brand-dark/70">วัตถุประสงค์</span>
          <textarea
            rows={3}
            placeholder="เช่น ซื้อปุ๋ย / เครื่องจักร"
            value={details.purpose}
            onChange={(event) => setDetails({ ...details, purpose: event.target.value })}
            className="mt-1 w-full rounded-xl border border-brand/15 bg-white px-3 py-3 text-[15px] outline-none focus:border-brand/35"
          />
        </label>

        {error && <p className="text-[14px] font-semibold text-danger">{error}</p>}

        <button
          type="submit"
          disabled={nationalIdDigits(details.nationalId).length !== 13 || !details.amount}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white disabled:bg-brand/35"
        >
          ถัดไป — แนบเอกสาร
        </button>
      </form>
    </div>
  );
}
