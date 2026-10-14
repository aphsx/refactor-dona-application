"use client";

import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function formatBaht(value: number) {
  return Number(value).toLocaleString("th-TH");
}

export function loanStatusTone(name: string) {
  if (name === "อนุมัติ") return "bg-[#e8f8f0] text-[#0f8a5f]";
  if (name === "ปฏิเสธ" || name === "ยกเลิก") return "bg-red-50 text-danger";
  if (name === "รอการตรวจสอบ" || name === "กำลังตรวจสอบ") {
    return "bg-amber-50 text-amber-800";
  }
  return "bg-brand-light text-brand";
}

export function LoanBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur-sm"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

export function LoanHero({
  backHref,
  backLabel,
  title,
  subtitle,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden px-5 pb-8 pt-6 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,#2aa87a_0%,#0f493b_55%,#0a342a_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-6 h-40 w-40 rounded-full bg-accent/20 blur-2xl"
      />
      <div className="relative">
        {backHref && backLabel && <LoanBackLink href={backHref} label={backLabel} />}
        <p className="mt-5 text-[11px] font-bold tracking-[0.22em] text-white/65 uppercase">dona</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-white/75">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}

export function LoanStepBar({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1 as const, label: "รายละเอียด" },
    { n: 2 as const, label: "เอกสาร" },
  ];
  return (
    <ol className="mt-5 grid grid-cols-2 gap-2">
      {items.map((item) => {
        const active = step === item.n;
        const done = step > item.n;
        return (
          <li
            key={item.n}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-bold ${
              active
                ? "bg-white text-brand-dark shadow-sm"
                : done
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/55"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
                active ? "bg-brand text-white" : done ? "bg-accent text-brand-dark" : "bg-white/20"
              }`}
            >
              {item.n}
            </span>
            {item.label}
          </li>
        );
      })}
    </ol>
  );
}

export function LoanField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold text-brand-dark/80">{label}</span>
      {hint && <span className="mt-0.5 block text-[12px] text-brand-dark/45">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const loanInputClass =
  "h-14 w-full rounded-2xl border border-brand/10 bg-white px-4 text-[16px] text-brand-dark shadow-[0_1px_0_rgba(15,73,59,0.04)] outline-none transition focus:border-brand/35 focus:ring-4 focus:ring-brand/10";

export const loanTextareaClass =
  "w-full rounded-2xl border border-brand/10 bg-white px-4 py-3 text-[16px] text-brand-dark shadow-[0_1px_0_rgba(15,73,59,0.04)] outline-none transition focus:border-brand/35 focus:ring-4 focus:ring-brand/10";

export function LoanPrimaryButton({
  children,
  className = "",
  tone = "brand",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "brand" | "accent" | "danger";
}) {
  const tones = {
    brand: "bg-brand text-white hover:bg-brand/90",
    accent: "bg-accent text-brand-dark hover:bg-accent/90",
    danger: "bg-danger text-white hover:bg-danger/90",
  };
  return (
    <button
      type={type}
      {...props}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-bold shadow-[0_10px_24px_rgba(15,73,59,0.18)] transition active:scale-[0.99] disabled:pointer-events-none disabled:bg-[#d7ddd9] disabled:text-brand-dark/35 disabled:shadow-none ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export const loanCtaLinkClass =
  "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-bold text-brand-dark shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition active:scale-[0.99]";

export function LoanGhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-brand/15 bg-white text-[15px] font-bold text-brand transition active:scale-[0.99] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function LoanDangerOutlineButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-danger/25 bg-white text-[15px] font-bold text-danger transition active:scale-[0.99] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function LoanStickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand/10 bg-brand-light/95 px-5 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-2.5">{children}</div>
    </div>
  );
}

export function LoanConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "ยังก่อน",
  busy,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="home-rise w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(15,73,59,0.28)]">
        <div className={`px-6 pb-2 pt-6 ${danger ? "bg-gradient-to-b from-red-50 to-white" : "bg-gradient-to-b from-brand-light to-white"}`}>
          <p className="text-[18px] font-bold text-brand-dark">{title}</p>
          {body && <p className="mt-2 text-[14px] leading-relaxed text-brand-dark/60">{body}</p>}
        </div>
        <div className="flex gap-3 px-6 py-5">
          <LoanGhostButton disabled={busy} onClick={onCancel} className="flex-1">
            {cancelLabel}
          </LoanGhostButton>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`flex h-12 flex-1 items-center justify-center rounded-2xl text-[15px] font-bold text-white disabled:opacity-50 ${
              danger ? "bg-danger" : "bg-brand"
            }`}
          >
            {busy ? "กำลังทำ…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoanSectionTitle({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      {Icon && (
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-card-tint text-brand">
          <Icon size={16} />
        </span>
      )}
      <div>
        <h2 className="text-[16px] font-bold text-brand-dark">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-brand-dark/50">{subtitle}</p>}
      </div>
    </div>
  );
}

export function LoanProgress({ attached, total }: { attached: number; total: number }) {
  const pct = total > 0 ? Math.round((attached / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-brand/10">
      <div className="flex items-center justify-between text-[13px] font-bold">
        <span className="text-brand-dark/70">เอกสารจำเป็น</span>
        <span className="text-brand">
          {attached}/{total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand/10">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
