import Link from "next/link";
import type { Location, Settings } from "@/app/lib/types";
import { formatHours } from "@/app/lib/format";

export default function SiteFooter({
  settings,
  location,
}: {
  settings: Settings;
  location?: Location;
}) {
  // Холбоо барих мэдээллийг сонгосон салбараас авна (байхгүй бол settings).
  const address = location?.address ?? settings.address;
  const phone = location?.phone ?? settings.phone;
  const hours = formatHours(location ?? settings);

  return (
    <footer className="mt-24 border-t border-border bg-surface-2/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold text-foreground">
              {settings.salonName}
            </span>
            <span className="text-primary">✦</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            {settings.about ||
              "Таны гоо сайхныг гэрэлтүүлэх мэргэжлийн салон. Тансаг орчин, туршлагатай мастерууд."}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Хуудсууд</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li><Link href="/services" className="hover:text-primary">Үйлчилгээ</Link></li>
            <li><Link href="/staff" className="hover:text-primary">Мастерууд</Link></li>
            <li><Link href="/book" className="hover:text-primary">Цаг захиалах</Link></li>
            <li><Link href="/my" className="hover:text-primary">Миний захиалга</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Холбоо барих</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {location?.name && <li className="font-medium text-foreground">🏢 {location.name}</li>}
            {address && <li>📍 {address}</li>}
            {phone && <li>📞 {phone}</li>}
            {settings.email && <li>✉️ {settings.email}</li>}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Цагийн хуваарь</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {hours.days && <li>{hours.days}: {hours.hours}</li>}
            {hours.closedDays && <li>{hours.closedDays}: амарна</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} {settings.salonName}. Бүх эрх хуулиар
            хамгаалагдсан.
          </span>
          <Link href="/login" className="hover:text-primary">Ажилтан нэвтрэх</Link>
        </div>
      </div>
    </footer>
  );
}
