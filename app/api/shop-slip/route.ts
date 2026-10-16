import { NextRequest, NextResponse } from "next/server";
import { getApiOrigin } from "@/lib/env";

/** Reuse loan-documents public bucket; path prefix keeps shop slips separate. */
const BUCKET = "loan-documents";
const MAX_BYTES = 8_000_000;

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY ยังไม่ได้ตั้งค่า");
  }
  return { url, key };
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไฟล์ไม่ถูกต้อง" }, { status: 400 });
  }

  const orderId = String(form.get("orderId") ?? "").trim();
  const file = form.get("file");
  if (!orderId || !(file instanceof File)) {
    return NextResponse.json({ error: "ต้องส่ง orderId และไฟล์" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (สูงสุด 8MB)" }, { status: 400 });
  }

  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะรูป JPEG / PNG / WebP" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const path = `shop-orders/${orderId}/${Date.now()}.${ext}`;

  let supabase: { url: string; key: string };
  try {
    supabase = supabaseConfig();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ตั้งค่า Storage ไม่ครบ" },
      { status: 500 },
    );
  }

  const upload = await fetch(`${supabase.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: supabase.key,
      Authorization: `Bearer ${supabase.key}`,
      "Content-Type": file.type,
      "x-upsert": "true",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!upload.ok) {
    const detail = await upload.text().catch(() => "");
    return NextResponse.json(
      { error: detail.slice(0, 300) || "อัปโหลดสลิปไม่สำเร็จ" },
      { status: upload.status >= 400 ? upload.status : 502 },
    );
  }

  const storagePath = `${supabase.url}/storage/v1/object/public/${BUCKET}/${path}`;
  const apiOrigin = getApiOrigin();
  const save = await fetch(`${apiOrigin}/api/v1/shop/orders/${encodeURIComponent(orderId)}/slip`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ storagePath }),
  });
  const body = await save.json().catch(() => ({}));
  if (!save.ok) {
    return NextResponse.json(
      { error: typeof body?.error === "string" ? body.error : "บันทึกสลิปไม่สำเร็จ" },
      { status: save.status },
    );
  }

  return NextResponse.json(body);
}
