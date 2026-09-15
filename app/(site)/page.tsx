import Link from "next/link";
import {
  getEffectiveLocations,
  getReviews,
  getServices,
  getSettings,
  getStaff,
} from "@/app/lib/db";
import ServiceCard from "@/app/components/service-card";
import ScrollRow from "@/app/components/scroll-row";
import StaffCard from "@/app/components/staff-card";
import { formatHours, mapEmbedUrl } from "@/app/lib/format";
import { getSelectedLocationId, resolveLocation } from "@/app/lib/location";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, staff, reviews, settings, locations, selectedId] = await Promise.all([
    getServices({ activeOnly: true }),
    getStaff({ activeOnly: true }),
    getReviews({ activeOnly: true }),
    getSettings(),
    getEffectiveLocations(),
    getSelectedLocationId(),
  ]);
  const featured = services.slice(0, 6);
  const location = resolveLocation(locations, selectedId);
  const hours = formatHours(location ?? settings);
  const mapUrl = mapEmbedUrl(location?.mapCoords ?? settings.mapCoords);
  const address = location?.address ?? settings.address;
  const phone = location?.phone ?? settings.phone;
  const otherLocations = locations.filter((l) => l.id !== location?.id);
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div>
      {/* Hero */}
      <section className="bg-warm">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-primary">
              ✦ Улаанбаатар хотын тансаг салон
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-foreground sm:mt-6 sm:text-5xl lg:text-6xl">
              Таны гоо сайхныг
              <span className="text-primary"> гэрэлтүүлнэ</span>
            </h1>
            <p className="mt-4 max-w-md leading-7 text-muted sm:mt-6 sm:text-lg sm:leading-8">
              Мэргэжлийн мастерууд, тансаг орчин. Хэдхэн товшилтоор өөрт тохирсон
              цагаа онлайнаар захиалаарай.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                Цаг захиалах
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-border bg-surface px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-ring"
              >
                Үйлчилгээ үзэх
              </Link>
            </div>
          </div>

          <div className="flex animate-fade-up justify-center">
            <div className="relative aspect-square w-full max-w-sm">
              {settings.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.heroImageUrl}
                  alt={settings.salonName}
                  className="h-full w-full rounded-full object-cover shadow-[0_30px_60px_-30px_rgba(46,39,35,0.5)] ring-8 ring-surface"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary-soft via-surface to-surface-2 px-12 text-center">
                  <div className="text-7xl">💇‍♀️</div>
                  <p className="font-display text-2xl text-foreground">
                    {settings.salonName}
                  </p>
                  <p className="max-w-[15rem] text-sm leading-6 text-muted">
                    Үс, хумс, арьс арчилгаа, нүүр будалт
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Үйлчилгээ</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-4xl">
              Онцлох үйлчилгээнүүд
            </h2>
          </div>
          <Link
            href="/services"
            className="shrink-0 whitespace-nowrap text-sm font-medium text-primary hover:underline"
          >
            Бүгдийг үзэх →
          </Link>
        </div>
        <div className="mt-9">
          <ScrollRow>
            {featured.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </ScrollRow>
        </div>
      </section>

      {/* Staff */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="eyebrow">Манай баг</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Туршлагатай мастерууд
          </h2>
        </div>
        {/*
          Үйлчилгээний хэсэгтэй ижил хоёр багана — утсанд урт цуваа болохгүй.
          Ганц мастертай салонд хагас өргөнтэй карт эзгүй харагдах тул төвлөнө.
        */}
        <div
          className={`mt-9 grid gap-x-5 gap-y-10 sm:gap-x-6 ${
            staff.length === 1
              ? "mx-auto max-w-[17rem]"
              : "grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {staff.map((m) => (
            <StaffCard key={m.id} staff={m} services={services} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="bg-surface-2/50">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16">
            <div className="text-center">
              <p className="eyebrow">Сэтгэгдэл</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                Үйлчлүүлэгчид юу гэж хэлдэг вэ
              </h2>
              {/* Дундаж үнэлгээ — шинэ үйлчлүүлэгчид итгэл төрүүлнэ. */}
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm shadow-[0_1px_2px_rgba(46,39,35,0.04),0_10px_24px_-18px_rgba(46,39,35,0.35)]">
                <span className="text-accent">★</span>
                <span className="font-semibold text-foreground">{avgRating}</span>
                <span className="text-muted">· {reviews.length} сэтгэгдэл</span>
              </p>
            </div>

            {/* Утсанд хажуу тийш гүйлгэнэ — доош урт цуваа болохгүй. */}
            <div className="mt-9">
              <ScrollRow itemWidth="w-[82vw] max-w-[21rem]">
                {reviews.slice(0, 6).map((r) => (
                  <figure key={r.id} className="card flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="text-accent"
                        aria-label={`${r.rating} од`}
                      >
                        {"★".repeat(r.rating)}
                        <span className="text-border">{"★".repeat(5 - r.rating)}</span>
                      </div>
                      <span
                        aria-hidden
                        className="-mt-2 font-display text-4xl leading-none text-primary-soft"
                      >
                        &rdquo;
                      </span>
                    </div>

                    <blockquote className="mt-3 flex-1 text-sm leading-7 text-foreground/85">
                      {r.text}
                    </blockquote>

                    <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                        {r.customerName.slice(0, 1)}
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">
                        {r.customerName}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </ScrollRow>
            </div>
          </div>
        </section>
      )}

      {/* Location */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className={`grid gap-8 ${mapUrl ? "lg:grid-cols-2" : ""}`}>
          <div>
            <p className="eyebrow">Байршил</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Бидэнтэй уулзаарай
            </h2>
            {location?.name && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-1 text-sm font-medium text-primary">
                🏢 {location.name}
              </p>
            )}
            <ul className="mt-6 space-y-4 text-sm">
              {address && (
                <li className="flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <span className="text-muted">{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-3">
                  <span className="text-lg">📞</span>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="text-primary hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <span className="text-lg">🕙</span>
                <span className="text-muted">
                  {hours.days ? `${hours.days} ${hours.hours}` : "Түр хаалттай"}
                  {hours.days && hours.closedDays && ` · ${hours.closedDays} амарна`}
                </span>
              </li>
            </ul>

            {otherLocations.length > 0 && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs font-medium text-muted">Бусад салбар</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {otherLocations.map((l) => (
                    <li key={l.id} className="text-muted">
                      <span className="font-medium text-foreground">
                        {l.name || l.address}
                      </span>
                      {l.name && l.address && ` — ${l.address}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href="/book"
              className="mt-8 inline-block rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Цаг захиалах
            </Link>
          </div>
          {mapUrl && (
            <div className="card overflow-hidden rounded-[2rem] p-0">
              <iframe
                title={`${settings.salonName} байршил`}
                className="h-full min-h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapUrl}
              />
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-hover px-6 py-12 text-center text-white shadow-lg sm:px-16 sm:py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-4xl">
            Өнөөдөр өөртөө цаг гаргаарай
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/85">
            Хэдхэн минутын дотор цагаа захиалаад, тансаг үйлчилгээг мэдрээрэй.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.02]"
          >
            Одоо захиалах
          </Link>
        </div>
      </section>
    </div>
  );
}
