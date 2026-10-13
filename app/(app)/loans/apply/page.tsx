"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiMessage, createLoanApplication } from "@/lib/api";

function formatNationalId(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  if (digits.length <= 10) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
  }
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
}

export default function LoanApplyPage() {
  const router = useRouter();
  const [nationalId, setNationalId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-full px-5 pb-10 pt-6">
      <Link
        href="/loans"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand"
      >
        <ArrowLeft size={18} />
        กลับ
      </Link>

      <h1 className="mt-4 text-[26px] font-bold text-brand-dark">ขอสินเชื่อ</h1>
      <p className="mt-1 text-[14px] text-brand-dark/55">กรอกข้อมูลคำขอ แล้วอัปโหลดเอกสารในขั้นถัดไป</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setError("");
            try {
              const requestedAmount = Number(amount.replace(/,/g, ""));
              if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
                throw new Error("กรุณาระบุจำนวนเงิน");
              }
              const created = await createLoanApplication({
                nationalId: nationalId.replace(/\D/g, ""),
                requestedAmount,
                purpose: purpose.trim(),
              });
              router.replace(`/loans/${created.id}`);
            } catch (err) {
              setError(apiMessage(err));
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <label className="block">
          <span className="text-[13px] font-semibold text-brand-dark/70">เลขบัตรประชาชน</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            placeholder="X-XXXX-XXXXX-XX-X"
            value={nationalId}
            onChange={(event) => setNationalId(formatNationalId(event.target.value))}
            className="mt-1 h-12 w-full rounded-xl border border-brand/15 bg-white px-3 text-[15px] outline-none focus:border-brand/35"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-brand-dark/70">จำนวนเงินที่ขอ (บาท)</span>
          <input
            inputMode="decimal"
            placeholder="เช่น 50000"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
            className="mt-1 h-12 w-full rounded-xl border border-brand/15 bg-white px-3 text-[15px] outline-none focus:border-brand/35"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-brand-dark/70">วัตถุประสงค์</span>
          <textarea
            rows={3}
            placeholder="เช่น ซื้อปุ๋ย / เครื่องจักร"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand/15 bg-white px-3 py-3 text-[15px] outline-none focus:border-brand/35"
          />
        </label>

        {error && <p className="text-[14px] font-semibold text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy || nationalId.replace(/\D/g, "").length !== 13 || !amount}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white disabled:bg-brand/35"
        >
          {busy ? "กำลังส่งคำขอ…" : "ส่งคำขอ แล้วแนบเอกสาร"}
        </button>
      </form>
    </div>
  );
}
