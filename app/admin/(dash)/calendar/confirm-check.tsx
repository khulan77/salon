"use client";

import { useOptimistic, useTransition } from "react";
import { setBookingConfirmedAction } from "@/app/lib/actions";

/**
 * Захиалгын check: тэмдэглэсэн = баталгаажсан, хоосон = хүлээгдэж буй.
 * Дармагц шууд солигдож харагдана (optimistic), сервер араас нь шинэчилнэ.
 *
 *  size="sm" — хуанлийн блокны баруун дээд буланд.
 *  size="lg" — захиалгын хуудсанд, тайлбартай бүтэн мөр.
 */
export default function ConfirmCheck({
  id,
  confirmed,
  size = "sm",
}: {
  id: string;
  confirmed: boolean;
  size?: "sm" | "lg";
}) {
  const [checked, setChecked] = useOptimistic(confirmed);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setChecked(!checked);
      await setBookingConfirmedAction(id, !checked);
    });

  const box = (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-md font-bold leading-none transition-colors ${
        size === "lg" ? "h-6 w-6 text-sm" : "h-4 w-4 text-[10px]"
      } ${
        checked
          ? "bg-emerald-600 text-white"
          : "bg-white text-transparent ring-2 ring-inset ring-rose-400"
      }`}
    >
      ✓
    </span>
  );

  if (size === "lg") {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        disabled={pending}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface-2/70 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
      >
        {box}
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {checked ? "Баталгаажсан" : "Баталгаажаагүй"}
          </span>
          <span className="block text-xs text-muted">
            {checked
              ? "Өөр мастер руу шилжүүлж болно. Бусдыг засах бол check-ийг авна уу."
              : "Засах, өөр мастер руу шилжүүлэх, цуцлах боломжтой."}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Баталгаажсан — дарж болиулах" : "Баталгаажуулах"}
      onClick={toggle}
      disabled={pending}
      // Блок жижиг ч дарах талбай нь боломжийн том байхаар padding-тай.
      className="absolute right-0 top-0 z-10 p-1"
    >
      {box}
    </button>
  );
}
