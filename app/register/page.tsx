"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  apiMessage,
  formatNationalId,
  listNamePrefixes,
  registerFarmer,
  registerFarmerWithLine,
  type NamePrefix,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  clearLineIdToken,
  ensureLiffLoggedIn,
  getLiffIdToken,
  getLiffProfileHint,
  peekLineIdToken,
  stashLineIdToken,
} from "@/lib/liff";
import {
  districtOptions,
  provinceOptions,
  subdistrictOptions,
} from "@/lib/thai-place";

function splitDisplayName(raw: string): { firstName: string; lastName: string } {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function RegisterForm() {
  const { session, ready, setSession } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const viaLine = search.get("via") === "line";
  const next = search.get("next") || "/home";

  const [prefixes, setPrefixes] = useState<NamePrefix[]>([]);
  const [prefixId, setPrefixId] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [farmerNumber, setFarmerNumber] = useState("");
  const [address, setAddress] = useState("");
  const [provinceId, setProvinceId] = useState(0);
  const [districtId, setDistrictId] = useState(0);
  const [subdistrictId, setSubdistrictId] = useState(0);
  const [linePicture, setLinePicture] = useState("");
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [lineReady, setLineReady] = useState(!viaLine);
  const [error, setError] = useState("");
  const [identityConflict, setIdentityConflict] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace(next);
  }, [ready, session, router, next]);

  useEffect(() => {
    void (async () => {
      try {
        const items = await listNamePrefixes();
        setPrefixes(items);
        if (items.length > 0) setPrefixId((current) => current || items[0].id);
      } catch {
        setPrefixes([
          { id: 601, name: "นาย" },
          { id: 602, name: "นาง" },
          { id: 603, name: "นางสาว" },
          { id: 604, name: "เด็กชาย" },
          { id: 605, name: "เด็กหญิง" },
        ]);
        setPrefixId((current) => current || 601);
      }
    })();
  }, []);

  useEffect(() => {
    if (!viaLine) return;
    let cancelled = false;
    void (async () => {
      try {
        const loggedIn = await ensureLiffLoggedIn(
          typeof window !== "undefined" ? window.location.href : undefined,
        );
        if (!loggedIn || cancelled) return;
        const token = getLiffIdToken() || peekLineIdToken();
        if (!token) {
          setError("ไม่พบสิทธิ์ LINE — กลับไปเปิดจาก LINE อีกครั้ง");
          setLineReady(false);
          return;
        }
        stashLineIdToken(token);
        const hint = await getLiffProfileHint();
        if (cancelled) return;
        if (hint) {
          setLineDisplayName(hint.displayName);
          setLinePicture(hint.pictureUrl);
          const split = splitDisplayName(hint.displayName);
          setFirstName((current) => current || split.firstName);
          setLastName((current) => current || split.lastName);
        }
        setLineReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(apiMessage(err));
          setLineReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viaLine]);

  const districts = useMemo(() => districtOptions(provinceId), [provinceId]);
  const subdistricts = useMemo(
    () => subdistrictOptions(provinceId, districtId),
    [provinceId, districtId],
  );

  const canSubmit =
    prefixId > 0 &&
    firstName.trim() &&
    lastName.trim() &&
    nationalId.replace(/\D/g, "").length === 13 &&
    dateOfBirth &&
    address.trim() &&
    provinceId > 0 &&
    districtId > 0 &&
    subdistrictId > 0 &&
    (!viaLine || lineReady);

  return (
    <div className="mx-auto min-h-full w-full max-w-lg bg-brand-light px-6 py-10">
      <div className="flex flex-col items-center">
        <Image
          src="/dona-logo.png"
          alt="dona"
          width={160}
          height={54}
          className="h-12 w-auto object-contain"
          priority
        />
        <h1 className="mt-5 text-center text-[26px] font-bold text-brand-dark">
          {viaLine ? "ลงทะเบียนด้วย LINE" : "ลงทะเบียนเกษตรกร"}
        </h1>
        <p className="mt-2 text-center text-[15px] text-brand-dark/70">
          {viaLine
            ? "LINE ผูกบัญชีให้ — กรอกข้อมูลเกษตรกรให้ครบเหมือนระบบจัดการ"
            : "กรอกข้อมูลเกษตรกรเพื่อสร้างบัญชีใหม่"}
        </p>
      </div>

      {viaLine && lineReady && (lineDisplayName || linePicture) && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-brand/15 bg-white px-4 py-3">
          {linePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={linePicture} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-[14px] font-bold text-brand">
              LINE
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-brand-dark">{lineDisplayName || "บัญชี LINE"}</p>
            <p className="text-[12px] text-brand-dark/55">จาก LINE — ตรวจชื่อด้านล่างให้ถูกต้อง</p>
          </div>
        </div>
      )}

      {viaLine && !lineReady && !error && (
        <p className="mt-6 text-center text-[14px] text-brand-dark/60">กำลังเชื่อม LINE…</p>
      )}

      <form
        className="mt-8 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit || busy) return;
          void (async () => {
            setBusy(true);
            setError("");
            try {
              const body = {
                prefixId,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                nationalId,
                dateOfBirth,
                farmerNumber: farmerNumber.trim() || undefined,
                address: address.trim(),
                provinceId,
                districtId,
                subdistrictId,
              };
              setIdentityConflict(false);
              const sessionNext = viaLine
                ? await registerFarmerWithLine(getLiffIdToken() || peekLineIdToken() || "", body)
                : await registerFarmer(body);
              if (viaLine) clearLineIdToken();
              setSession(sessionNext);
              router.replace(next);
            } catch (err) {
              setError(apiMessage(err));
              const conflict =
                viaLine &&
                err instanceof ApiError &&
                err.status === 409;
              setIdentityConflict(conflict);
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <SelectField
          label="คำนำหน้า"
          value={prefixId || ""}
          onChange={(value) => setPrefixId(Number(value) || 0)}
          options={prefixes.map((item) => ({ value: item.id, label: item.name }))}
          placeholder="เลือกคำนำหน้า"
          required
        />
        <Field label="ชื่อ" value={firstName} onChange={setFirstName} required />
        <Field label="นามสกุล" value={lastName} onChange={setLastName} required />
        <Field
          label="เลขบัตรประชาชน"
          value={nationalId}
          onChange={(value) => setNationalId(formatNationalId(value))}
          inputMode="numeric"
          placeholder="X-XXXX-XXXXX-XX-X"
          autoComplete="off"
          required
        />
        <Field
          label="วันเดือนปีเกิด"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          type="date"
          required
        />
        <Field label="เลขเกษตรกร" value={farmerNumber} onChange={setFarmerNumber} />
        <Field label="ที่อยู่" value={address} onChange={setAddress} required />

        <SelectField
          label="จังหวัด"
          value={provinceId || ""}
          onChange={(value) => {
            setProvinceId(Number(value) || 0);
            setDistrictId(0);
            setSubdistrictId(0);
          }}
          options={provinceOptions()}
          placeholder="เลือกจังหวัด"
          required
        />
        <SelectField
          label="อำเภอ"
          value={districtId || ""}
          disabled={!provinceId}
          onChange={(value) => {
            setDistrictId(Number(value) || 0);
            setSubdistrictId(0);
          }}
          options={districts}
          placeholder="เลือกอำเภอ"
          required
        />
        <SelectField
          label="ตำบล"
          value={subdistrictId || ""}
          disabled={!districtId}
          onChange={(value) => setSubdistrictId(Number(value) || 0)}
          options={subdistricts}
          placeholder="เลือกตำบล"
          required
        />

        <p className="rounded-2xl bg-white/70 px-3.5 py-3 text-[13px] leading-relaxed text-brand-dark/55">
          {viaLine
            ? "บันทึกแล้วจะผูก LINE กับบัญชีนี้ · องค์กรจัดกลุ่มให้ทีหลังได้"
            : "หลังลงทะเบียนจะเข้าใช้งานได้ทันที · องค์กรสามารถจัดกลุ่มให้ทีหลัง"}
        </p>

        {error && <p className="text-center text-[14px] font-semibold text-danger">{error}</p>}

        {identityConflict && (
          <Link
            href={`/line/link?next=${encodeURIComponent(next)}&nationalId=${encodeURIComponent(nationalId.replace(/\D/g, ""))}`}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-brand/20 bg-white text-[15px] font-bold text-brand"
          >
            ไปผูกบัญชีกับ LINE
          </Link>
        )}

        <button
          type="submit"
          disabled={busy || !canSubmit}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white shadow disabled:bg-brand/35"
        >
          {busy ? "กำลังลงทะเบียน…" : viaLine ? "บันทึกและเข้าใช้งาน" : "ลงทะเบียน"}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-brand-dark/60">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="font-bold text-brand underline-offset-2 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-brand-light text-brand-dark/60">
          กำลังโหลด…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  inputMode,
  placeholder,
  autoComplete,
  type,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  autoComplete?: string;
  type?: string;
}) {
  return (
    <label className="block text-[13px] font-bold text-brand-dark/70">
      {label}
      {required && <span className="text-danger"> *</span>}
      <input
        type={type || "text"}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-2xl border border-brand/15 bg-white px-4 text-[15px] font-normal text-brand-dark outline-none focus:border-brand/35"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  required,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-[13px] font-bold text-brand-dark/70">
      {label}
      {required && <span className="text-danger"> *</span>}
      <select
        className="mt-1 h-12 w-full rounded-2xl border border-brand/15 bg-white px-4 text-[15px] font-normal outline-none focus:border-brand/35 disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
