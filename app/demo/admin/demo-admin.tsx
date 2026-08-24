"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/*
  Админ талын ҮЗҮҮЛЭН. Жинхэнэ админ (`/admin`) нэвтрэх эрхээр хамгаалагдсан
  хэвээр — энэ хуудас түүнийг огт хөнддөггүй, бүх өгөгдөл нь энэ файл дотор
  бичигдсэн жишээ. Ингэснээр салоны эзэнд нууц үг өгөхгүйгээр, жинхэнэ
  захиалгыг эрсдэлд оруулахгүйгээр удирдлагын хэсгээ үзүүлж болно.
*/

type Status = "pending" | "confirmed" | "cancelled";

type Booking = {
  code: string;
  name: string;
  phone: string;
  service: string;
  staff: string;
  time: string;
  price: number;
  status: Status;
  fresh?: boolean;
};

const money = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

const initialBookings: Booking[] = [
  { code: "LM-4821", name: "Б. Ариунаа", phone: "9911 2233", service: "Үс засалт", staff: "Сараа", time: "15:00", price: 35000, status: "pending" },
  { code: "LM-4820", name: "Д. Мөнхөө", phone: "9955 8080", service: "Гэрэл будалт", staff: "Номин", time: "16:30", price: 120000, status: "confirmed" },
  { code: "LM-4819", name: "С. Оюун", phone: "8811 4455", service: "Гар засал", staff: "Болор", time: "18:00", price: 45000, status: "confirmed" },
  { code: "LM-4818", name: "Т. Энхжин", phone: "9019 7766", service: "Сормуус суулгац", staff: "Номин", time: "11:00", price: 90000, status: "confirmed" },
  { code: "LM-4817", name: "Г. Баяраа", phone: "9505 3311", service: "Үс засалт", staff: "Сараа", time: "10:00", price: 35000, status: "cancelled" },
];

const walkIns = [
  { name: "Х. Золжаргал", phone: "9977 1212", service: "Нүүр будалт", staff: "Номин", price: 75000 },
  { name: "Ц. Сувдаа", phone: "8800 6543", service: "Хумсны засал", staff: "Болор", price: 45000 },
  { name: "Ө. Тэмүүлэн", phone: "9911 0099", service: "Үс засалт", staff: "Сараа", price: 35000 },
];

const services = [
  { name: "Үс засалт", dur: "45 мин", price: 35000, sale: 0 },
  { name: "Гэрэл будалт", dur: "90 мин", price: 140000, sale: 120000 },
  { name: "Нүүр будалт", dur: "60 мин", price: 75000, sale: 0 },
  { name: "Хумсны засал", dur: "60 мин", price: 45000, sale: 0 },
  { name: "Сормуус суулгац", dur: "120 мин", price: 90000, sale: 0 },
];

const team = [
  { name: "Сараа", title: "Ахлах мастер", emoji: "💇‍♀️", skills: "Үс засалт · Гэрэл будалт" },
  { name: "Номин", title: "Гоо сайхны мэргэжилтэн", emoji: "🌸", skills: "Нүүр будалт · Сормуус" },
  { name: "Болор", title: "Хумсны мастер", emoji: "💅", skills: "Гар засал · Хумсны засал" },
];

const week = [
  { d: "Да", v: 38 },
  { d: "Мя", v: 52 },
  { d: "Лх", v: 44 },
  { d: "Пү", v: 66 },
  { d: "Ба", v: 58 },
  { d: "Бя", v: 80 },
  { d: "Ня", v: 72 },
];

const nav = [
  { key: "dash", label: "Хянах самбар", icon: "📊" },
  { key: "bookings", label: "Захиалгууд", icon: "🗓️" },
  { key: "revenue", label: "Орлого", icon: "💰" },
  { key: "services", label: "Үйлчилгээ", icon: "✨" },
  { key: "staff", label: "Мастерууд", icon: "💇‍♀️" },
  { key: "settings", label: "Тохиргоо", icon: "⚙️" },
] as const;

type NavKey = (typeof nav)[number]["key"];

export default function DemoAdmin() {
  const [tab, setTab] = useState<NavKey>("dash");
  const [bookings, setBookings] = useState(initialBookings);
  const [toast, setToast] = useState<string | null>(null);
  const [nextWalkIn, setNextWalkIn] = useState(0);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const active = bookings.filter((b) => b.status !== "cancelled");
  const dayTotal = useMemo(
    () => active.reduce((sum, b) => sum + b.price, 0),
    [active],
  );

  const setStatus = (code: string, status: Status) => {
    setBookings((list) =>
      list.map((b) => (b.code === code ? { ...b, status, fresh: false } : b)),
    );
    setToast(
      status === "confirmed"
        ? "Захиалга баталгаажлаа — үйлчлүүлэгчид мэдэгдэл очлоо"
        : "Захиалга цуцлагдлаа",
    );
    window.setTimeout(() => setToast(null), 3000);
  };

  /* Шинэ захиалга ирэхэд юу болдгийг үзүүлнэ: жагсаалтын толгойд нэмэгдэж,
     "хүлээгдэж буй" тоо өсөж, мэдэгдэл гарч ирнэ. */
  const simulateBooking = () => {
    const w = walkIns[nextWalkIn % walkIns.length];
    setNextWalkIn((n) => n + 1);
    setBookings((list) => [
      {
        code: `LM-${4822 + nextWalkIn}`,
        name: w.name,
        phone: w.phone,
        service: w.service,
        staff: w.staff,
        time: ["12:30", "14:00", "19:00"][nextWalkIn % 3],
        price: w.price,
        status: "pending",
        fresh: true,
      },
      ...list,
    ]);
    setTab("bookings");
    setToast(`🔔 Шинэ захиалга: ${w.name} — ${w.service}`);
    window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Хажуугийн цэс — өргөн дэлгэцэд */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Link href="/demo" className="flex items-baseline gap-1.5 px-2">
          <span className="font-display text-xl font-semibold text-foreground">Lumière</span>
          <span className="text-primary">✦</span>
        </Link>
        <span className="mt-2 inline-flex w-fit rounded-full bg-primary-soft px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-primary">
          DEMO
        </span>

        <nav className="mt-7 flex flex-col gap-1">
          {nav.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setTab(n.key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                tab === n.key
                  ? "bg-primary text-white"
                  : "text-foreground/80 hover:bg-surface-2"
              }`}
            >
              <span>{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.key === "bookings" && pending > 0 && (
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${
                    tab === n.key ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {pending}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={simulateBooking}
          className="mt-auto rounded-xl bg-surface-2 px-4 py-3 text-left text-xs leading-5 text-foreground transition-colors hover:bg-primary-soft"
        >
          🔔 <span className="font-medium">Шинэ захиалга ирүүлж үзэх</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            Мэдэгдэл хэрхэн ирэхийг үзүүлнэ
          </span>
        </button>
        <Link
          href="/demo"
          className="mt-3 px-2 text-xs text-muted transition-colors hover:text-primary"
        >
          ← Танилцуулга руу буцах
        </Link>
      </aside>

      {/* Утасны толгой ба цэс */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/demo" className="flex items-baseline gap-1.5">
            <span className="font-display text-lg font-semibold text-foreground">Lumière</span>
            <span className="text-primary">✦</span>
          </Link>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary">
            DEMO
          </span>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {nav.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setTab(n.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs transition-colors ${
                tab === n.key ? "bg-primary text-white" : "bg-surface-2 text-foreground/80"
              }`}
            >
              <span>{n.icon}</span>
              {n.label}
              {n.key === "bookings" && pending > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    tab === n.key ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">
          {tab === "dash" && (
            <Section
              title="Хянах самбар"
              note="Өнөөдрийн байдал. Жишээ өгөгдөл."
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Stat label="Өнөөдрийн захиалга" value={String(active.length)} sub="идэвхтэй" />
                <Stat label="Хүлээгдэж буй" value={String(pending)} sub="баталгаажаагүй" accent />
                <Stat label="Өнөөдрийн орлого" value={money(dayTotal)} sub="төлөвлөсөн" />
                <Stat label="Дундаж үнэлгээ" value="4.9" sub="24 сэтгэгдэл" />
              </div>

              <button
                type="button"
                onClick={simulateBooking}
                className="mt-5 w-full rounded-2xl bg-primary-soft px-5 py-4 text-left transition-colors hover:bg-primary-soft/70 lg:hidden"
              >
                <span className="text-sm font-medium text-primary">
                  🔔 Шинэ захиалга ирүүлж үзэх
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Захиалга ирэхэд юу болдгийг үзүүлнэ
                </span>
              </button>

              <h3 className="mt-8 font-display text-lg font-semibold text-foreground">
                Өнөөдрийн хуваарь
              </h3>
              <ul className="mt-4 space-y-2.5">
                {active
                  .slice()
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((b) => (
                    <li
                      key={b.code}
                      className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[0_1px_2px_rgba(46,39,35,0.04)]"
                    >
                      <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {b.time}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {b.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {b.service} · {b.staff}
                        </span>
                      </span>
                      <StatusChip status={b.status} />
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          {tab === "bookings" && (
            <Section
              title="Захиалгууд"
              note="Хүлээгдэж буйг баталгаажуулах юм уу цуцлана. Үйлчлүүлэгчид мэдэгдэл автоматаар очно."
            >
              <ul className="space-y-3">
                {bookings.map((b) => (
                  <li
                    key={b.code}
                    className={`rounded-2xl bg-surface p-4 shadow-[0_1px_2px_rgba(46,39,35,0.04)] ${
                      b.fresh ? "animate-fade-up ring-2 ring-primary/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                        {b.name.slice(3, 4)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {b.name}
                          </p>
                          <span className="font-mono text-[11px] text-muted">{b.code}</span>
                          {b.fresh && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                              ШИНЭ
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {b.service} · {b.staff} · {b.time} · {money(b.price)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{b.phone}</p>
                      </div>
                      <StatusChip status={b.status} />
                    </div>

                    {b.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStatus(b.code, "confirmed")}
                          className="flex-1 rounded-full bg-primary py-2.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
                        >
                          ✓ Баталгаажуулах
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(b.code, "cancelled")}
                          className="flex-1 rounded-full bg-surface-2 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-border/60"
                        >
                          ✕ Цуцлах
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {tab === "revenue" && (
            <Section title="Орлого" note="Өдөр, 7 хоног, сараар харна.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Энэ сар" value="4.8 сая₮" sub="+18% өссөн" accent />
                <Stat label="Энэ 7 хоног" value="1.2 сая₮" sub="41 захиалга" />
                <Stat label="Дундаж дүн" value={money(58000)} sub="нэг захиалга" />
              </div>

              <div className="mt-8 rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(46,39,35,0.04)]">
                <p className="text-sm font-medium text-foreground">7 хоногийн орлого</p>
                <div className="mt-5 flex h-36 items-end gap-2">
                  {week.map((w) => (
                    <span
                      key={w.d}
                      style={{ height: `${w.v}%` }}
                      className={`flex-1 rounded-t-lg ${
                        w.v === 80 ? "bg-primary" : "bg-primary-soft"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex gap-2 text-center text-[11px] text-muted">
                  {week.map((w) => (
                    <span key={w.d} className="flex-1">
                      {w.d}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="mt-8 font-display text-lg font-semibold text-foreground">
                Хамгийн орлоготой үйлчилгээ
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { n: "Гэрэл будалт", v: 1680000, p: 100 },
                  { n: "Сормуус суулгац", v: 990000, p: 59 },
                  { n: "Үс засалт", v: 735000, p: 44 },
                  { n: "Хумсны засал", v: 450000, p: 27 },
                ].map((r) => (
                  <li key={r.n} className="rounded-2xl bg-surface px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-foreground">{r.n}</span>
                      <span className="shrink-0 font-medium tabular-nums text-primary">
                        {money(r.v)}
                      </span>
                    </div>
                    <span className="mt-2 block h-1.5 rounded-full bg-surface-2">
                      <span
                        style={{ width: `${r.p}%` }}
                        className="block h-full rounded-full bg-primary/70"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {tab === "services" && (
            <Section
              title="Үйлчилгээ"
              note="Үнэ, хугацаа, хямдралыг та өөрөө хэдийд ч засна."
            >
              <ul className="space-y-2.5">
                {services.map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(46,39,35,0.04)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {s.name}
                      </span>
                      <span className="block text-xs text-muted">{s.dur}</span>
                    </span>
                    <span className="shrink-0 text-right text-sm">
                      {s.sale ? (
                        <>
                          <span className="mr-2 text-xs text-muted line-through">
                            {money(s.price)}
                          </span>
                          <span className="font-semibold text-primary">{money(s.sale)}</span>
                        </>
                      ) : (
                        <span className="font-semibold text-foreground">{money(s.price)}</span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted">
                      Засах
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {tab === "staff" && (
            <Section title="Мастерууд" note="Хэн ямар үйлчилгээ хийхийг тохируулна.">
              <ul className="grid gap-3 sm:grid-cols-2">
                {team.map((m) => (
                  <li
                    key={m.name}
                    className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-[0_1px_2px_rgba(46,39,35,0.04)]"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl">
                      {m.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {m.name}
                      </span>
                      <span className="block text-xs text-primary">{m.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {m.skills}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {tab === "settings" && (
            <Section
              title="Тохиргоо"
              note="Салоны нэр, цаг, урьдчилгаа — бүгд энд. Үзүүлэн тул хадгалагдахгүй."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Fake label="Салоны нэр" value="Lumière" />
                <Fake label="Уриа" value="Гоо сайхны студи" />
                <Fake label="Утас" value="7700 1234" />
                <Fake label="Имэйл" value="salon@example.mn" />
                <Fake label="Ажиллах цаг" value="10:00 – 20:00" />
                <Fake label="Амралтын өдөр" value="Ням" />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(46,39,35,0.04)]">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    Урьдчилгаа шаардах
                  </span>
                  <span className="block text-xs text-muted">
                    QPay-ээр {money(10000)} төлж баталгаажуулна
                  </span>
                </span>
                <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-primary p-1">
                  <span className="ml-auto h-4 w-4 rounded-full bg-white" />
                </span>
              </div>
            </Section>
          )}
        </div>
      </main>

      {/* Мэдэгдэл */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <p className="animate-fade-up rounded-full bg-foreground px-5 py-3 text-center text-sm text-background shadow-lg">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 ${
        accent ? "bg-primary-soft" : "bg-surface shadow-[0_1px_2px_rgba(46,39,35,0.04)]"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const map = {
    pending: { t: "Хүлээгдэж буй", c: "bg-accent/15 text-accent" },
    confirmed: { t: "Баталгаажсан", c: "bg-primary-soft text-primary" },
    cancelled: { t: "Цуцлагдсан", c: "bg-surface-2 text-muted" },
  }[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${map.c}`}>
      {map.t}
    </span>
  );
}

function Fake({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-3 shadow-[0_1px_2px_rgba(46,39,35,0.04)]">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
