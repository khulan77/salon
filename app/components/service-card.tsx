import Link from "next/link";
import type { Service } from "@/app/lib/types";
import { formatDuration, formatPrice } from "@/app/lib/format";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-2xl">
          {service.emoji}
        </div>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
          {service.category}
        </span>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
        {service.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{service.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="text-lg font-semibold text-foreground">
            {formatPrice(service.price)}
          </div>
          <div className="text-xs text-muted">⏱ {formatDuration(service.durationMin)}</div>
        </div>
        <Link
          href={`/book?service=${service.id}`}
          className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Захиалах
        </Link>
      </div>
    </div>
  );
}
