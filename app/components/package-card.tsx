import Link from "next/link";
import type { Service, ServicePackage } from "@/app/lib/types";
import { formatDuration, formatPrice, packageTotals } from "@/app/lib/format";

export default function PackageCard({
  pkg,
  services,
}: {
  pkg: ServicePackage;
  services: Service[];
}) {
  const t = packageTotals(pkg, services);
  const included = pkg.serviceIds
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is Service => Boolean(s));

  return (
    <div className="card card-hover group flex flex-col p-7 ring-1 ring-primary/20">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">
          {pkg.emoji}
        </span>
        {t.savePercent > 0 && (
          <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
            −{t.savePercent}%
          </span>
        )}
      </div>

      <p className="mt-6 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary">
        Багц
      </p>
      <h3 className="mt-1.5 font-display text-xl font-semibold text-foreground">{pkg.name}</h3>
      {pkg.description && (
        <p className="mt-2 text-sm leading-6 text-muted">{pkg.description}</p>
      )}

      <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted">
        {included.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            <span className="text-foreground/90">
              {s.emoji} {s.name}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            {t.saved > 0 && <s className="text-sm text-muted">{formatPrice(t.regular)}</s>}
            <span className="text-lg font-semibold text-rose-600">{formatPrice(pkg.price)}</span>
          </div>
          {t.durationMin > 0 && (
            <div className="mt-0.5 text-xs text-muted">
              Нийт {formatDuration(t.durationMin)}
            </div>
          )}
        </div>
        <Link
          href={`/book?package=${pkg.id}`}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Захиалах
        </Link>
      </div>
    </div>
  );
}
