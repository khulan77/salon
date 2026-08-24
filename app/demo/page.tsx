import Link from "next/link";
import DemoPhone from "./demo-phone";

/*
  Салоны эзэнд системээ үзүүлэх танилцуулга хуудас (/demo).

  Санаатайгаар бие даасан: өгөгдлийн сан, тохиргоо шаардахгүй тул ямар ч
  орчинд нээгдэнэ. Сайтын толгой/хөл хэсэггүй (`(site)` бүлгээс гадуур) —
  энэ хуудас үйлчлүүлэгчид биш, салоны эзэнд зориулагдсан.
*/

export const metadata = {
  title: "Demo",
  description:
    "Салоны онлайн цаг захиалгын систем — үйлчлүүлэгчийн болон салоны талыг хоёуланг нь үзнэ үү.",
  // Салоны жинхэнэ сайтын хайлтад хольж будлиулахгүйн тулд индексжүүлэхгүй.
  robots: { index: false, follow: false },
};

const features = [
  {
    icon: "📱",
    title: "Утаснаас захиалах",
    text: "Хэдхэн товшилтоор. Апп суулгах, бүртгүүлэх шаардлагагүй.",
  },
  {
    icon: "⏱",
    title: "Давхардахгүй цаг",
    text: "Мастер бүрийн завсаг бодож, захиалагдсан цагийг автоматаар хаана.",
  },
  {
    icon: "💳",
    title: "QPay урьдчилгаа",
    text: "Ирэхгүй өнжих захиалгыг багасгана. Хүсвэл унтраана.",
  },
  {
    icon: "🏢",
    title: "Олон салбар",
    text: "Салбар бүр өөрийн хаяг, цаг, мастер, үнэтэй.",
  },
  {
    icon: "🎁",
    title: "Багц ба хямдрал",
    text: "Хэд хэдэн үйлчилгээг нэг багц болгож, хямдруулж зарна.",
  },
  {
    icon: "📊",
    title: "Орлогын тайлан",
    text: "Өдөр, 7 хоног, сараар. Аль мастер, аль үйлчилгээ хэр орлоготой вэ.",
  },
];

const tour = [
  { href: "/", label: "Нүүр хуудас", note: "Салоны царай — үйлчилгээ, мастер, сэтгэгдэл" },
  { href: "/services", label: "Үйлчилгээний жагсаалт", note: "Үнэ, үргэлжлэх хугацаа, хямдрал" },
  { href: "/staff", label: "Мастерууд", note: "Хэн юу хийдэг, ямар цагт ажилладаг" },
  { href: "/book", label: "Цаг захиалах", note: "Жинхэнэ захиалгын урсгалыг туршиж үзнэ үү" },
  { href: "/my", label: "Миний захиалга", note: "Үйлчлүүлэгч захиалгаа хараад цуцална" },
];

const adminTools = [
  "📊 Хянах самбар",
  "🗓️ Захиалгууд",
  "💰 Орлого",
  "💳 Төлбөрүүд",
  "✨ Үйлчилгээ",
  "🎁 Багц",
  "💇‍♀️ Мастерууд",
  "🏢 Салбарууд",
  "💬 Сэтгэгдэл",
  "⚙️ Тохиргоо",
];

const steps = [
  {
    title: "Салоныхоо мэдээллийг өгнө",
    text: "Нэр, лого, хаяг, ажиллах цаг, үйлчилгээний үнэ, мастеруудын нэр.",
  },
  {
    title: "Бид тохируулж өгнө",
    text: "Өнгө, зураг, багц, урьдчилгааны дүн — бүгд танай салоны хэв маягаар.",
  },
  {
    title: "Линкээ тарааж эхэлнэ",
    text: "Instagram, Facebook-ийн bio-д тавихад л үйлчлүүлэгчид өөрсдөө захиалж эхэлнэ.",
  },
];

export default function DemoPage() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-warm">
        <div className="mx-auto w-full max-w-5xl px-5 pb-14 pt-12 text-center sm:pb-20 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-xs font-medium tracking-[0.16em] text-primary shadow-sm">
            ✦ DEMO
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            Салонд зориулсан
            <span className="text-primary"> онлайн цаг захиалга</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-muted sm:mt-6 sm:max-w-xl sm:text-lg sm:leading-8">
            Утсаар ярих, чат бичих завгүй байдлыг больё. Үйлчлүүлэгч өөрөө цагаа
            сонгож захиална, та зөвхөн баталгаажуулна.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/book"
              className="rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Захиалж үзэх
            </Link>
            <Link
              href="/"
              className="rounded-full bg-surface px-7 py-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:text-primary"
            >
              Жишээ сайтыг нээх
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted">
            Энэ бол зураг биш — ажиллаж байгаа жинхэнэ систем.
          </p>
        </div>
      </section>

      {/* Утасны амьд үзүүлэн */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
        <div className="text-center">
          <p className="eyebrow">Үзүүлэн</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Хоёр талаас нь хараарай
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
            Товчийг дараад үйлчлүүлэгч юу хардгийг, дараа нь та юу хардгийг үзнэ үү.
          </p>
        </div>
        <div className="mt-10">
          <DemoPhone />
        </div>
      </section>

      {/* Онцлогууд */}
      <section className="bg-surface-2/50">
        <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
          <div className="text-center">
            <p className="eyebrow">Багтсан зүйлс</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Салонд хэрэгтэй бүхэн
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9 sm:gap-x-10 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-xl shadow-[0_10px_30px_-14px_rgba(46,39,35,0.4)]">
                  {f.icon}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground sm:text-base">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted sm:text-sm">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Өөрөө нээж үзэх */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">Өөрөө үзэх</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Хуудас бүрийг нээгээд туршаарай
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              Доорх линкүүд бол жишээ салоны жинхэнэ хуудсууд. Захиалга үүсгэж
              үзсэн ч ямар нэг эрсдэлгүй.
            </p>
          </div>

          <ul className="space-y-2">
            {tour.map((t, i) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="card card-hover flex items-center gap-4 px-5 py-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {t.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted">
                      {t.note}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-primary">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Админ тал */}
      <section className="bg-surface-2/50">
        <div className="mx-auto w-full max-w-5xl px-5 py-14 text-center sm:py-20">
          <p className="eyebrow">Салоны тал</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Бүх зүйлээ өөрөө удирдана
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            Үнэ өөрчлөх, мастер нэмэх, амралтын өдөр тохируулах — програмистад
            хандах шаардлагагүй.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {adminTools.map((t) => (
              <span
                key={t}
                className="rounded-full bg-surface px-4 py-2 text-[13px] text-foreground shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-7 text-xs text-muted">
            Ажилтан бүр өөрийн нэвтрэх эрхтэй — мастер зөвхөн өөрийн цагийг хардаг.
          </p>
        </div>
      </section>

      {/* Хэрхэн эхлэх вэ */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
        <div className="text-center">
          <p className="eyebrow">Эхлэх нь</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Гурван алхам
          </h2>
        </div>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-hover px-6 py-12 text-center text-white shadow-lg sm:px-16 sm:py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-4xl">
            Танай салонд ийм сайт хэрэгтэй юу?
          </h2>
          <p className="mx-auto mt-4 max-w-md leading-7 text-white/85">
            Салоныхоо нэр, үйлчилгээ, үнийг өгөхөд л ийм сайт болж танд буцаж
            очно. Хэдхэн хоногт.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/book"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.02]"
            >
              Захиалгыг туршиж үзэх
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/40 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Жишээ сайт руу орох
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
