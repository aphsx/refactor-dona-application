"use client";

import Link from "next/link";
import { ChevronRight, FilePlus2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  apiMessage,
  formatThaiDate,
  listMyLoanApplications,
  loanRequiredDocumentProgress,
  type LoanApplication,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function formatBaht(value: number) {
  return Number(value).toLocaleString("th-TH");
}

export default function LoansPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError("");
    void listMyLoanApplications({ pageSize: 50 })
      .then((page) => setItems(page.items ?? []))
      .catch((err) => {
        setError(apiMessage(err));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="relative min-h-full pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(120%_80%_at_10%_-10%,#1d8a6a_0%,#0f493b_50%,transparent_72%)]"
      />

      <header className="relative px-5 pt-8">
        <p className="text-[12px] font-semibold tracking-[0.18em] text-white/70 uppercase">dona</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight text-white">สินเชื่อ</h1>
        <p className="mt-2 max-w-sm text-[14px] text-white/75">
          ยื่นคำขอและอัปโหลดเอกสารบนหน้านี้ — ไม่ต้องส่งในแชท
        </p>
      </header>

      <section className="relative mt-6 px-5">
        <Link
          href="/loans/apply"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-bold text-brand-dark shadow-[0_12px_28px_rgba(15,73,59,0.25)]"
        >
          <FilePlus2 size={20} />
          ขอสินเชื่อใหม่
        </Link>
      </section>

      <section className="relative mt-8 px-5">
        <h2 className="text-[16px] font-bold text-brand-dark">คำขอของฉัน</h2>
        {loading && <p className="mt-4 text-[14px] text-brand-dark/50">กำลังโหลด…</p>}
        {!loading && error && <p className="mt-4 text-[14px] font-semibold text-danger">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="mt-4 text-[14px] text-brand-dark/50">ยังไม่มีคำขอ — กดปุ่มด้านบนเพื่อเริ่ม</p>
        )}
        <ul className="mt-3 space-y-3">
          {items.map((row) => {
            const docs = loanRequiredDocumentProgress(row.documents ?? []);
            return (
              <li key={row.id}>
                <Link
                  href={`/loans/${row.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-brand/10"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[16px] font-bold text-brand-dark">
                        {formatBaht(row.requestedAmount)} บาท
                      </p>
                      <span className="shrink-0 rounded-lg bg-brand-light px-2 py-0.5 text-[12px] font-semibold text-brand">
                        {row.status?.name || "—"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-brand-dark/55">
                      {row.purpose?.trim() || "ไม่ระบุวัตถุประสงค์"} ·{" "}
                      {formatThaiDate(row.submittedOn?.slice(0, 10) || "")}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-brand-dark/70">
                      เอกสาร {docs.attached}/{docs.total}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-brand/50" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
