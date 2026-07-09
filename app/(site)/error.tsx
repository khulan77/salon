"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-warm px-5">
      <div className="max-w-md text-center">
        <div className="text-5xl">🌸</div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Уучлаарай, алдаа гарлаа
        </h1>
        <p className="mt-2 text-muted">
          Түр зуурын асуудал гарсан байна. Дахин оролдоно уу.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Дахин оролдох
          </button>
          <Link
            href="/"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-ring"
          >
            Нүүр хуудас
          </Link>
        </div>
      </div>
    </div>
  );
}
