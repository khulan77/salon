"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPaymentProgressAction,
  mockPayAction,
  type PaymentProgress,
  type StartPaymentState,
} from "@/app/lib/actions";
import { formatPrice } from "@/app/lib/format";

/**
 * Урьдчилгаа төлөх алхам. Захиалга ЭНД БАЙХГҮЙ ЕЩЁ — төлбөр баталгаажсаны
 * дараа сервер талд үүснэ. Тиймээс энэ дэлгэц төлбөрийн явцыг тогтмол
 * шалгаж, амжилттай болмогц захиалгын кодыг харуулна.
 */
export default function PaymentStep({
  invoice,
  onExpired,
}: {
  invoice: Extract<StartPaymentState, { status: "invoice" }>;
  onExpired: () => void;
}) {
  const [progress, setProgress] = useState<PaymentProgress>({ state: "pending" });
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.round((new Date(invoice.expiresAt).getTime() - Date.now()) / 1000)),
  );

  // Төлбөр орсон эсэхийг 3 секунд тутам шалгана (webhook хоцорч ирж болно).
  useEffect(() => {
    if (progress.state !== "pending") return;
    const timer = setInterval(async () => {
      const next = await getPaymentProgressAction(invoice.paymentId);
      setProgress(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [invoice.paymentId, progress.state]);

  // Үлдсэн хугацааны тоолол.
  useEffect(() => {
    if (progress.state !== "pending") return;
    const timer = setInterval(() => {
      setSecondsLeft(
        Math.max(0, Math.round((new Date(invoice.expiresAt).getTime() - Date.now()) / 1000)),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [invoice.expiresAt, progress.state]);

  if (progress.state === "paid") {
    return (
      <div className="card mt-10 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-3xl">
          ✓
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Захиалга баталгаажлаа!
        </h2>
        <p className="mt-2 text-muted">
          Урьдчилгаа хүлээн авлаа. Таны цаг баталгаажсан.
        </p>
        <div className="mx-auto mt-7 max-w-sm rounded-3xl bg-primary-soft/60 p-6">
          <p className="text-xs font-medium text-muted">Таны захиалгын код</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em] text-primary">
            {progress.code}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted">
            Энэ кодоор захиалгаа хянах, цуцлах боломжтой. Хадгалж авна уу.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/my"
            className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Захиалгаа харах
          </Link>
          <Link
            href="/"
            className="rounded-full bg-surface-2 px-7 py-3 text-sm font-medium text-foreground hover:bg-border/60"
          >
            Нүүр хуудас
          </Link>
        </div>
      </div>
    );
  }

  if (progress.state === "failed") {
    return (
      <div className="card mt-10 p-10 text-center">
        <div className="text-4xl">🌸</div>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Захиалга бүртгэгдсэнгүй
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
          {progress.message}
        </p>
        <button
          type="button"
          onClick={onExpired}
          className="mt-6 rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Дахин цаг сонгох
        </button>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="card mt-10 p-8 text-center sm:p-10">
      <p className="eyebrow">Урьдчилгаа төлбөр</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
        {formatPrice(invoice.amount)} төлнө үү
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
        Цагийг тань <b>{minutes}:{seconds}</b> минут барьж байна. Төлбөр
        баталгаажмагц захиалга автоматаар үүсч, код тань энд гарна.
      </p>

      {invoice.qrImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={invoice.qrImage}
          alt="Төлбөрийн QR"
          className="mx-auto mt-6 h-56 w-56 rounded-2xl bg-white p-3"
        />
      )}

      {invoice.payUrl && (
        <a
          href={invoice.payUrl}
          className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Банкны аппаар төлөх
        </a>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Төлбөрийг хүлээж байна…
      </p>

      {invoice.mock && (
        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5">
          <p className="text-xs leading-5 text-amber-800">
            ⚠️ Туршилтын горим — төлбөрийн систем хараахан холбогдоогүй байна.
            Бодит мөнгө хөдлөхгүй.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setProgress(await mockPayAction(invoice.paymentId));
              setBusy(false);
            }}
            className="mt-3 rounded-full bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {busy ? "Түр хүлээнэ үү…" : "Төлбөр төлөгдсөнд тооцох (тест)"}
          </button>
        </div>
      )}
    </div>
  );
}
