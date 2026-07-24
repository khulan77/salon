"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/lib/actions";

const nav = [
  { href: "/admin", label: "Хянах самбар", icon: "📊" },
  { href: "/admin/bookings", label: "Захиалгууд", icon: "🗓️" },
  { href: "/admin/revenue", label: "Орлого", icon: "💰" },
  { href: "/admin/services", label: "Үйлчилгээ", icon: "✨" },
  { href: "/admin/packages", label: "Багц", icon: "🎁" },
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
          {n.href === "/admin/bookings" && pendingCount > 0 && (
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
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3 lg:hidden">
        <Link href="/admin" className="flex items-baseline gap-1.5">
          <span className="font-display text-xl font-semibold text-foreground">{salonName}</span>
          <span className="text-xs text-muted">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xl"
          aria-label="Цэс"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-b border-border bg-surface px-4 py-4 lg:hidden">
          {links}
          <LogoutButton />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-5 lg:flex">
        <Link href="/admin" className="flex items-baseline gap-1.5 px-2">
          <span className="font-display text-2xl font-semibold text-foreground">{salonName}</span>
          <span className="text-primary">✦</span>
        </Link>
        <p className="mb-6 px-2 text-xs text-muted">Удирдлагын самбар</p>
        {links}
        <div className="mt-auto pt-6">
          <Link
            href="/"
            className="mb-2 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-foreground/80 hover:bg-surface-2"
          >
            <span>🏠</span> Вэбсайт үзэх
          </Link>
          <LogoutButton />
        </div>
      </aside>
    </>
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
