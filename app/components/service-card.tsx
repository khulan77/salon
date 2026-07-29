import Link from "next/link";
import type { Service } from "@/app/lib/types";
import { effectivePrice, formatDuration, formatPrice, hasSale } from "@/app/lib/format";

/**
 * Үйлчилгээний карт — арк хэлбэрийн зураг, доор нь editorial бичиг.
 * Хүрээтэй хайрцаг ашиглахгүй: зураг өөрөө хэлбэрээ барина. Бүтэн карт нь
 * холбоос тул гар утсан дээр хаана ч дарахад захиалга руу ороно.
 */
export default function ServiceCard({ service }: { service: Service }) {
  const sale = hasSale(service);

  return (
    <Link href={`/book?service=${service.id}`} className="group block">
      <div className="arch">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-b from-primary-soft to-surface-2 text-5xl transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:text-6xl">
            {service.emoji}
          </span>
        )}
        {/* Аркны дээд булан дугуй тул тэмдгийг доод (шулуун) буланд байрлуулна */}
        {sale && (
          <span className="absolute bottom-3 right-3 rounded-full bg-rose-500 px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm sm:bottom-4 sm:right-4 sm:text-xs">
            −{service.salePercent}%
          </span>
        )}
      </div>

      <div className="mt-4 px-0.5">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted sm:text-[0.66rem]">
          {service.category} · {formatDuration(service.durationMin)}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
          {service.name}
        </h3>
        {service.description && (
          <p className="mt-1.5 hidden text-sm leading-6 text-muted sm:line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          {sale && <s className="text-xs text-muted">{formatPrice(service.price)}</s>}
          <span
            className={`font-display text-lg ${sale ? "text-rose-600" : "text-foreground"}`}
          >
            {formatPrice(effectivePrice(service))}
          </span>
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
