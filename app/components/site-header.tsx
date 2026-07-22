"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Нүүр" },
  { href: "/services", label: "Үйлчилгээ" },
  { href: "/staff", label: "Мастерууд" },
  { href: "/my", label: "Миний захиалга" },
];

export default function SiteHeader({ salonName }: { salonName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-1.5" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {salonName}
          </span>
          <span className="text-primary">✦</span>
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
          <Link
            href="/book"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Цаг захиалах
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Цэс"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground md:hidden"
        >
          <span className="text-xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-5 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2.5 text-sm ${
                  isActive(l.href) ? "text-primary" : "text-foreground/80"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-medium text-white"
            >
              Цаг захиалах
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
