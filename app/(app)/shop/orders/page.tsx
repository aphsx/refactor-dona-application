"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { apiMessage, formatBahtFromSatang, listMyShopOrders, type ShopOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ShopOrdersPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void listMyShopOrders()
      .then((data) => setItems(data.items ?? []))
      .catch((err) => {
        setError(apiMessage(err));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="relative min-h-full pb-10">
      <header className="flex items-center gap-3 px-4 pb-3 pt-6">
        <Link href="/shop" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-brand/10">
          <ArrowLeft size={20} className="text-brand-dark" />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-brand-dark">ออเดอร์ของฉัน</h1>
          <p className="text-[13px] text-brand-dark/55">{loading ? "กำลังโหลด…" : `${items.length} รายการ`}</p>
        </div>
      </header>

      <section className="px-5">
        {error ? (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>
        ) : null}
        {!loading && items.length === 0 && !error ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-brand-dark/50 shadow-sm ring-1 ring-brand/10">
            ยังไม่มีออเดอร์
          </p>
        ) : null}
        <ul className="space-y-3">
          {items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/shop/orders/${o.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-brand/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brand-dark">{o.orderNumber}</p>
                  <p className="mt-1 text-[13px] text-brand-dark/55">
                    {o.paymentStatus.name} · {formatBahtFromSatang(o.totalSatang)}
                  </p>
                </div>
                <ChevronRight size={18} className="text-brand-dark/35" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
