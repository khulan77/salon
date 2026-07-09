import Link from "next/link";
import { getReviews, getServices, getStaff } from "@/app/lib/db";
import ServiceCard from "@/app/components/service-card";
import StaffCard from "@/app/components/staff-card";

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

          <div className="relative animate-fade-up">
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary-soft via-surface to-surface-2 shadow-xl">
              <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
                <div className="text-7xl">💇‍♀️</div>
                <p className="font-display text-2xl text-foreground">Lumière Beauty</p>
                <p className="max-w-xs text-sm text-muted">
                  Үс, хумс, арьс арчилгаа болон нүүр будалтын иж бүрэн үйлчилгээ
                </p>
                <div className="mt-2 flex gap-3 text-3xl">✂️ 💅 🧖‍♀️ 💄</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: "⭐", t: "Мэргэжлийн мастерууд", d: "Сертификаттай, туршлагатай баг таныг угтана." },
            { icon: "🗓️", t: "Хялбар захиалга", d: "Онлайнаар 24/7 цагаа сонгож захиалах боломж." },
            { icon: "🌿", t: "Чанартай бүтээгдэхүүн", d: "Зөвхөн шилдэг брэндийн бүтээгдэхүүн ашиглана." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-surface p-7">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{f.t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 rounded-[2rem] border border-border bg-surface p-8 sm:p-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-medium text-primary">Бидний тухай</p>
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
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "💇‍♀️", label: "Үс" },
                { icon: "💅", label: "Хумс" },
                { icon: "🧖‍♀️", label: "Арьс" },
                { icon: "💄", label: "Гоо сайхан" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary-soft to-surface-2 sm:h-32 sm:w-32"
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
            <p className="text-sm font-medium text-primary">Үйлчилгээ</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">
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
          <p className="text-sm font-medium text-primary">Манай баг</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">
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
              <p className="text-sm font-medium text-primary">Сэтгэгдэл</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">
                Үйлчлүүлэгчид юу гэж хэлдэг вэ
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <figure
                  key={r.id}
                  className="flex flex-col rounded-2xl border border-border bg-surface p-6"
                >
                  <div className="text-accent" aria-label={`${r.rating} од`}>
                    {"★".repeat(r.rating)}
                    <span className="text-border">{"★".repeat(5 - r.rating)}</span>
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-6 text-muted">
                    “{r.text}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
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
            <p className="text-sm font-medium text-primary">Байршил</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">
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
          <div className="overflow-hidden rounded-[2rem] border border-border">
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
