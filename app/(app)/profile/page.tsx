"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  IdCard,
  LogOut,
  MapPinned,
  Pencil,
  Users,
  Weight,
  X,
} from "lucide-react";
import {
  apiMessage,
  farmerDisplayName,
  formatNationalId,
  getFarmer,
  getGroup,
  listNamePrefixes,
  updateFarmer,
  uploadFarmerAvatar,
  type Farmer,
  type NamePrefix,
} from "@/lib/api";
import { compressAvatar } from "@/lib/avatar";
import { useAuth } from "@/lib/auth";
import { authEntryPath } from "@/lib/liff";
import {
  districtOptions,
  placeLabel,
  provinceOptions,
  subdistrictOptions,
} from "@/lib/thai-place";

export default function ProfilePage() {
  const { session, setSession, logout } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(session?.farmer ?? null);
  const [groupName, setGroupName] = useState("—");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [notice, setNotice] = useState("");
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

  const canEdit = session?.role === "member" || session?.role === "leader";
  const roleLabel = session?.role === "leader" ? "หัวหน้ากลุ่ม" : "สมาชิก";
  const displayName =
    (farmer ? farmerDisplayName(farmer) : "") ||
    session?.displayName?.trim() ||
    "ผู้ใช้งาน";
  const avatarSrc = farmer?.avatarUrl || "/images/account-icon.png";
  const nationalIdDisplay = formatNationalId(
    farmer?.nationalId || session?.nationalId || "",
  );

  useEffect(() => {
    void listNamePrefixes()
      .then(setPrefixes)
      .catch(() => {
        setPrefixes([
          { id: 601, name: "นาย" },
          { id: 602, name: "นาง" },
          { id: 603, name: "นางสาว" },
          { id: 604, name: "เด็กชาย" },
          { id: 605, name: "เด็กหญิง" },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!session) return;
    const farmerId = session.farmerId;
    const current = session;
    void (async () => {
      try {
        const next = await getFarmer(farmerId);
        setFarmer(next);
        const nextName = farmerDisplayName(next);
        if (
          current.farmer.avatarUrl !== next.avatarUrl ||
          current.nationalId !== next.nationalId ||
          current.displayName !== nextName
        ) {
          setSession({
            ...current,
            displayName: nextName,
            nationalId: next.nationalId,
            farmer: next,
          });
        }
        if (next.groupId) {
          const group = await getGroup(next.groupId);
          setGroupName(group.name);
        } else {
          setGroupName(next.groupName || "ไม่มีกลุ่ม");
        }
      } catch (err) {
        setError(apiMessage(err));
      }
    })();
    // Intentionally only refetch when the logged-in farmer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.farmerId]);

  function startEdit() {
    if (!farmer) return;
    setPrefixId(farmer.prefixId ?? 0);
    setFirstName(farmer.firstName);
    setLastName(farmer.lastName);
    setNationalId(formatNationalId(farmer.nationalId));
    setDateOfBirth(farmer.dateOfBirth?.slice(0, 10) || "");
    setFarmerNumber(farmer.farmerNumber || "");
    setAddress(farmer.address);
    setProvinceId(farmer.provinceId);
    setDistrictId(farmer.districtId);
    setSubdistrictId(farmer.subdistrictId);
    setError("");
    setNotice("");
    setEditing(true);
  }

  async function onPickAvatar(file: File | undefined) {
    if (!session || !file) return;
    setAvatarBusy(true);
    setError("");
    setNotice("");
    try {
      const blob = await compressAvatar(file);
      const next = await uploadFarmerAvatar(session.farmerId, blob);
      setFarmer(next);
      setSession({
        ...session,
        farmer: next,
        displayName: farmerDisplayName(next),
        nationalId: next.nationalId,
      });
      setNotice("อัปเดตรูปโปรไฟล์แล้ว");
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const districts = useMemo(() => districtOptions(provinceId), [provinceId]);
  const subdistricts = useMemo(
    () => subdistrictOptions(provinceId, districtId),
    [provinceId, districtId],
  );

  return (
    <div className="relative min-h-full pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(120%_80%_at_10%_-10%,#1d8a6a_0%,#0f493b_50%,transparent_75%)]"
      />

      <header className="relative px-5 pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-white/70 uppercase">
              dona
            </p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-white">
              ข้อมูลส่วนตัว
            </h1>
          </div>
          {canEdit && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label="แก้ไข"
            >
              <Pencil size={18} />
            </button>
          )}
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label="ยกเลิก"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <section className="relative mt-5 px-5">
        <div className="rounded-[28px] border border-brand/[0.08] bg-white px-5 py-5 shadow-[0_16px_36px_rgba(15,73,59,0.12)]">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-[84px] w-[84px] overflow-hidden rounded-full bg-card-tint ring-4 ring-card-tint">
                <Image
                  src={avatarSrc}
                  alt=""
                  width={84}
                  height={84}
                  className="h-full w-full object-cover"
                  unoptimized={Boolean(farmer?.avatarUrl)}
                />
              </div>
              {canEdit && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-0.5 -right-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-brand text-white shadow-md disabled:bg-brand/40"
                  aria-label="เปลี่ยนรูปโปรไฟล์"
                >
                  <Camera size={15} />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-brand">บัญชีของคุณ</p>
              <p className="mt-0.5 truncate text-[22px] font-bold leading-tight text-brand-dark">
                {displayName}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-xl bg-card-tint px-2.5 py-1 text-[12px] font-semibold text-brand">
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-dark/55">
                  <IdCard size={13} />
                  {nationalIdDisplay || "—"}
                </span>
              </div>
              {canEdit && !editing && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="mt-3 inline-flex h-9 items-center rounded-xl bg-brand px-3.5 text-[13px] font-bold text-white"
                >
                  แก้ไขข้อมูล
                </button>
              )}
            </div>
          </div>
          {avatarBusy && (
            <p className="mt-3 text-[12px] font-semibold text-brand">กำลังอัปโหลดรูป…</p>
          )}
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(event) => void onPickAvatar(event.target.files?.[0])}
      />

      {!editing ? (
        <>
          <section className="relative mt-4 px-5">
            <div className="overflow-hidden rounded-[24px] border border-brand/[0.08] bg-white shadow-[0_10px_24px_rgba(15,73,59,0.06)]">
              <InfoRow icon={Users} label="กลุ่ม" value={groupName} />
              <InfoRow
                icon={MapPinned}
                label="ที่อยู่"
                value={farmer?.address || "—"}
              />
              <InfoRow
                icon={MapPinned}
                label="ตำบล / อำเภอ / จังหวัด"
                value={farmer ? placeLabel(farmer) : "—"}
              />
              <InfoRow
                icon={Weight}
                label="ส่งแล้ว"
                value={`${farmer?.deliveredKg ?? 0} กก.`}
                last
              />
            </div>
          </section>

          <section className="relative mt-4 px-5">
            <div className="overflow-hidden rounded-[24px] border border-brand/[0.08] bg-white shadow-[0_10px_24px_rgba(15,73,59,0.06)]">
              <DetailLine label="คำนำหน้า" value={farmer?.prefixName || "—"} />
              <DetailLine label="ชื่อ" value={farmer?.firstName || "—"} />
              <DetailLine label="นามสกุล" value={farmer?.lastName || "—"} />
              <DetailLine
                label="เลขบัตรประชาชน"
                value={nationalIdDisplay || "—"}
              />
              <DetailLine
                label="วันเดือนปีเกิด"
                value={farmer?.dateOfBirth?.slice(0, 10) || "—"}
              />
              <DetailLine
                label="เลขเกษตรกร"
                value={farmer?.farmerNumber || "—"}
                last
              />
            </div>
            <p className="mt-3 px-1 text-[12px] leading-relaxed text-brand-dark/45">
              แก้ได้: รูปโปรไฟล์ คำนำหน้า ชื่อ นามสกุล เลขบัตรประชาชน วันเดือนปีเกิด เลขเกษตรกร
              ที่อยู่ และที่ตั้ง · กลุ่ม/ยอดส่งแก้ไม่ได้จากแอปนี้
            </p>
          </section>
        </>
      ) : (
        <section className="relative mt-4 px-5">
          <form
            className="space-y-3 rounded-[24px] border border-brand/[0.08] bg-white p-5 shadow-[0_10px_24px_rgba(15,73,59,0.06)]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!session || !farmer || !prefixId || !dateOfBirth) return;
              if (nationalId.replace(/\D/g, "").length !== 13) {
                setError("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
                return;
              }
              void (async () => {
                setBusy(true);
                setError("");
                setNotice("");
                try {
                  const next = await updateFarmer(session.farmerId, {
                    prefixId,
                    firstName,
                    lastName,
                    nationalId,
                    dateOfBirth,
                    farmerNumber: farmerNumber.trim() || undefined,
                    address,
                    provinceId,
                    districtId,
                    subdistrictId,
                    groupId: farmer.groupId,
                  });
                  setFarmer(next);
                  setSession({
                    ...session,
                    nationalId: next.nationalId,
                    displayName: farmerDisplayName(next),
                    farmer: next,
                  });
                  setEditing(false);
                  setNotice("บันทึกแล้ว");
                } catch (err) {
                  setError(apiMessage(err));
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            <p className="text-[15px] font-bold text-brand-dark">แก้ไขข้อมูล</p>
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
              required
            />
            <Field
              label="วันเดือนปีเกิด"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              type="date"
              required
            />
            <Field
              label="เลขเกษตรกร"
              value={farmerNumber}
              onChange={setFarmerNumber}
            />
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

            <div className="rounded-2xl bg-brand-light px-3.5 py-3 text-[13px] text-brand-dark/60">
              กลุ่ม: <span className="font-semibold text-brand-dark">{groupName}</span> (แก้ไม่ได้)
            </div>

            {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white disabled:bg-brand/40"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </form>
        </section>
      )}

      {(notice || (error && !editing)) && (
        <p
          className={`relative mt-3 px-5 text-center text-[13px] font-semibold ${
            notice ? "text-brand" : "text-danger"
          }`}
        >
          {notice || error}
        </p>
      )}

      <section className="relative mt-6 px-5">
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace(authEntryPath());
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#E0B0B0] bg-[#FFF6F6] text-[15px] font-bold text-[#C34E4E] transition active:scale-[0.99]"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        last ? "" : "border-b border-brand-dark/[0.06]"
      }`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card-tint text-brand">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium text-brand-dark/50">{label}</span>
        <span className="mt-0.5 block text-[14px] font-semibold leading-snug text-brand-dark">
          {value}
        </span>
      </span>
    </div>
  );
}

function DetailLine({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-4 py-3.5 ${
        last ? "" : "border-b border-brand-dark/[0.06]"
      }`}
    >
      <span className="shrink-0 text-[13px] text-brand-dark/55">{label}</span>
      <span className="text-right text-[14px] font-semibold text-brand-dark">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  inputMode,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  placeholder?: string;
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
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-brand/15 bg-brand-light/40 px-3 text-[14px] font-normal text-brand-dark outline-none focus:border-brand/35"
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
        className="mt-1 h-11 w-full rounded-xl border border-brand/15 bg-brand-light/40 px-3 text-[14px] font-normal outline-none focus:border-brand/35 disabled:opacity-50"
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
