"use client";

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
    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="mt-4 font-display text-xl font-semibold text-foreground">
        Мэдээлэл ачаалахад алдаа гарлаа
      </h1>
      <p className="mt-2 text-sm text-muted">
        Supabase-тэй холбогдоход асуудал гарсан байж магадгүй. Дахин оролдоно уу.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Дахин ачаалах
      </button>
    </div>
  );
}
