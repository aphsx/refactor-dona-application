"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiMessage, loginByLine } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  clearLineIdToken,
  ensureLiffLoggedIn,
  getLiffIdToken,
  isLiffConfigured,
  stashLineIdToken,
} from "@/lib/liff";

function LineEntry() {
  const { ready, session, setSession } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/loans";
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    if (session) {
      router.replace(next);
      return;
    }

    if (!isLiffConfigured()) {
      setError("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const loggedIn = await ensureLiffLoggedIn(
          typeof window !== "undefined" ? window.location.href : undefined,
        );
        if (!loggedIn || cancelled) return;

        const idToken = getLiffIdToken();
        if (!idToken) {
          setError("ไม่ได้รับสิทธิ์จาก LINE — ลองเปิดใหม่");
          return;
        }

        const result = await loginByLine(idToken);
        if (cancelled) return;

        if (result.status === "needs_link") {
          stashLineIdToken(idToken);
          router.replace(`/line/link?next=${encodeURIComponent(next)}`);
          return;
        }

        clearLineIdToken();
        setSession(result.session);
        router.replace(next);
      } catch (err) {
        if (!cancelled) setError(apiMessage(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, session, router, next, setSession]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center bg-brand-light px-6 py-10">
      <Image
        src="/dona-logo.png"
        alt="dona"
        width={160}
        height={54}
        className="h-12 w-auto object-contain"
        priority
      />
      <p className="mt-8 text-center text-[16px] font-semibold text-brand-dark">
        {error ? "เข้าสู่ระบบผ่าน LINE ไม่สำเร็จ" : "กำลังเข้าสู่ระบบผ่าน LINE…"}
      </p>
      {error && <p className="mt-3 text-center text-[14px] text-danger">{error}</p>}
      {!error && (
        <p className="mt-2 text-center text-[14px] text-brand-dark/55">กรุณารอสักครู่</p>
      )}
    </div>
  );
}

export default function LinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-brand-light text-brand-dark/60">
          กำลังโหลด…
        </div>
      }
    >
      <LineEntry />
    </Suspense>
  );
}
