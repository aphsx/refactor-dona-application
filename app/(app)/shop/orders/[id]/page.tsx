"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiMessage,
  cancelMyShopOrder,
  formatBahtFromSatang,
  getMyShopOrder,
  getShopPayoutAccount,
  uploadShopSlip,
  type ShopOrder,
  type ShopPayoutAccount,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ShopOrderDetailPage() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const fileRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [payout, setPayout] = useState<ShopPayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const [o, p] = await Promise.all([
        getMyShopOrder(orderId),
        getShopPayoutAccount().catch(() => null),
      ]);
      setOrder(o);
      setPayout(p);
    } catch (err) {
      setError(apiMessage(err));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!session) return;
    void load();
  }, [session, load]);

  async function onSlip(file: File | null) {
    if (!file || !orderId) return;
    setBusy(true);
    setError("");
    try {
      const next = await uploadShopSlip(orderId, file);
      setOrder(next);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onCancel() {
    if (!orderId || !confirm("ยกเลิกออเดอร์นี้?")) return;
    setBusy(true);
    setError("");
    try {
      const next = await cancelMyShopOrder(orderId);
      setOrder(next);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const canUpload =
    order?.paymentStatus?.code === "pending" || order?.paymentStatus?.code === "rejected";
  const canCancel =
    order?.paymentStatus?.code === "pending" || order?.paymentStatus?.code === "awaiting_review";

  return (
    <div className="relative min-h-full pb-10">
      <header className="flex items-center gap-3 px-4 pb-3 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-brand/10"
        >
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-brand-dark">รายละเอียดออเดอร์</h1>
          <p className="text-[13px] text-brand-dark/55">{order?.orderNumber ?? "…"}</p>
        </div>
      </header>

      <section className="space-y-4 px-5">
        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>
        ) : null}
        {loading ? <p className="text-[14px] text-brand-dark/50">กำลังโหลด…</p> : null}

        {order ? (
          <>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand/10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-brand-dark/55">สถานะชำระเงิน</span>
                <span className="rounded-full bg-card-tint px-2.5 py-0.5 text-[12px] font-bold text-brand-dark">
                  {order.paymentStatus.name}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[13px] text-brand-dark/55">จัดเตรียม</span>
                <span className="text-[13px] font-semibold text-brand-dark">{order.fulfillmentStatus.name}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-brand/10 pt-3">
                <span className="font-bold text-brand-dark">ยอดรวม</span>
                <span className="text-[16px] font-bold tabular-nums text-brand">
                  {formatBahtFromSatang(order.totalSatang)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand/10">
              <h2 className="text-[15px] font-bold text-brand-dark">รายการ</h2>
              <ul className="mt-2 space-y-2">
                {order.items?.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3 text-[14px]">
                    <span className="text-brand-dark">
                      {it.productName} × {it.qty}
                    </span>
                    <span className="tabular-nums text-brand-dark/70">
                      {formatBahtFromSatang(it.unitPriceSatang * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {(canUpload || order.paymentStatus.code === "awaiting_review") && payout ? (
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand/10">
                <h2 className="text-[15px] font-bold text-brand-dark">โอนเงินมาที่</h2>
                <dl className="mt-2 space-y-1 text-[14px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-dark/55">ธนาคาร</dt>
                    <dd className="font-semibold text-brand-dark">{payout.bankName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-dark/55">ชื่อบัญชี</dt>
                    <dd className="font-semibold text-brand-dark">{payout.accountName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-dark/55">เลขบัญชี</dt>
                    <dd className="font-bold tabular-nums text-brand-dark">{payout.accountNumber}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {order.slipPath ? (
              <a
                href={order.slipPath}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl bg-white px-4 py-3 text-center text-[14px] font-bold text-brand shadow-sm ring-1 ring-brand/10"
              >
                ดูสลิปที่อัปโหลด
              </a>
            ) : null}

            {canUpload ? (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void onSlip(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white disabled:opacity-50"
                >
                  {busy ? "กำลังอัปโหลด…" : order.paymentStatus.code === "rejected" ? "อัปโหลดสลิปใหม่" : "อัปโหลดสลิป"}
                </button>
              </div>
            ) : null}

            {canCancel ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCancel()}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-danger text-[14px] font-bold text-danger disabled:opacity-50"
              >
                ยกเลิกออเดอร์
              </button>
            ) : null}

            <Link href="/shop" className="block text-center text-[13px] font-semibold text-brand">
              กลับหน้าร้านค้า
            </Link>
          </>
        ) : null}
      </section>
    </div>
  );
}
