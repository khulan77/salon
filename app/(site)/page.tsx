import Link from "next/link";
import { getReviews, getServices, getStaff } from "@/app/lib/db";
import ServiceCard from "@/app/components/service-card";
import StaffCard from "@/app/components/staff-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, staff, reviews] = await Promise.all([
    getServices({ activeOnly: true }),
    getStaff({ activeOnly: true }),
    getReviews({ activeOnly: true }),
  ]);
  const featured = services.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-warm">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-primary">
              ✦ Улаанбаатар хотын тансаг салон
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
              Таны гоо сайхныг
              <span className="text-primary"> гэрэлтүүлнэ</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-muted">
              Мэргэжлийн мастерууд, тансаг орчин. Хэдхэн товшилтоор өөрт тохирсон
              цагаа онлайнаар захиалаарай.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
            <div className="mt-10 flex gap-8">
              {[
                { n: "10+", l: "Жилийн туршлага" },
                { n: `${services.length}`, l: "Төрлийн үйлчилгээ" },
                { n: "2000+", l: "Сэтгэл ханамжтай үйлчлүүлэгч" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl font-semibold text-foreground">{s.n}</div>
                  <div className="mt-1 text-xs text-muted">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex animate-fade-up justify-center">
            <div className="relative aspect-square w-full max-w-sm">
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary-soft via-surface to-surface-2 px-12 text-center">
                <div className="text-7xl">💇‍♀️</div>
                <p className="font-display text-2xl text-foreground">Lumière Beauty</p>
                <p className="max-w-[15rem] text-sm leading-6 text-muted">
                  Үс, хумс, арьс арчилгаа, нүүр будалт
                </p>
              </div>

              {[
                { icon: "✂️", pos: "left-0 top-8" },
                { icon: "💅", pos: "right-2 top-0" },
                { icon: "🧖‍♀️", pos: "-left-2 bottom-16" },
                { icon: "💄", pos: "right-0 bottom-6" },
              ].map((c) => (
                <span
                  key={c.icon}
                  className={`absolute ${c.pos} flex h-16 w-16 items-center justify-center rounded-full bg-surface text-2xl shadow-[0_10px_30px_-12px_rgba(46,39,35,0.35)]`}
                >
                  {c.icon}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {[
            { icon: "⭐", t: "Мэргэжлийн мастерууд", d: "Сертификаттай, туршлагатай баг таныг угтана." },
            { icon: "🗓️", t: "Хялбар захиалга", d: "Онлайнаар 24/7 цагаа сонгож захиалах боломж." },
            { icon: "🌿", t: "Чанартай бүтээгдэхүүн", d: "Зөвхөн шилдэг брэндийн бүтээгдэхүүн ашиглана." },
          ].map((f) => (
            <div key={f.t} className="sm:px-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">
                {f.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{f.t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Бидний тухай</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">
              Гоо сайхан бол өөрийгөө хайрлах эхлэл
            </h2>
            <p className="mt-4 leading-8 text-muted">
              Lumière нь 2016 онд байгуулагдсан бөгөөд өнгөрсөн хугацаанд мянга мянган
              үйлчлүүлэгчийн итгэлийг хүлээсэн. Бид зөвхөн чанартай бүтээгдэхүүн ашиглаж,
              мэргэжлийн мастеруудаараа таны хүссэн дүр төрхийг бүтээнэ.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">✓ Олон улсын сертификаттай мастерууд</li>
              <li className="flex items-center gap-2">✓ Ариун цэвэр, тав тухтай орчин</li>
              <li className="flex items-center gap-2">✓ Хувь хүнд тохирсон зөвлөгөө</li>
            </ul>
          </div>
          <div className="order-1 flex items-center justify-center lg:order-2">
            <div className="grid grid-cols-2 gap-5 sm:gap-6">
              {[
                { icon: "💇‍♀️", label: "Үс" },
                { icon: "💅", label: "Хумс" },
                { icon: "🧖‍♀️", label: "Арьс" },
                { icon: "💄", label: "Гоо сайхан" },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={`flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-primary-soft to-surface-2 sm:h-36 sm:w-36 ${
                    i % 2 === 1 ? "translate-y-6" : ""
                  }`}
                >
                  <span className="text-4xl">{c.icon}</span>
                  <span className="text-xs text-muted">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Үйлчилгээ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
              Онцлох үйлчилгээнүүд
            </h2>
          </div>
          <Link href="/services" className="text-sm font-medium text-primary hover:underline">
            Бүгдийг үзэх →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* Staff */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="eyebrow">Манай баг</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
            Туршлагатай мастерууд
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((m) => (
            <StaffCard key={m.id} staff={m} services={services} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="bg-surface-2/50">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <div className="text-center">
              <p className="eyebrow">Сэтгэгдэл</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
                Үйлчлүүлэгчид юу гэж хэлдэг вэ
              </h2>
            </div>
            <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <figure key={r.id} className="flex flex-col">
                  <div className="text-accent" aria-label={`${r.rating} од`}>
                    {"★".repeat(r.rating)}
                    <span className="text-border">{"★".repeat(5 - r.rating)}</span>
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-7 text-muted">
                    “{r.text}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                      {r.customerName.slice(0, 1)}
                    </span>
                    <span className="text-sm font-medium text-foreground">{r.customerName}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Байршил</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
              Бидэнтэй уулзаарай
            </h2>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <span className="text-muted">
                  Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо,
                  <br /> Энх тайвны өргөн чөлөө, Lumière төв
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">📞</span>
                <a href="tel:+97680000000" className="text-primary hover:underline">
                  +976 8000-0000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">🕙</span>
                <span className="text-muted">Даваа–Баасан 10:00–20:00 · Бямба–Ням 11:00–18:00</span>
              </li>
            </ul>
            <Link
              href="/book"
              className="mt-8 inline-block rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Цаг захиалах
            </Link>
          </div>
          <div className="card overflow-hidden rounded-[2rem] p-0">
            <iframe
              title="Lumière байршил"
              className="h-full min-h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.905%2C47.914%2C106.930%2C47.923&layer=mapnik&marker=47.9185%2C106.9177"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-hover px-8 py-16 text-center text-white shadow-lg sm:px-16">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
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
