"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Location } from "@/app/lib/types";
import { selectLocationAction } from "@/app/lib/actions";

/** Толгойд байрлах салбар сонгогч. Нэг л салбартай бол харагдахгүй. */
export default function LocationSelector({
  locations,
  selectedId,
  className = "",
}: {
  locations: Location[];
  selectedId?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Гадуур дарахад цэс хаана.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (locations.length < 2) return null;

  const current = locations.find((l) => l.id === selectedId) ?? locations[0];
  const labelOf = (l: Location) => l.name || l.address || "Салбар";

  const choose = (id: string) => {
    setOpen(false);
    if (id === current.id) return;
    startTransition(async () => {
      await selectLocationAction(id);
      router.refresh();
    });
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex max-w-[11rem] items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground/90 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      >
        <span>📍</span>
        <span className="truncate">{labelOf(current)}</span>
        <span className="text-xs text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          <p className="px-4 pt-3 text-xs font-medium text-muted">Салбар сонгох</p>
          <ul className="py-1.5">
            {locations.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => choose(l.id)}
                  className={`flex w-full flex-col items-start px-4 py-2 text-left transition-colors hover:bg-surface-2 ${
                    l.id === current.id ? "bg-primary-soft/60" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">{labelOf(l)}</span>
                  {l.address && l.name && (
                    <span className="text-xs text-muted">{l.address}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
