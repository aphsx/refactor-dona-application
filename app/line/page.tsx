"use client";

import Image from "next/image";
import Link from "next/link";
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

type Phase = "boot" | "choose" | "error";

function LineEntry() {
  const { ready, session, setSession } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/home";
  const [phase, setPhase] = useState<Phase>("boot");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    if (session) {
      router.replace(next);
      return;
    }

    if (!isLiffConfigured()) {
      setError("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID");
      setPhase("error");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const loggedIn = await ensureLiffLoggedIn(
          typeof window !== "undefined" ? window.location.href : undefined,
        );
        if (!loggedIn || cancelled) return;

        const token = getLiffIdToken();
        if (!token) {
          setError("ไม่ได้รับสิทธิ์จาก LINE — ลองเปิดใหม่");
          setPhase("error");
          return;
        }

        // Existing LINE users enter immediately; new users choose how to register.
        const result = await loginByLine(token, false);
        if (cancelled) return;

        if (result.status === "ok") {
          clearLineIdToken();
          setSession(result.session);
          router.replace(next);
          return;
        }

        stashLineIdToken(token);
        setPhase("choose");
      } catch (err) {
        if (!cancelled) {
          setError(apiMessage(err));
          setPhase("error");
        }
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

      {phase === "boot" && (
        <>
          <p className="mt-8 text-center text-[16px] font-semibold text-brand-dark">
            กำลังเข้าสู่ระบบผ่าน LINE…
          </p>
          <p className="mt-2 text-center text-[14px] text-brand-dark/55">กรุณารอสักครู่</p>
        </>
      )}

      {phase === "choose" && (
        <div className="mt-8 w-full">
          <h1 className="text-center text-[24px] font-bold text-brand-dark">ยินดีต้อนรับ</h1>
          <p className="mt-2 text-center text-[14px] text-brand-dark/65">
            ยังไม่มีบัญชี — ลงทะเบียนด้วย LINE แล้วกรอกข้อมูลเกษตรกร หรือกรอกเองทั้งหมด
          </p>
          <Link
            href={`/register?via=line&next=${encodeURIComponent(next)}`}
            className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white shadow"
          >
            ลงทะเบียนด้วย LINE
          </Link>
          <Link
            href="/register"
            className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl border border-brand/20 bg-white text-[15px] font-bold text-brand"
          >
            ลงทะเบียน
          </Link>
          <p className="mt-6 text-center text-[13px] text-brand-dark/55">
            มีบัญชีจากเลขบัตรแล้ว?{" "}
            <Link
              href={`/line/link?next=${encodeURIComponent(next)}`}
              className="font-bold text-brand underline-offset-2 hover:underline"
            >
              ผูกบัญชีกับ LINE
            </Link>
          </p>
        </div>
      )}

      {phase === "error" && (
        <>
          <p className="mt-8 text-center text-[16px] font-semibold text-brand-dark">
            เข้าสู่ระบบผ่าน LINE ไม่สำเร็จ
          </p>
          {error && <p className="mt-3 text-center text-[14px] text-danger">{error}</p>}
          <button
            type="button"
            onClick={() => {
              setPhase("boot");
              setError("");
              window.location.reload();
            }}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white"
          >
            ลองใหม่
          </button>
        </>
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
