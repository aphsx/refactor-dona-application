"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  apiMessage,
  cartTotalSatang,
  formatBahtFromSatang,
  getShopCart,
  listShopProducts,
  upsertShopCartItem,
  type ShopCart,
  type ShopProduct,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ShopPage() {
  const { session } = useAuth();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c] = await Promise.all([listShopProducts(), getShopCart()]);
      setProducts(p.items ?? []);
      setCart(c);
    } catch (err) {
      setError(apiMessage(err));
      setProducts([]);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void load();
  }, [session, load]);

  async function addToCart(product: ShopProduct) {
    setBusyId(product.id);
    setError("");
    try {
      const existing = cart?.items?.find((it) => it.productId === product.id)?.qty ?? 0;
      const next = await upsertShopCartItem(product.id, existing + 1);
      setCart(next);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusyId("");
    }
  }

  const cartCount = (cart?.items ?? []).reduce((n, it) => n + it.qty, 0);

  return (
    <div className="relative min-h-full pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[200px] bg-[radial-gradient(120%_80%_at_10%_-10%,#1d8a6a_0%,#0f493b_55%,transparent_72%)]"
      />

      <header className="relative px-5 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-white/70 uppercase">dona</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight text-white">ร้านค้า</h1>
            <p className="mt-2 text-[14px] text-white/75">สั่งของ โอนเงิน แล้วอัปโหลดสลิป</p>
          </div>
          <Link
            href="/shop/cart"
            className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25"
            aria-label="ตะกร้า"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-brand-dark">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <section className="relative mt-5 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-brand-dark">สินค้า</h2>
          <Link href="/shop/orders" className="text-[13px] font-semibold text-brand">
            ประวัติออเดอร์
          </Link>
        </div>

        {error ? (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>
        ) : null}

        {loading ? <p className="text-[14px] text-brand-dark/50">กำลังโหลด…</p> : null}

        {!loading && products.length === 0 && !error ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-brand-dark/50 shadow-sm ring-1 ring-brand/10">
            ยังไม่มีสินค้าในร้าน
          </p>
        ) : null}

        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand/10">
              <div className="flex items-start gap-3">
                {p.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imagePath}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl object-cover bg-brand/5 ring-1 ring-brand/10"
                  />
                ) : null}
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold text-brand-dark">{p.name}</p>
                    {p.description ? (
                      <p className="mt-1 line-clamp-2 text-[13px] text-brand-dark/55">{p.description}</p>
                    ) : null}
                    <p className="mt-2 text-[15px] font-bold tabular-nums text-brand">
                      {formatBahtFromSatang(p.priceSatang)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-brand-dark/45">คงเหลือ {p.stockQty}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === p.id || p.stockQty <= 0}
                    onClick={() => void addToCart(p)}
                    className="shrink-0 rounded-xl bg-brand px-3 py-2 text-[13px] font-bold text-white disabled:opacity-40"
                  >
                    {p.stockQty <= 0 ? "หมด" : busyId === p.id ? "…" : "ใส่ตะกร้า"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {cartCount > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 px-5">
          <Link
            href="/shop/cart"
            className="mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-brand-dark px-4 py-3.5 text-white shadow-lg"
          >
            <span className="text-[14px] font-bold">{cartCount} รายการในตะกร้า</span>
            <span className="inline-flex items-center gap-1 text-[14px] font-bold">
              {formatBahtFromSatang(cartTotalSatang(cart))}
              <ChevronRight size={18} />
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
