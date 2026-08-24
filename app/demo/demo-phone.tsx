"use client";

import { useEffect, useState } from "react";

/*
  Утасны хүрээн дотор бүтээгдэхүүнээ "амьдаар" үзүүлэх хэсэг. Жинхэнэ өгөгдөл
  татахгүй — салон бүрт ямар ч тохиргоогүйгээр ажиллах ёстой. Дэлгэцүүд нь
  захиалгын жинхэнэ урсгалыг дуурайна.
*/

type Screen = { step: string; body: React.ReactNode };

const money = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

/* ── Үйлчлүүлэгчийн тал ─────────────────────────────────────────────── */

const customerScreens: Screen[] = [
  {
    step: "Үйлчилгээ",
    body: (
      <div className="space-y-2.5">
        {[
          { name: "Үс засалт", dur: "45 мин", price: 35000, on: true },
          { name: "Гэрэл будалт", dur: "90 мин", price: 120000 },
          { name: "Хумсны засал", dur: "60 мин", price: 45000 },
        ].map((s) => (
          <Row key={s.name} active={s.on}>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{s.name}</p>
              <p className="text-[11px] text-muted">{s.dur}</p>
            </div>
            <span className="shrink-0 text-[13px] font-semibold text-primary">
              {money(s.price)}
            </span>
          </Row>
        ))}
      </div>
    ),
  },
  {
    step: "Мастер",
    body: (
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { n: "Сараа", r: "Ахлах мастер", on: true },
          { n: "Номин", r: "Стилист" },
          { n: "Тэмүүлэн", r: "Колорист" },
        ].map((m) => (
          <div
            key={m.n}
            className={`flex flex-col items-center gap-1.5 rounded-2xl px-1.5 py-3 ${
              m.on ? "bg-primary-soft" : "bg-surface-2/60"
            }`}
          >
            <span
              className={`relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${
                m.on ? "bg-primary text-white" : "bg-surface text-muted"
              }`}
            >
              {m.n.slice(0, 1)}
              {m.on && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-[9px] text-primary">
                  ✓
                </span>
              )}
            </span>
            <p className="truncate text-[11px] font-medium text-foreground">{m.n}</p>
            <p className="text-center text-[9px] leading-tight text-muted">{m.r}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: "Огноо & цаг",
    body: (
      <div>
        <div className="flex gap-1.5">
          {[
            { d: "Пү", n: 21 },
            { d: "Ба", n: 22, on: true },
            { d: "Бя", n: 23 },
            { d: "Ня", n: 24, off: true },
          ].map((d) => (
            <div
              key={d.n}
              className={`flex flex-1 flex-col items-center rounded-2xl py-2 ${
                d.on
                  ? "bg-primary text-white"
                  : d.off
                    ? "bg-surface-2/50 text-muted/50"
                    : "bg-surface-2/70 text-foreground"
              }`}
            >
              <span className="text-[10px] opacity-80">{d.d}</span>
              <span className="text-sm font-semibold tabular-nums">{d.n}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["10:00", "11:00", "12:00", "14:00", "15:00", "16:30"].map((t, i) => (
            <span
              key={t}
              className={`rounded-full py-2 text-center text-[11px] font-medium tabular-nums ${
                i === 4
                  ? "bg-primary text-white"
                  : i === 1
                    ? "bg-surface-2/50 text-muted/40 line-through"
                    : "bg-surface-2/70 text-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-muted">
          Захиалагдсан цаг автоматаар хаагдана
        </p>
      </div>
    ),
  },
  {
    step: "Мэдээлэл",
    body: (
      <div className="space-y-2.5">
        <Fake label="Нэр" value="Б. Ариунаа" />
        <Fake label="Утас" value="9911 2233" />
        <div className="rounded-2xl bg-primary-soft/70 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-foreground/70">Урьдчилгаа</span>
            <span className="text-sm font-semibold text-primary">{money(10000)}</span>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            QPay-ээр төлөгдсөний дараа цаг баталгаажна
          </p>
        </div>
        <span className="block rounded-full bg-primary py-2.5 text-center text-[12px] font-medium text-white">
          QPay-ээр төлөх
        </span>
      </div>
    ),
  },
  {
    step: "Бэлэн",
    body: (
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-2xl text-primary">
          ✓
        </span>
        <p className="mt-4 font-display text-lg font-semibold text-foreground">
          Захиалга баталгаажлаа
        </p>
        <p className="mt-1 text-[11px] text-muted">Сануулга SMS-ээр очно</p>
        <dl className="mt-4 w-full space-y-2 rounded-2xl bg-surface-2/60 px-4 py-3 text-left text-[11px]">
          {[
            ["Үйлчилгээ", "Үс засалт"],
            ["Мастер", "Сараа"],
            ["Цаг", "8/22 · 15:00"],
            ["Төлбөр", money(35000)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    ),
  },
];

/* ── Салоны тал (админ) ─────────────────────────────────────────────── */

const adminScreens: Screen[] = [
  {
    step: "Хянах самбар",
    body: (
      <div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { k: "Өнөөдөр", v: "8", s: "захиалга" },
            { k: "Хүлээгдэж буй", v: "3", s: "баталгаажаагүй" },
            { k: "7 хоног", v: "1.2 сая₮", s: "орлого" },
            { k: "Үнэлгээ", v: "4.9", s: "24 сэтгэгдэл" },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl bg-surface-2/60 px-3 py-3">
              <p className="text-[10px] text-muted">{c.k}</p>
              <p className="mt-0.5 font-display text-lg font-semibold text-foreground">
                {c.v}
              </p>
              <p className="text-[9px] text-muted">{c.s}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-muted">
          Утаснаасаа ч, компьютероосоо ч хянана
        </p>
      </div>
    ),
  },
  {
    step: "Захиалгууд",
    body: (
      <div className="space-y-2.5">
        {[
          { n: "Б. Ариунаа", t: "15:00 · Үс засалт", st: "Хүлээгдэж буй", wait: true },
          { n: "Д. Мөнхөө", t: "16:30 · Будалт", st: "Баталгаажсан" },
          { n: "С. Оюун", t: "18:00 · Хумс", st: "Баталгаажсан" },
        ].map((b) => (
          <div key={b.n} className="flex items-center gap-2.5 rounded-2xl bg-surface-2/60 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
              {b.n.slice(3, 4)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-foreground">{b.n}</p>
              <p className="truncate text-[10px] text-muted">{b.t}</p>
            </div>
            {b.wait ? (
              <span className="flex shrink-0 gap-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] text-white">
                  ✓
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[11px] text-muted">
                  ✕
                </span>
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[9px] font-medium text-primary">
                {b.st}
              </span>
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    step: "Орлого",
    body: (
      <div>
        <p className="font-display text-2xl font-semibold text-foreground">4.8 сая₮</p>
        <p className="text-[10px] text-muted">Энэ сар · өнгөрсөн сараас 18% өссөн</p>
        <div className="mt-5 flex h-28 items-end gap-1.5">
          {[38, 52, 44, 66, 58, 80, 72].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-t-lg ${i === 5 ? "bg-primary" : "bg-primary-soft"}`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5 text-center text-[9px] text-muted">
          {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((d) => (
            <span key={d} className="flex-1">
              {d}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: "Тохиргоо",
    body: (
      <div className="space-y-2.5">
        <Fake label="Салоны нэр" value="Lumière Beauty" />
        <Fake label="Ажиллах цаг" value="10:00 – 20:00" />
        <div className="flex items-center justify-between rounded-2xl bg-surface-2/60 px-4 py-3">
          <span className="text-[11px] text-foreground">Урьдчилгаа шаардах</span>
          <span className="flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
            <span className="ml-auto h-4 w-4 rounded-full bg-white" />
          </span>
        </div>
        <p className="text-center text-[10px] leading-4 text-muted">
          Үйлчилгээ, үнэ, мастер, салбар — бүгдийг өөрөө нэмж, засна
        </p>
      </div>
    ),
  },
];

function Row({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
        active ? "bg-primary-soft" : "bg-surface-2/60"
      }`}
    >
      {children}
    </div>
  );
}

function Fake({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2/60 px-4 py-2.5">
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-[12px] text-foreground">{value}</p>
    </div>
  );
}

export default function DemoPhone() {
  const [side, setSide] = useState<"customer" | "admin">("customer");
  const [i, setI] = useState(0);
  // Хэрэглэгч өөрөө товшсон бол автомат гүйлгэлт зогсоно.
  const [auto, setAuto] = useState(true);

  const screens = side === "customer" ? customerScreens : adminScreens;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setI((v) => (v + 1) % screens.length), 3200);
    return () => clearInterval(id);
  }, [auto, screens.length]);

  const go = (next: number) => {
    setAuto(false);
    setI((next + screens.length) % screens.length);
  };

  const switchSide = (s: "customer" | "admin") => {
    setSide(s);
    setI(0);
    setAuto(false);
  };

  const screen = screens[i];

  return (
    <div className="flex flex-col items-center">
      {/* Аль талыг үзэхээ сонгоно */}
      <div className="inline-flex rounded-full bg-surface-2/70 p-1">
        {(
          [
            ["customer", "Үйлчлүүлэгчийн тал"],
            ["admin", "Салоны тал"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchSide(key)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
              side === key ? "bg-surface text-primary shadow-sm" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Утас */}
      <div className="mt-7 w-full max-w-[19rem]">
        <div className="rounded-[2.6rem] bg-foreground/90 p-2.5 shadow-[0_40px_70px_-40px_rgba(46,39,35,0.8)]">
          <div className="relative overflow-hidden rounded-[2.1rem] bg-background">
            {/* Notch */}
            <span className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-foreground/15" />

            {/* Дэлгэцийн толгой */}
            <div className="px-4 pb-3 pt-7">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-baseline gap-1 font-display text-sm font-semibold text-foreground">
                  Lumière <span className="text-primary">✦</span>
                </span>
                <span className="text-[10px] text-muted">
                  {side === "customer" ? "Цаг захиалга" : "Админ"}
                </span>
              </div>
              <p className="mt-2.5 text-[11px] font-medium text-primary">{screen.step}</p>
              <div className="mt-1.5 flex gap-1">
                {screens.map((_, n) => (
                  <span
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      n <= i ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Дэлгэцийн их бие — өндөр нь тогтмол тул алхам солиход үсрэхгүй */}
            <div key={`${side}-${i}`} className="animate-fade-up px-4 pb-6">
              <div className="min-h-[16.5rem]">{screen.body}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Хяналт */}
      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="Өмнөх алхам"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted shadow-sm transition-colors hover:text-primary"
        >
          ←
        </button>
        <div className="flex gap-2">
          {screens.map((s, n) => (
            <button
              key={s.step}
              type="button"
              onClick={() => go(n)}
              aria-label={s.step}
              className={`h-2 rounded-full transition-all ${
                n === i ? "w-6 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="Дараагийн алхам"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted shadow-sm transition-colors hover:text-primary"
        >
          →
        </button>
      </div>
    </div>
  );
}
