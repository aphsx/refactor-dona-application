"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Upload } from "lucide-react";
import {
  apiMessage,
  formatThaiDate,
  getLoanApplication,
  isLoanDocumentRequired,
  loanRequiredDocumentProgress,
  uploadLoanDocument,
  type LoanApplication,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function formatBaht(value: number) {
  return Number(value).toLocaleString("th-TH");
}

export default function LoanDetailPage() {
  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [item, setItem] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKind, setBusyKind] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!session || !id) return;
    setLoading(true);
    setError("");
    void getLoanApplication(id)
      .then(setItem)
      .catch((err) => {
        setError(apiMessage(err));
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [session, id]);

  const progress = loanRequiredDocumentProgress(item?.documents ?? []);

  return (
    <div className="min-h-full px-5 pb-10 pt-6">
      <Link
        href="/loans"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand"
      >
        <ArrowLeft size={18} />
        คำขอของฉัน
      </Link>

      {loading && <p className="mt-8 text-[14px] text-brand-dark/50">กำลังโหลด…</p>}
      {!loading && error && <p className="mt-8 text-[14px] font-semibold text-danger">{error}</p>}

      {!loading && item && (
        <>
          <header className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-bold text-brand-dark">
                {formatBaht(item.requestedAmount)} บาท
              </h1>
              <span className="rounded-lg bg-brand-light px-2.5 py-1 text-[12px] font-semibold text-brand">
                {item.status?.name || "—"}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-brand-dark/55">
              ยื่นเมื่อ {formatThaiDate(item.submittedOn?.slice(0, 10) || "")}
            </p>
            {item.purpose?.trim() && (
              <p className="mt-2 text-[15px] text-brand-dark/80">{item.purpose}</p>
            )}
          </header>

          <section className="mt-8">
            <h2 className="text-[16px] font-bold text-brand-dark">เอกสารประกอบ</h2>
            <p className="mt-0.5 text-[13px] text-brand-dark/50">
              แนบ PDF หรือรูป · จำเป็น {progress.attached}/{progress.total}
            </p>

            {uploadError && (
              <p className="mt-3 text-[14px] font-semibold text-danger">{uploadError}</p>
            )}

            <ul className="mt-4 space-y-3">
              {(item.documents ?? []).map((doc) => {
                const required = isLoanDocumentRequired(doc);
                const busy = busyKind === doc.kindId;
                return (
                  <li
                    key={doc.kindId}
                    className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-brand/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-brand-dark">
                          {doc.name}
                          {required && <span className="text-danger"> *</span>}
                        </p>
                        <p className="mt-1 text-[13px] text-brand-dark/55">
                          {doc.attached ? "แนบแล้ว" : "ยังไม่แนบ"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {doc.attached && (
                          <CheckCircle2 className="text-brand" size={22} />
                        )}
                        {doc.attached && doc.storagePath?.startsWith("http") && (
                          <a
                            href={doc.storagePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] font-bold text-brand underline-offset-2 hover:underline"
                          >
                            ดูไฟล์
                          </a>
                        )}
                        {!doc.attached && (
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[13px] font-bold text-white">
                            <Upload size={16} />
                            {busy ? "กำลังอัป…" : "แนบไฟล์"}
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png,image/webp"
                              className="sr-only"
                              disabled={busy}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (!file) return;
                                void (async () => {
                                  setBusyKind(doc.kindId);
                                  setUploadError("");
                                  try {
                                    const updated = await uploadLoanDocument(
                                      item.id,
                                      doc.kindId,
                                      file,
                                    );
                                    setItem((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            documents: prev.documents.map((d) =>
                                              d.kindId === doc.kindId ? { ...d, ...updated } : d,
                                            ),
                                          }
                                        : prev,
                                    );
                                  } catch (err) {
                                    setUploadError(apiMessage(err));
                                  } finally {
                                    setBusyKind(null);
                                  }
                                })();
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
