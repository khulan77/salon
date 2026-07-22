import Link from "next/link";
import type { Service } from "@/app/lib/types";
import { effectivePrice, formatDuration, formatPrice, hasSale } from "@/app/lib/format";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="card card-hover group flex flex-col p-7">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">
          {service.emoji}
        </span>
        {hasSale(service) && (
          <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
            −{service.salePercent}%
          </span>
        )}
      </div>

      <p className="mt-6 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted">
        {service.category}
      </p>
      <h3 className="mt-1.5 font-display text-xl font-semibold text-foreground">
        {service.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{service.description}</p>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            {hasSale(service) && (
              <s className="text-sm text-muted">{formatPrice(service.price)}</s>
            )}
            <span
              className={`text-lg font-semibold ${
                hasSale(service) ? "text-rose-600" : "text-foreground"
              }`}
            >
              {formatPrice(effectivePrice(service))}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted">{formatDuration(service.durationMin)}</div>
        </div>
        <Link
          href={`/book?service=${service.id}`}
          className="rounded-full bg-primary-soft px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Захиалах
        </Link>
      </div>
    </div>
  );
}
