import Link from "next/link";
import { getPackages, getServices } from "@/app/lib/db";
import ServiceCard from "@/app/components/service-card";
import PackageCard from "@/app/components/package-card";
import ScrollRow from "@/app/components/scroll-row";

export const dynamic = "force-dynamic";
export const metadata = { title: "Үйлчилгээ" };

/** Ангиллын нэрийг холбоос (anchor) болгоно — кирилл нэрэнд ч ажиллана. */
const catId = (i: number) => `cat-${i}`;

export default async function ServicesPage() {
  const [services, packages] = await Promise.all([
    getServices({ activeOnly: true }),
    getPackages({ activeOnly: true }),
  ]);
  const categories = Array.from(new Set(services.map((s) => s.category)));
  const showNav = categories.length > 1 || packages.length > 0;

  return (
    <div className="bg-warm">
      <div className="mx-auto w-full max-w-6xl px-5 pt-10 sm:pt-20">
        <header className="max-w-2xl">
          <p className="eyebrow">Манай үйлчилгээ</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.12] text-foreground sm:text-5xl">
            Гоо сайхны иж бүрэн үйлчилгээ
          </h1>
          <p className="mt-4 leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">
            Үс, хумс, арьс арчилгаанаас нүүр будалт хүртэл — өөрт хэрэгтэйгээ
            сонгоод цагаа захиалаарай.
          </p>
        </header>
      </div>

      {/* Ангиллын шуурхай цэс — утсанд хажуу тийш гүйлгэнэ */}
      {showNav && (
        <nav className="sticky top-16 z-30 mt-8 border-y border-border/60 bg-background/85 backdrop-blur-md">
          <div className="no-scrollbar mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-5 py-3">
            {packages.length > 0 && (
              <a
                href="#packages"
                className="flex min-h-11 shrink-0 items-center rounded-full bg-primary-soft px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                🎁 Багц
              </a>
            )}
            {categories.map((cat, i) => (
              <a
                key={cat}
                href={`#${catId(i)}`}
                className="flex min-h-11 shrink-0 items-center rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              >
                {cat}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto w-full max-w-6xl px-5 pb-20">
        {packages.length > 0 && (
          <section id="packages" className="scroll-mt-32 pt-10 sm:pt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Хосолсон санал</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  Хямдралтай багц
                </h2>
              </div>
              <p className="hidden max-w-xs text-sm leading-6 text-muted sm:block">
                Хэд хэдэн үйлчилгээг нэг дор авбал илүү хямд.
              </p>
            </div>
            <div className="mt-9">
              <ScrollRow itemWidth="w-[clamp(15rem,78vw,19rem)]">
                {packages.map((p) => (
                  <PackageCard key={p.id} pkg={p} services={services} />
                ))}
              </ScrollRow>
            </div>
          </section>
        )}

        {categories.map((cat, i) => (
          <section key={cat} id={catId(i)} className="scroll-mt-32 pt-12 sm:pt-16">
            <div className="flex items-baseline gap-4">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{cat}</h2>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted">
                {services.filter((s) => s.category === cat).length} үйлчилгээ
              </span>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 min-[360px]:grid-cols-2 sm:gap-x-6 lg:grid-cols-3">
              {services
                .filter((s) => s.category === cat)
                .map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
            </div>
          </section>
        ))}

        {services.length === 0 && (
          <p className="pt-16 text-muted">Одоогоор үйлчилгээ бүртгэгдээгүй байна.</p>
        )}

        {/* Хаалтын уриалга */}
        <section className="mt-16 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-hover px-6 py-12 text-center text-white sm:mt-20 sm:px-16 sm:py-14">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Аль үйлчилгээг сонгохоо мэдэхгүй байна уу?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/85">
            Цаг захиалахдаа тэмдэглэл үлдээгээрэй — мастер тань зөвлөнө.
          </p>
          <Link
            href="/book"
            className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.02]"
          >
            Цаг захиалах
          </Link>
        </section>
      </div>
    </div>
  );
}
