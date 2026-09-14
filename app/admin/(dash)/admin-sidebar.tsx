"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/lib/actions";

const nav = [
  { href: "/admin", label: "Хянах самбар", icon: "📊" },
  { href: "/admin/calendar", label: "Хуанли", icon: "🗓️" },
  { href: "/admin/services", label: "Үйлчилгээ", icon: "✨" }, // багц ч энд
  { href: "/admin/staff", label: "Мастерууд", icon: "💇‍♀️" },
  { href: "/admin/locations", label: "Салбарууд", icon: "🏢" },
  { href: "/admin/reviews", label: "Сэтгэгдэл", icon: "💬" },
  { href: "/admin/settings", label: "Тохиргоо", icon: "⚙️" },
];

export default function AdminSidebar({
  pendingCount = 0,
  salonName,
}: {
  pendingCount?: number;
  salonName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const links = (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
            isActive(n.href)
              ? "bg-primary text-white"
              : "text-foreground/80 hover:bg-surface-2"
          }`}
        >
          <span>{n.icon}</span>
          <span className="flex-1">{n.label}</span>
          {n.href === "/admin" && pendingCount > 0 && (
            <span
              className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${
                isActive(n.href) ? "bg-white text-primary" : "bg-primary text-white"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 sm:px-5 lg:hidden">
        <Link href="/admin" className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate font-display text-xl font-semibold text-foreground">
            {salonName}
          </span>
          <span className="shrink-0 text-xs text-muted">Admin</span>
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Үйлчлүүлэгчийн сайт"
          className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg"
        >
          🌐
        </a>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
          aria-label="Цэс"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-b border-border bg-surface px-4 py-4 lg:hidden">
          {links}
          <div className="mt-2 border-t border-border/60 pt-2">
            <SiteLink />
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-5 lg:flex">
        <Link href="/admin" className="flex min-w-0 items-baseline gap-1.5 px-2">
          <span className="truncate font-display text-2xl font-semibold text-foreground">{salonName}</span>
          <span className="text-primary">✦</span>
        </Link>
        <p className="mb-6 px-2 text-xs text-muted">Удирдлагын самбар</p>
        {links}
        <div className="mt-auto pt-6">
          <SiteLink />
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

/**
 * Үйлчлүүлэгчийн талын сайт руу орох товч. Шинэ цонхонд нээнэ — админ ажлаа
 * тасалдуулахгүй, буцаад ирэхэд байсан хуудас нь хэвээр байна.
 */
function SiteLink() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-foreground/80 hover:bg-surface-2"
    >
      <span>🌐</span>
      <span className="flex-1">Үйлчлүүлэгчийн сайт</span>
      <span aria-hidden className="text-xs text-muted">
        ↗
      </span>
    </a>
  );
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-foreground/80 hover:bg-surface-2"
      >
        <span>🚪</span> Гарах
      </button>
    </form>
  );
}
