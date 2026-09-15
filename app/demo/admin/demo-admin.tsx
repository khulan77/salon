"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoCalendar, { StatusBadge, type CalState } from "./demo-calendar";
import {
  WEEKDAYS,
  branchOf,
  branches,
  canDo,
  createBookings,
  dateOf,
  dayLabel,
  freeSlots,
  hhmm,
  incoming,
  itemInfo,
  money,
  packages,
  reviews as initialReviews,
  services,
  staff,
  type DemoBooking,
} from "./demo-data";

/*
  Админ талын ҮЗҮҮЛЭН. Жинхэнэ админ (`/admin`) нэвтрэх эрхээр хамгаалагдсан
  хэвээр — энэ хуудас түүнийг огт хөнддөггүй, бүх өгөгдөл нь `demo-data.ts`-д
  бичигдсэн жишээ. Ингэснээр салоны эзэнд нууц үг өгөхгүйгээр, жинхэнэ
  захиалгыг эрсдэлд оруулахгүйгээр удирдлагын хэсгээ үзүүлж болно.

  Бүх таб НЭГ захиалгын жагсаалтыг хуваалцана: хуанли дээр баталгаажуулбал
  самбарын "хүлээгдэж буй" тоо шууд буурна — жинхэнэ систем шиг.
*/

const nav = [
  { key: "dash", label: "Хянах самбар", icon: "📊" },
  { key: "calendar", label: "Хуанли", icon: "🗓️" },
  { key: "bookings", label: "Захиалгууд", icon: "📋" },
  { key: "revenue", label: "Орлого", icon: "💰" },
  { key: "services", label: "Үйлчилгээ", icon: "✨" },
  { key: "staff", label: "Мастерууд", icon: "💇‍♀️" },
  { key: "locations", label: "Салбарууд", icon: "🏢" },
  { key: "reviews", label: "Сэтгэгдэл", icon: "💬" },
  { key: "settings", label: "Тохиргоо", icon: "⚙️" },
] as const;

type NavKey = (typeof nav)[number]["key"];
type Filter = "pending" | "today" | "tomorrow" | "cancelled";

const isNavKey = (v: string | undefined): v is NavKey => nav.some((n) => n.key === v);

const noopSubscribe = () => () => {};

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export default function DemoAdmin({ initialTab }: { initialTab?: string }) {
  // Жишээ захиалгууд "өнөөдөр"-өөс хамаардаг. Сервер (UTC) ба хөтчийн (UTC+8)
  // огноо зөрж hydration алдаа гаргахгүйн тулд зөвхөн хөтөч дээр зурна.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <Skeleton />;
  return <AdminApp initialTab={isNavKey(initialTab) ? initialTab : "dash"} />;
}

function AdminApp({ initialTab }: { initialTab: NavKey }) {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [nowMin, setNowMin] = useState(nowMinutes);
  const [bookings, setBookings] = useState(() => createBookings(today, nowMinutes()));
  const [tab, setTab] = useState<NavKey>(initialTab);
  const [cal, setCal] = useState<CalState>({ day: 0, branchId: branches[0].id, view: "day" });
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [reviewList, setReviewList] = useState(initialReviews);
  const [incomingCount, setIncomingCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // "Яг одоо" шугам хуанли дээр урагшилна.
  useEffect(() => {
    const id = window.setInterval(() => setNowMin(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const switchTab = (key: NavKey) => {
    setTab(key);
    window.scrollTo({ top: 0 });
  };

  const openInCalendar = (b: DemoBooking) => {
    setCal({ day: b.day, branchId: branchOf(b.staffId), view: "day", openId: b.id });
    switchTab("calendar");
  };

  const setStatus = (b: DemoBooking, status: "confirmed" | "cancelled") => {
    setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status, fresh: false } : x)));
    notify(
      status === "confirmed"
        ? `✓ ${b.name} — баталгаажлаа. Үйлчлүүлэгчид SMS очлоо`
        : `${b.name} — захиалга цуцлагдлаа`,
    );
  };

  /* Онлайнаар шинэ захиалга орж ирэхийг дуурайна: хамгийн ойрын сул цагт
     хуанли дээр тодоор гарч, "хүлээгдэж буй" тоо өсөж, мэдэгдэл ирнэ. */
  const simulateBooking = () => {
    const w = incoming[incomingCount % incoming.length];
    const duration = itemInfo(w.item).durationMin;
    const after = Math.ceil((nowMin + 30) / 15) * 15;
    let slot: { staffId: string; day: number; start: number } | undefined;
    for (const day of [0, 1, 2, 3]) {
      for (const m of staff.filter((s) => s.branchId === "center" && canDo(s, w.item))) {
        const start = freeSlots(bookings, m.id, day, duration).find((t) => day > 0 || t >= after);
        if (start !== undefined) {
          slot = { staffId: m.id, day, start };
          break;
        }
      }
      if (slot) break;
    }
    if (!slot) {
      notify("Ойрын өдрүүдэд сул цаг олдсонгүй");
      return;
    }

    const found = slot;
    setIncomingCount((n) => n + 1);
    setBookings((list) => [
      ...list.map((b) => (b.fresh ? { ...b, fresh: false } : b)),
      {
        ...w,
        ...found,
        id: `w${list.length + 1}`,
        code: `LM-${5200 + list.length}`,
        status: "pending",
        paid: 10000,
        fresh: true,
      },
    ]);
    setCal({ day: found.day, branchId: "center", view: "day" });
    switchTab("calendar");
    notify(
      `🔔 Шинэ захиалга: ${w.name} — ${itemInfo(w.item).label}, ${dayLabel(today, found.day).toLowerCase()} ${hhmm(found.start)}`,
    );
  };

  const pending = bookings.filter((b) => b.status === "pending" && b.day >= 0);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Хажуугийн цэс — өргөн дэлгэцэд */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
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
              onClick={() => switchTab(n.key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                tab === n.key ? "bg-primary text-white" : "text-foreground/80 hover:bg-surface-2"
              }`}
            >
              <span>{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.key === "bookings" && pending.length > 0 && (
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${
                    tab === n.key ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {pending.length}
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
          <span className="mt-0.5 block text-[11px] text-muted">Хуанли дээр хэрхэн гарахыг үзүүлнэ</span>
        </button>
        <Link href="/demo" className="mt-3 px-2 text-xs text-muted transition-colors hover:text-primary">
          ← Танилцуулга руу буцах
        </Link>
      </aside>

      {/* Утасны толгой ба цэс */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link href="/demo" className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-display text-lg font-semibold text-foreground">Lumière</span>
            <span className="text-primary">✦</span>
          </Link>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary">
            DEMO
          </span>
          <button
            type="button"
            onClick={simulateBooking}
            aria-label="Шинэ захиалга ирүүлж үзэх"
            className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 text-xs font-medium text-primary"
          >
            🔔 Шинэ захиалга
          </button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {nav.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => switchTab(n.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs transition-colors ${
                tab === n.key ? "bg-primary text-white" : "bg-surface-2 text-foreground/80"
              }`}
            >
              <span>{n.icon}</span>
              {n.label}
              {n.key === "bookings" && pending.length > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    tab === n.key ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* `min-w-0` — өргөн хуанли main-ийг сунгалгүй, өөрөө хажуу тийш гүйлгэнэ. */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">
          {tab === "dash" && (
            <Dashboard
              bookings={bookings}
              pending={pending}
              nowMin={nowMin}
              avgRating={avg(reviewList.map((r) => r.rating))}
              reviewCount={reviewList.length}
              onPending={() => {
                setFilter("pending");
                switchTab("bookings");
              }}
              onTab={switchTab}
              onOpen={openInCalendar}
              onSimulate={simulateBooking}
            />
          )}

          {tab === "calendar" && (
            <DemoCalendar
              today={today}
              nowMin={nowMin}
              bookings={bookings}
              setBookings={setBookings}
              cal={cal}
              setCal={setCal}
              notify={notify}
            />
          )}

          {tab === "bookings" && (
            <Bookings
              today={today}
              bookings={bookings}
              filter={filter}
              setFilter={setFilter}
              query={query}
              setQuery={setQuery}
              onStatus={setStatus}
              onOpen={openInCalendar}
            />
          )}

          {tab === "revenue" && <Revenue today={today} bookings={bookings} />}

          {tab === "services" && <Services notify={notify} />}

          {tab === "staff" && (
            <Staff
              bookings={bookings}
              onCalendar={(branchId) => {
                setCal({ day: 0, branchId, view: "day" });
                switchTab("calendar");
              }}
            />
          )}

          {tab === "locations" && (
            <Locations
              bookings={bookings}
              onCalendar={(branchId) => {
                setCal({ day: 0, branchId, view: "day" });
                switchTab("calendar");
              }}
            />
          )}

          {tab === "reviews" && (
            <Reviews
              list={reviewList}
              onToggle={(id) => {
                const r = reviewList.find((x) => x.id === id);
                setReviewList((list) => list.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)));
                notify(r?.visible ? "Сайтаас нуусан" : "Сайтад нийтэд харагдана");
              }}
            />
          )}

          {tab === "settings" && <Settings />}
        </div>
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
          <p className="animate-fade-up rounded-full bg-foreground px-5 py-3 text-center text-sm text-background shadow-lg">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const priceOf = (b: DemoBooking) => itemInfo(b.item).price;
const staffName = (id: string) => staff.find((m) => m.id === id)?.name ?? "—";
const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "";

/* ── Хянах самбар ─────────────────────────────────────────────────── */

function Dashboard({
  bookings,
  pending,
  nowMin,
  avgRating,
  reviewCount,
  onPending,
  onTab,
  onOpen,
  onSimulate,
}: {
  bookings: DemoBooking[];
  pending: DemoBooking[];
  nowMin: number;
  avgRating: number;
  reviewCount: number;
  onPending: () => void;
  onTab: (key: NavKey) => void;
  onOpen: (b: DemoBooking) => void;
  onSimulate: () => void;
}) {
  const todays = bookings.filter((b) => b.day === 0 && b.status !== "cancelled");
  const earning = todays.filter((b) => b.status !== "no_show");
  const revenue = earning.reduce((sum, b) => sum + priceOf(b), 0);
  const paid = earning.reduce((sum, b) => sum + Math.min(b.paid, priceOf(b)), 0);
  const upcoming = todays
    .filter((b) => b.status !== "no_show" && b.start + itemInfo(b.item).durationMin > nowMin)
    .sort((a, b) => a.start - b.start)
    .slice(0, 6);

  const stats: { label: string; value: string; icon: string; tab: NavKey }[] = [
    { label: "Өнөөдрийн захиалга", value: String(todays.length), icon: "☀️", tab: "calendar" },
    { label: "Хүлээгдэж буй", value: String(pending.length), icon: "⏳", tab: "bookings" },
    { label: "Мастерууд", value: String(staff.length), icon: "💇‍♀️", tab: "staff" },
    { label: `Үнэлгээ · ${reviewCount} сэтгэгдэл`, value: avgRating.toFixed(1), icon: "⭐", tab: "reviews" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Хянах самбар</h1>
      <p className="mt-1 text-sm text-muted">Салоны өнөөдрийн байдал. Жишээ өгөгдөл.</p>

      {pending.length > 0 && (
        <button
          type="button"
          onClick={onPending}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-left text-white shadow-sm transition-transform hover:scale-[1.01] sm:px-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">⏳</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{pending.length} захиалга хүлээгдэж байна</span>
            <span className="block text-xs text-white/80">Баталгаажуулах эсэхийг шийднэ үү</span>
          </span>
          <span aria-hidden>→</span>
        </button>
      )}

      <div className="mt-3 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary-soft via-surface-2/70 to-surface px-5 py-6 sm:px-7">
        <p className="text-xs text-muted sm:text-sm">Өнөөдрийн орлого · бүх салбар</p>
        <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {money(revenue)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Төлөгдсөн <b className="text-emerald-700">{money(paid)}</b> · Үлдэгдэл{" "}
          <b className="text-foreground">{money(Math.max(0, revenue - paid))}</b>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onTab(s.tab)}
            className="flex items-center gap-3 rounded-2xl bg-surface-2/60 px-3.5 py-3.5 text-left transition-colors hover:bg-primary-soft/70"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">{s.icon}</span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-none text-foreground sm:text-2xl">
                {s.value}
              </span>
              <span className="mt-1 block truncate text-[11px] text-muted sm:text-xs">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSimulate}
        className="mt-3 w-full rounded-2xl bg-primary-soft/60 px-5 py-4 text-left transition-colors hover:bg-primary-soft lg:hidden"
      >
        <span className="text-sm font-medium text-primary">🔔 Шинэ захиалга ирүүлж үзэх</span>
        <span className="mt-0.5 block text-xs text-muted">Онлайн захиалга хуанли дээр хэрхэн гарахыг үзүүлнэ</span>
      </button>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">Дараагийн захиалгууд</h2>
        <button
          type="button"
          onClick={() => onTab("calendar")}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Хуанли →
        </button>
      </div>
      {upcoming.length === 0 ? (
        <p className="card mt-4 p-6 text-center text-sm text-muted">Өнөөдрийн захиалгууд дууслаа 🌙</p>
      ) : (
        <ul className="card mt-4 divide-y divide-border/60 overflow-hidden">
          {upcoming.map((b) => {
            const info = itemInfo(b.item);
            const now = b.start <= nowMin;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onOpen(b)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/50 sm:px-5"
                >
                  <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-primary">
                    {hhmm(b.start)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {b.name}
                      {now && (
                        <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          ЯГ ОДОО
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {info.label} · {staffName(b.staffId)} · {branchName(branchOf(b.staffId))}
                    </span>
                  </span>
                  <StatusBadge status={b.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Захиалгууд ───────────────────────────────────────────────────── */

function Bookings({
  today,
  bookings,
  filter,
  setFilter,
  query,
  setQuery,
  onStatus,
  onOpen,
}: {
  today: Date;
  bookings: DemoBooking[];
  filter: Filter;
  setFilter: (f: Filter) => void;
  query: string;
  setQuery: (q: string) => void;
  onStatus: (b: DemoBooking, status: "confirmed" | "cancelled") => void;
  onOpen: (b: DemoBooking) => void;
}) {
  const matchers: Record<Filter, (b: DemoBooking) => boolean> = {
    pending: (b) => b.status === "pending" && b.day >= 0,
    today: (b) => b.day === 0,
    tomorrow: (b) => b.day === 1,
    cancelled: (b) => b.status === "cancelled" && b.day >= 0,
  };
  const chips: { key: Filter; label: string }[] = [
    { key: "pending", label: "Хүлээгдэж буй" },
    { key: "today", label: "Өнөөдөр" },
    { key: "tomorrow", label: "Маргааш" },
    { key: "cancelled", label: "Цуцлагдсан" },
  ];

  const q = query.trim().toLowerCase().replace(/\s/g, "");
  const list = bookings
    .filter((b) =>
      q
        ? `${b.name}${b.phone}${b.code}`.toLowerCase().replace(/\s/g, "").includes(q)
        : matchers[filter](b),
    )
    // Шинээр ирсэн нь хамгийн дээр.
    .sort((a, b) => Number(Boolean(b.fresh)) - Number(Boolean(a.fresh)) || a.day - b.day || a.start - b.start);
  const shown = list.slice(0, 40);

  return (
    <Section
      title="Захиалгууд"
      note="Хүлээгдэж буйг баталгаажуулах юм уу цуцлана. Үйлчлүүлэгчид мэдэгдэл автоматаар очно."
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Нэр, утас эсвэл код (LM-4…)"
        className="field"
      />
      {!q && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {chips.map((c) => {
            const count = bookings.filter(matchers[c.key]).length;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
                  filter === c.key ? "bg-foreground text-background" : "bg-surface-2 text-foreground/80"
                }`}
              >
                {c.label}
                <span className={`text-xs ${filter === c.key ? "text-background/70" : "text-muted"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="card mt-4 p-6 text-center text-sm text-muted">
          {q ? "Олдсонгүй." : "Энд захиалга алга — бүгд цэгцтэй 🎉"}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((b) => {
            const info = itemInfo(b.item);
            return (
              <li
                key={b.id}
                className={`card p-4 ${b.fresh ? "animate-fade-up ring-2 ring-primary/40" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {b.name.slice(3, 4)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
                      <span className="font-mono text-[11px] text-muted">{b.code}</span>
                      {b.fresh && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                          ШИНЭ
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {dayLabel(today, b.day)} · {hhmm(b.start)} · {info.label} · {staffName(b.staffId)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {money(info.price)}
                      {b.paid > 0 && ` · ${money(Math.min(b.paid, info.price))} төлсөн`} · {b.phone}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onStatus(b, "confirmed")}
                        className="min-h-10 flex-1 rounded-full bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
                      >
                        ✓ Баталгаажуулах
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatus(b, "cancelled")}
                        className="min-h-10 flex-1 rounded-full bg-surface-2 px-4 text-xs font-medium text-foreground transition-colors hover:bg-border/60"
                      >
                        ✕ Цуцлах
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpen(b)}
                    className="min-h-10 rounded-full px-3 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                  >
                    🗓️ Хуанлид харах
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > shown.length && (
        <p className="mt-4 text-center text-xs text-muted">
          + {list.length - shown.length} захиалга. Хайлтаар нарийсгана уу.
        </p>
      )}
    </Section>
  );
}

/* ── Орлого ───────────────────────────────────────────────────────── */

function Revenue({ today, bookings }: { today: Date; bookings: DemoBooking[] }) {
  // Сүүлийн 7 хоногийн бодит орлого (өнөөдрийг оруулаад) — хуанлитай нэг өгөгдөл.
  const earned = bookings.filter(
    (b) => b.day >= -6 && b.day <= 0 && (b.status === "done" || (b.day === 0 && b.status === "confirmed")),
  );
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = i - 6;
    return {
      day,
      label: day === 0 ? "Өнөө" : WEEKDAYS[dateOf(today, day).getDay()].slice(0, 2),
      total: earned.filter((b) => b.day === day).reduce((sum, b) => sum + priceOf(b), 0),
    };
  });
  const max = Math.max(1, ...week.map((w) => w.total));
  const weekTotal = week.reduce((sum, w) => sum + w.total, 0);

  const byService = services
    .map((s) => ({
      name: `${s.emoji} ${s.name}`,
      total: earned.filter((b) => b.item === `svc:${s.id}`).reduce((sum, b) => sum + priceOf(b), 0),
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const byStaff = staff
    .map((m) => ({
      name: `${m.name} · ${branchName(m.branchId)}`,
      total: earned.filter((b) => b.staffId === m.id).reduce((sum, b) => sum + priceOf(b), 0),
    }))
    .sort((a, b) => b.total - a.total);

  const payments = bookings
    .filter((b) => b.paid > 0 && b.day <= 1 && b.day >= -2)
    .sort((a, b) => Number(Boolean(b.fresh)) - Number(Boolean(a.fresh)) || b.day - a.day || b.start - a.start)
    .slice(0, 6);

  return (
    <Section title="Орлого" note="Сүүлийн 7 хоног. Аль мастер, аль үйлчилгээ хэр орлоготой вэ.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="7 хоногийн орлого" value={money(weekTotal)} sub="дууссан захиалгаас" accent />
        <Stat label="Дууссан захиалга" value={String(earned.length)} sub="7 хоногт" />
        <Stat
          label="Дундаж дүн"
          value={money(Math.round(weekTotal / Math.max(1, earned.length) / 1000) * 1000)}
          sub="нэг захиалга"
        />
      </div>

      <div className="card mt-6 p-5">
        <p className="text-sm font-medium text-foreground">Өдөр бүрийн орлого</p>
        <div className="mt-5 flex h-36 items-end gap-2">
          {week.map((w) => (
            <span
              key={w.day}
              title={money(w.total)}
              style={{ height: `${Math.max(4, (w.total / max) * 100)}%` }}
              className={`flex-1 rounded-t-lg ${w.total === max ? "bg-primary" : "bg-primary-soft"}`}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-2 text-center text-[11px] text-muted">
          {week.map((w) => (
            <span key={w.day} className="flex-1">
              {w.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Ranking title="Үйлчилгээгээр" rows={byService} />
        <Ranking title="Мастераар" rows={byStaff} />
      </div>

      <h3 className="mt-8 font-display text-lg font-semibold text-foreground">Сүүлийн төлбөрүүд</h3>
      <p className="mt-1 text-xs text-muted">QPay урьдчилгаа ба үйлчилгээний дараах төлбөр</p>
      <ul className="card mt-4 divide-y divide-border/60 overflow-hidden">
        {payments.map((b) => {
          const full = b.paid >= priceOf(b);
          return (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm">
                {full ? "💳" : "📱"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{b.name}</span>
                <span className="block truncate text-xs text-muted">
                  {full ? "Бүтэн төлбөр" : "QPay урьдчилгаа"} · {dayLabel(today, b.day)} · {b.code}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">
                +{money(Math.min(b.paid, priceOf(b)))}
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Ranking({ title, rows }: { title: string; rows: { name: string; total: number }[] }) {
  const top = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{r.name}</span>
              <span className="shrink-0 font-medium tabular-nums text-primary">{money(r.total)}</span>
            </div>
            <span className="mt-1.5 block h-1.5 rounded-full bg-surface-2">
              <span
                style={{ width: `${(r.total / top) * 100}%` }}
                className="block h-full rounded-full bg-primary/70"
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Үйлчилгээ ба багц ────────────────────────────────────────────── */

function Services({ notify }: { notify: (m: string) => void }) {
  const edit = () => notify("Үзүүлэн — жинхэнэ системд энд үнэ, хугацааг засна");
  return (
    <Section title="Үйлчилгээ" note="Үнэ, хугацаа, хямдралыг та өөрөө хэдийд ч засна.">
      <ul className="card divide-y divide-border/60 overflow-hidden">
        {services.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg">
              {s.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{s.name}</span>
              <span className="block text-xs text-muted">{s.durationMin} мин</span>
            </span>
            <span className="shrink-0 text-right text-sm">
              {s.oldPrice && (
                <span className="mr-2 text-xs text-muted line-through">{money(s.oldPrice)}</span>
              )}
              <span className={`font-semibold ${s.oldPrice ? "text-primary" : "text-foreground"}`}>
                {money(s.price)}
              </span>
            </span>
            <button
              type="button"
              onClick={edit}
              className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted transition-colors hover:text-primary"
            >
              Засах
            </button>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 font-display text-lg font-semibold text-foreground">🎁 Багц</h3>
      <p className="mt-1 text-xs text-muted">Хэд хэдэн үйлчилгээг нэг дор, хямдруулж зарна.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {packages.map((p) => {
          const parts = services.filter((s) => p.serviceIds.includes(s.id));
          const full = parts.reduce((sum, s) => sum + s.price, 0);
          return (
            <li key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">
                  {p.emoji} {p.name}
                </p>
                <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                  −{money(full - p.price)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{parts.map((s) => s.name).join(" + ")}</p>
              <p className="mt-3 text-sm">
                <span className="mr-2 text-xs text-muted line-through">{money(full)}</span>
                <span className="font-semibold text-primary">{money(p.price)}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ── Мастерууд ────────────────────────────────────────────────────── */

function Staff({
  bookings,
  onCalendar,
}: {
  bookings: DemoBooking[];
  onCalendar: (branchId: string) => void;
}) {
  return (
    <Section title="Мастерууд" note="Хэн ямар үйлчилгээ хийх, аль салбарт ажиллахыг тохируулна.">
      <ul className="grid gap-3 sm:grid-cols-2">
        {staff.map((m) => {
          const todays = bookings.filter((b) => b.staffId === m.id && b.day === 0 && b.status !== "cancelled");
          return (
            <li key={m.id} className="card flex items-center gap-4 p-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl">
                {m.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{m.name}</span>
                <span className="block text-xs text-primary">
                  {m.title} · {branchName(m.branchId)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {services
                    .filter((s) => m.serviceIds.includes(s.id))
                    .map((s) => s.name)
                    .join(" · ")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onCalendar(m.branchId)}
                className="shrink-0 rounded-full bg-surface-2 px-3 py-2 text-center text-xs text-foreground transition-colors hover:bg-primary-soft"
              >
                <b className="block text-sm">{todays.length}</b>
                өнөөдөр
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-xs leading-5 text-muted">
        🔐 Ажилтан бүр өөрийн нэвтрэх эрхтэй — мастер зөвхөн өөрийн цагийг хардаг.
      </p>
    </Section>
  );
}

/* ── Салбарууд ────────────────────────────────────────────────────── */

function Locations({
  bookings,
  onCalendar,
}: {
  bookings: DemoBooking[];
  onCalendar: (branchId: string) => void;
}) {
  return (
    <Section title="Салбарууд" note="Салбар бүр өөрийн хаяг, ажиллах цаг, мастертай.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {branches.map((l) => {
          const team = staff.filter((m) => m.branchId === l.id);
          const todays = bookings.filter(
            (b) => b.day === 0 && b.status !== "cancelled" && team.some((m) => m.id === b.staffId),
          );
          return (
            <li key={l.id} className="card flex flex-col p-5">
              <p className="font-display text-lg font-semibold text-foreground">🏢 {l.name}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li>📍 {l.address}</li>
                <li>📞 {l.phone}</li>
                <li>
                  🕙 {hhmm(l.openMin)}–{hhmm(l.closeMin)}
                  {l.closedDays.length > 0
                    ? ` · ${l.closedDays.map((d) => WEEKDAYS[d]).join(", ")} амарна`
                    : " · өдөр бүр"}
                </li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex -space-x-2">
                  {team.map((m) => (
                    <span
                      key={m.id}
                      title={m.name}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-base ring-2 ring-surface"
                    >
                      {m.emoji}
                    </span>
                  ))}
                </span>
                <span className="text-xs text-muted">{team.length} мастер</span>
              </div>
              <button
                type="button"
                onClick={() => onCalendar(l.id)}
                className="mt-5 min-h-10 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                🗓️ Өнөөдөр {todays.length} захиалга — хуанли нээх
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ── Сэтгэгдэл ────────────────────────────────────────────────────── */

function Reviews({
  list,
  onToggle,
}: {
  list: typeof initialReviews;
  onToggle: (id: string) => void;
}) {
  return (
    <Section title="Сэтгэгдэл" note="Аль сэтгэгдэл сайтад харагдахыг та шийднэ.">
      <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm shadow-sm">
        <span className="text-accent">★</span>
        <b className="text-foreground">{avg(list.map((r) => r.rating)).toFixed(1)}</b>
        <span className="text-muted">· {list.length} сэтгэгдэл</span>
      </p>
      <ul className="mt-5 space-y-3">
        {list.map((r) => (
          <li key={r.id} className={`card p-5 transition-opacity ${r.visible ? "" : "opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-sm text-accent">
                  {"★".repeat(r.rating)}
                  <span className="text-border">{"★".repeat(5 - r.rating)}</span>
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={r.visible}
                aria-label="Сайтад харуулах"
                onClick={() => onToggle(r.id)}
                className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
                  r.visible ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${r.visible ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground/85">{r.text}</p>
            <p className="mt-2 text-[11px] text-muted">{r.visible ? "Сайтад харагдаж байна" : "Нуусан"}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ── Тохиргоо ─────────────────────────────────────────────────────── */

function Settings() {
  return (
    <Section title="Тохиргоо" note="Салоны нэр, лого, урьдчилгаа — бүгд энд. Үзүүлэн тул хадгалагдахгүй.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Fake label="Салоны нэр" value="Lumière" />
        <Fake label="Уриа" value="Гоо сайхны студи" />
        <Fake label="Утас" value="7700 1234" />
        <Fake label="Имэйл" value="salon@example.mn" />
        <Fake label="Ажиллах цаг" value="Салбар бүрт тусдаа" />
        <Fake label="Сануулга" value="Захиалгаас 2 цагийн өмнө SMS" />
      </div>
      <div className="card mt-4 flex items-center justify-between gap-4 px-5 py-4">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">Урьдчилгаа шаардах</span>
          <span className="block text-xs text-muted">QPay-ээр {money(10000)} төлж баталгаажуулна</span>
        </span>
        <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-primary p-1">
          <span className="ml-auto h-4 w-4 rounded-full bg-white" />
        </span>
      </div>
    </Section>
  );
}

/* ── Жижиг хэсгүүд ────────────────────────────────────────────────── */

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${accent ? "bg-primary-soft" : "bg-surface-2/60"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 truncate font-display text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function Fake({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2/60 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block" />
      <div className="flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-48 rounded-full bg-surface-2" />
          <div className="mt-6 h-28 rounded-[1.75rem] bg-surface-2/70" />
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface-2/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
