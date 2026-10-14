"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IdCard } from "lucide-react";
import { apiMessage, formatNationalId, loginByNationalId } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shouldUseLiffAuth } from "@/lib/liff";

function LoginForm() {
  const { session, ready, setSession } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/home";
  const forceDirect = search.get("phone") === "1" || search.get("direct") === "1";
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lineReady = shouldUseLiffAuth();

  useEffect(() => {
    if (ready && session) router.replace(next);
  }, [ready, session, router, next]);

  // Prefer LINE only when this origin matches the LIFF Endpoint (not localhost).
  useEffect(() => {
    if (!ready || session || !lineReady || forceDirect) return;
    router.replace(`/line?next=${encodeURIComponent(next)}`);
  }, [ready, session, lineReady, forceDirect, router, next]);

  if (lineReady && !forceDirect) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-lg items-center justify-center bg-brand-light px-6 py-10 text-brand-dark/60">
        กำลังพาไปเข้าสู่ระบบด้วย LINE…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg items-center justify-center bg-brand-light px-6 py-10">
      <div className="w-full">
        <div className="flex flex-col items-center">
          <Image
            src="/dona-logo.png"
            alt="dona"
            width={180}
            height={60}
            className="h-14 w-auto object-contain"
            priority
          />
          <h1 className="mt-6 text-center text-[28px] font-bold text-brand-dark">ยินดีต้อนรับ</h1>
          <p className="mt-2 text-center text-[16px] text-brand-dark/70">
            ใส่เลขบัตรประชาชนเพื่อเข้าใช้งาน
          </p>
        </div>

        <form
          className="mt-10"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setBusy(true);
              setError("");
              try {
                const session = await loginByNationalId(nationalId);
                setSession(session);
                router.replace(next);
              } catch (err) {
                setError(apiMessage(err));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <label className="block">
            <span className="sr-only">เลขบัตรประชาชน</span>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-brand/15 bg-white px-4 shadow-sm">
              <IdCard size={20} className="text-brand/70" />
              <input
                autoFocus
                inputMode="numeric"
                autoComplete="off"
                placeholder="X-XXXX-XXXXX-XX-X"
                value={nationalId}
                onChange={(event) => setNationalId(formatNationalId(event.target.value))}
                className="h-full w-full bg-transparent text-[16px] text-brand-dark placeholder:text-brand-dark/35"
              />
            </div>
          </label>

          {error && <p className="mt-4 text-center text-[14px] font-semibold text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy || nationalId.replace(/\D/g, "").length !== 13}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white shadow disabled:bg-brand/35"
          >
            {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-8 text-center text-[14px] text-brand-dark/60">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-bold text-brand underline-offset-2 hover:underline">
            ลงทะเบียน
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-full items-center justify-center bg-brand-light">กำลังโหลด…</div>}>
      <LoginForm />
    </Suspense>
  );
}
