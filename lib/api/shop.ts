import { apiRequest, getAccessToken, ApiError } from "@/lib/api/client";

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  priceSatang: number;
  imagePath: string;
  stockQty: number;
  isActive: boolean;
};

export type ShopCartItem = {
  productId: string;
  productName: string;
  priceSatang: number;
  stockQty: number;
  isActive: boolean;
  qty: number;
};

export type ShopCart = {
  id: string;
  farmerId: string;
  items: ShopCartItem[];
  updatedAt: string;
};

export type ShopLookup = { id: number; code: string; name: string };

export type ShopOrderItem = {
  id: string;
  productId?: string | null;
  productName: string;
  unitPriceSatang: number;
  qty: number;
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  farmerId: string;
  totalSatang: number;
  paymentStatusId: number;
  paymentStatus: ShopLookup;
  fulfillmentStatusId: number;
  fulfillmentStatus: ShopLookup;
  paymentMethod: string;
  slipPath: string;
  items: ShopOrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type ShopPayoutAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
};

export function formatBahtFromSatang(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" });
}

export function listShopProducts() {
  return apiRequest<{ items: ShopProduct[] }>("/shop/products");
}

export function getShopProduct(id: string) {
  return apiRequest<ShopProduct>(`/shop/products/${encodeURIComponent(id)}`);
}

export function getShopPayoutAccount() {
  return apiRequest<ShopPayoutAccount>("/shop/payout-account");
}

export function getShopCart() {
  return apiRequest<ShopCart>("/shop/cart");
}

export function upsertShopCartItem(productId: string, qty: number) {
  return apiRequest<ShopCart>("/shop/cart/items", {
    method: "PUT",
    body: JSON.stringify({ productId, qty }),
  });
}

export function deleteShopCartItem(productId: string) {
  return apiRequest<ShopCart>(`/shop/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export function createShopOrder(idempotencyKey?: string) {
  const headers: Record<string, string> = {};
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return apiRequest<ShopOrder>("/shop/orders", { method: "POST", headers });
}

export function listMyShopOrders() {
  return apiRequest<{ items: ShopOrder[] }>("/shop/orders/me");
}

export function getMyShopOrder(id: string) {
  return apiRequest<ShopOrder>(`/shop/orders/${encodeURIComponent(id)}`);
}

export function cancelMyShopOrder(id: string) {
  return apiRequest<ShopOrder>(`/shop/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export async function uploadShopSlip(orderId: string, file: File) {
  const token = getAccessToken();
  if (!token) throw new ApiError("ต้องเข้าสู่ระบบก่อน", 401);

  const form = new FormData();
  form.set("orderId", orderId);
  form.set("file", file);

  const response = await fetch("/api/shop-slip", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(typeof body?.error === "string" ? body.error : "อัปโหลดสลิปไม่สำเร็จ", response.status);
  }
  return body as ShopOrder;
}

export function cartTotalSatang(cart: ShopCart | null | undefined) {
  return (cart?.items ?? []).reduce((sum, it) => sum + it.priceSatang * it.qty, 0);
}
