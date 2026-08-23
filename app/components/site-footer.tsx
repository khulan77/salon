import Link from "next/link";
import type { Location, Settings } from "@/app/lib/types";
import { formatHours } from "@/app/lib/format";
import {
  BranchIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
} from "./icons";

const pages = [
  { href: "/services", label: "Үйлчилгээ" },
  { href: "/staff", label: "Мастерууд" },
  { href: "/book", label: "Цаг захиалах" },
  { href: "/my", label: "Миний захиалга" },
];

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
    <footer className="mt-20 border-t border-border bg-surface-2/60 sm:mt-24">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-14">
        {/*
          Багануудын өргөн агуулгадаа тохирно: танилцуулга болон хаяг илүү зай
          авна. Утсанд "Хуудсууд" ба "Цагийн хуваарь" богино тул хажуу хажуугаа,
          урт хаягтай "Холбоо барих" бүтэн мөр эзэлнэ.
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr] lg:gap-x-10">
          {/* Танилцуулга */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-baseline gap-1.5">
              <span className="break-words font-display text-2xl font-semibold text-foreground">
                {settings.salonName}
              </span>
              <span className="shrink-0 text-primary">✦</span>
            </div>
            {settings.tagline && <p className="eyebrow mt-2">{settings.tagline}</p>}
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
              {settings.about ||
                "Таны гоо сайхныг гэрэлтүүлэх мэргэжлийн салон. Тансаг орчин, туршлагатай мастерууд."}
            </p>
            <Link
              href="/book"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Цаг захиалах
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Хуудсууд */}
          <Column title="Хуудсууд">
            <ul className="space-y-3 text-sm text-muted">
              {pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="transition-colors hover:text-primary">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          {/* Цагийн хуваарь — хуваарь мэт хоёр баганаар эгнэнэ */}
          <Column title="Цагийн хуваарь">
            {hours.days ? (
              <dl className="space-y-2.5 text-sm">
                <Schedule term={hours.days} value={hours.hours} />
                {hours.closedDays && (
                  <Schedule term={hours.closedDays} value="Амарна" muted />
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted">Түр хаалттай</p>
            )}
          </Column>

          {/* Холбоо барих */}
          <Column title="Холбоо барих" className="col-span-2 lg:col-span-1">
            <ul className="space-y-3 text-sm text-muted">
              {location?.name && (
                <Row icon={<BranchIcon className="h-4 w-4" />}>
                  <span className="font-medium text-foreground">{location.name}</span>
                </Row>
              )}
              {address && <Row icon={<PinIcon className="h-4 w-4" />}>{address}</Row>}
              {phone && (
                <Row icon={<PhoneIcon className="h-4 w-4" />}>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="transition-colors hover:text-primary"
                  >
                    {phone}
                  </a>
                </Row>
              )}
              {settings.email && (
                <Row icon={<MailIcon className="h-4 w-4" />}>
                  <a
                    href={`mailto:${settings.email}`}
                    className="break-all transition-colors hover:text-primary"
                  >
                    {settings.email}
                  </a>
                </Row>
              )}
              {!location?.name && hours.days && (
                <Row icon={<ClockIcon className="h-4 w-4" />}>
                  {hours.days} · {hours.hours}
                </Row>
              )}
            </ul>
          </Column>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2.5 px-5 py-5 text-xs text-muted sm:flex-row">
          <span className="text-center sm:text-left">
            © {new Date().getFullYear()} {settings.salonName}. Бүх эрх хуулиар
            хамгаалагдсан.
          </span>
          <Link href="/login" className="transition-colors hover:text-primary">
            Ажилтан нэвтрэх
          </Link>
        </div>
      </div>
    </footer>
  );
}

function Column({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
        {title}
      </h4>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Дүрс нь тогтмол өргөнтэй багана — бичвэр хэдэн мөр болсон ч эгнээ таарна. */
function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span className="min-w-0 leading-6">{children}</span>
    </li>
  );
}

function Schedule({
  term,
  value,
  muted,
}: {
  term: string;
  value: string;
  muted?: boolean;
}) {
  // Нарийн утасны багананд "Даваа–Бямба 10:00–20:00" нэг мөрөнд багтахгүй тул
  // доор нь буулгана; өргөн дэлгэцэд хуваарь мэт хоёр талдаа эгнэнэ.
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <dt className="text-muted">{term}</dt>
      <dd
        className={`shrink-0 tabular-nums ${
          muted ? "text-muted" : "font-medium text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
