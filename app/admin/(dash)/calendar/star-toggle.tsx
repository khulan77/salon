"use client";

import { useOptimistic, useTransition } from "react";
import { setBookingStaffLockedAction } from "@/app/lib/actions";

/**
 * ⭐ — "зөвхөн энэ мастер дээр үйлчлүүлнэ". Захиалга бүрийн нэрний өмнө
 * байрлана, check шиг дарж асаана/унтраана:
 *   ★ өнгөтэй — тогтмол мастер, өөр мастер руу шилжүүлэхгүй
 *   ☆ өнгөгүй — энгийн
 * Дармагц шууд солигдож харагдана (optimistic), сервер араас нь шинэчилнэ.
 *
 *  size="sm" — хуанлийн блок дотор, нэрний өмнө.
 *  size="lg" — захиалгын хуудасны толгойд.
 */
export default function StarToggle({
  id,
  locked,
  size = "lg",
}: {
  id: string;
  locked: boolean;
  size?: "sm" | "lg";
}) {
  const [on, setOn] = useOptimistic(locked);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setOn(!on);
      const error = await setBookingStaffLockedAction(id, !on);
      // Амжилтгүй бол optimistic утга өөрөө буцна — шалтгааныг нь хэлнэ.
      if (error) alert(error);
    });

  const label = on ? "Тогтмол мастер — дарж болиулах" : "Тогтмол мастер болгох";

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={toggle}
      disabled={pending}
      className={
        size === "sm"
          ? // Блок жижиг тул padding + сөрөг margin-аар дарах талбайг томруулна.
            `pointer-events-auto relative z-10 -my-1 -ml-1 mr-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-1 text-[13px] leading-none transition-colors ${
              on ? "text-amber-500" : "text-current opacity-35 hover:opacity-80"
            }`
          : `-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none transition-colors ${
              on
                ? "text-amber-400 hover:bg-amber-50"
                : "text-border hover:bg-surface-2 hover:text-amber-300"
            }`
      }
    >
      {on ? "★" : "☆"}
    </button>
  );
}
