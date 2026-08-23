"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Location } from "@/app/lib/types";
import LocationSelector from "./location-selector";

const links = [
  { href: "/", label: "Нүүр" },
  { href: "/services", label: "Үйлчилгээ" },
  { href: "/staff", label: "Мастерууд" },
  { href: "/my", label: "Миний захиалга" },
];

export default function SiteHeader({
  salonName,
  locations = [],
  selectedLocationId,
}: {
  salonName: string;
  locations?: Location[];
  selectedLocationId?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        {/* Салоны нэр урт байж болно — багтахгүй бол таслана. */}
        <Link
          href="/"
          className="flex min-w-0 shrink items-baseline gap-1.5"
          onClick={() => setOpen(false)}
        >
          <span className="truncate font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {salonName}
          </span>
          <span className="shrink-0 text-primary">✦</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors hover:text-primary ${
                isActive(l.href) ? "text-primary" : "text-foreground/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <LocationSelector locations={locations} selectedId={selectedLocationId} />
          <Link
            href="/book"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Цаг захиалах
          </Link>
        </nav>

        {/*
          Утсан дээр захиалгын товч цэсний ард нуугдах ёсгүй — хэрэглэгчдийн
          дийлэнх нь утсаараа захиалдаг тул үргэлж харагдаж байна.
        */}
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <LocationSelector
            locations={locations}
            selectedId={selectedLocationId}
            compact
          />
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            Захиалах
          </Link>
          <button
            type="button"
            aria-label="Цэс"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-mr-1 flex h-11 w-9 items-center justify-center rounded-lg text-foreground"
          >
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2 sm:px-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-b border-border/50 py-3.5 text-sm last:border-0 ${
                  isActive(l.href) ? "text-primary" : "text-foreground/80"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
