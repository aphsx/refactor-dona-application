"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  apiMessage,
  cartTotalSatang,
  createShopOrder,
  deleteShopCartItem,
  formatBahtFromSatang,
  getShopCart,
  upsertShopCartItem,
  type ShopCart,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ShopCartPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCart(await getShopCart());
    } catch (err) {
      setError(apiMessage(err));
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void load();
  }, [session, load]);

  async function setQty(productId: string, qty: number) {
    setBusy(true);
    setError("");
    try {
      if (qty <= 0) {
        setCart(await deleteShopCartItem(productId));
      } else {
        setCart(await upsertShopCartItem(productId, qty));
      }
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const key = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
      const order = await createShopOrder(key);
      router.replace(`/shop/orders/${order.id}`);
    } catch (err) {
      setError(apiMessage(err));
      setBusy(false);
    }
  }

  const items = cart?.items ?? [];
  const total = cartTotalSatang(cart);

  return (
    <div className="relative min-h-full pb-28">
      <header className="flex items-center gap-3 px-4 pb-3 pt-6">
        <Link href="/shop" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-brand/10">
          <ArrowLeft size={20} className="text-brand-dark" />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-brand-dark">ตะกร้า</h1>
          <p className="text-[13px] text-brand-dark/55">{items.length} รายการ</p>
        </div>
      </header>

      <section className="px-5">
        {error ? (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>
        ) : null}
        {loading ? <p className="text-[14px] text-brand-dark/50">กำลังโหลด…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-brand-dark/50 shadow-sm ring-1 ring-brand/10">
            ตะกร้าว่าง —{" "}
            <Link href="/shop" className="font-bold text-brand">
              เลือกสินค้า
            </Link>
          </p>
        ) : null}

        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.productId} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brand-dark">{it.productName}</p>
                  <p className="mt-1 text-[14px] tabular-nums text-brand">{formatBahtFromSatang(it.priceSatang)}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void setQty(it.productId, 0)}
                  className="text-brand-dark/40"
                  aria-label="ลบ"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void setQty(it.productId, it.qty - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-tint text-brand-dark"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-8 text-center text-[15px] font-bold tabular-nums">{it.qty}</span>
                <button
                  type="button"
                  disabled={busy || it.qty >= it.stockQty}
                  onClick={() => void setQty(it.productId, it.qty + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-tint text-brand-dark disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
                <span className="ml-auto text-[14px] font-bold tabular-nums text-brand-dark">
                  {formatBahtFromSatang(it.priceSatang * it.qty)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 px-5">
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-4 shadow-lg ring-1 ring-brand/15">
            <div className="mb-3 flex items-center justify-between text-[14px]">
              <span className="text-brand-dark/60">ยอดรวม</span>
              <span className="font-bold tabular-nums text-brand-dark">{formatBahtFromSatang(total)}</span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void checkout()}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white disabled:opacity-50"
            >
              {busy ? "กำลังสั่งซื้อ…" : "สั่งซื้อ"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
