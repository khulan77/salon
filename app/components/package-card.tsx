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
  const images = included
    .map((s) => s.imageUrl)
    .filter((u): u is string => Boolean(u))
    .slice(0, 3);

  return (
    <Link href={`/book?package=${pkg.id}`} className="group block">
      <div className="arch ring-1 ring-primary/15">
        {images.length === 0 ? (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-b from-primary-soft to-surface-2 text-5xl transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:text-6xl">
            {pkg.emoji}
          </span>
        ) : (
          <div className="flex h-full w-full gap-0.5 transition-transform duration-700 ease-out group-hover:scale-[1.06]">
      
            <img src={images[0]} alt="" className="h-full flex-1 object-cover" />
            {images.length > 1 && (
              <div className="flex h-full flex-1 flex-col gap-0.5">
                {images.slice(1).map((src) => (

                  <img key={src} src={src} alt="" className="min-h-0 flex-1 object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-primary backdrop-blur-sm sm:top-6">
          Багц
        </span>
        {t.savePercent > 0 && (
          <span className="absolute right-3 bottom-3 rounded-full bg-rose-500 px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm sm:right-4 sm:bottom-4 sm:text-xs">
            −{t.savePercent}%
          </span>
        )}
      </div>

      <div className="mt-4 px-0.5">
        <h3 className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
          {pkg.name}
        </h3>
        <p className="mt-1.5 text-xs leading-6 text-muted sm:text-sm">
          {included.map((s) => s.name).join(" · ")}
          {t.durationMin > 0 && ` · ${formatDuration(t.durationMin)}`}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {t.saved > 0 && <s className="text-xs text-muted">{formatPrice(t.regular)}</s>}
          <span className="font-display text-lg text-rose-600">{formatPrice(pkg.price)}</span>
          <span
            aria-hidden
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm text-primary transition-colors group-hover:bg-primary group-hover:text-white"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
