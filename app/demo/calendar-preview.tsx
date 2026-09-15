/*
  /demo хуудасны хуанлийн жижиг зураглал. Жинхэнэ хуанлийн хэв маягийг
  (мастер бүр багана, өнгөт блок, ✓, ★, 👥, "яг одоо" шугам) нэг харцаар
  ойлгуулна. Статик — дарж үзэх бол `/demo/admin?tab=calendar` руу орно.
*/

const OPEN = 10 * 60;
const CLOSE = 15 * 60;
const TOTAL = CLOSE - OPEN;
const NOW = 12 * 60 + 40;

type Block = {
  from: string;
  to: string;
  name: string;
  item: string;
  color: string;
  bar: string;
  mark?: "confirmed" | "pending" | "done";
  star?: boolean;
  group?: boolean;
  noShow?: boolean;
};

const columns: { name: string; initials: string; blocks: Block[] }[] = [
  {
    name: "Сараа",
    initials: "СА",
    blocks: [
      { from: "10:00", to: "10:45", name: "Т. Энхжин", item: "Үс засалт", color: "bg-rose-100 text-rose-950", bar: "bg-rose-400", mark: "done" },
      { from: "11:30", to: "13:00", name: "Б. Сарнай", item: "Гэрэл будалт", color: "bg-sky-100 text-sky-950", bar: "bg-sky-500", mark: "confirmed", star: true },
      { from: "13:30", to: "14:15", name: "Н. Хулан", item: "Үс засалт", color: "bg-amber-100 text-amber-950", bar: "bg-amber-500", mark: "confirmed", group: true },
    ],
  },
  {
    name: "Номин",
    initials: "НО",
    blocks: [
      { from: "10:00", to: "12:00", name: "Э. Номуун", item: "Сормуус", color: "bg-violet-100 text-violet-950", bar: "bg-violet-500", mark: "confirmed" },
      { from: "12:15", to: "13:15", name: "С. Уянга", item: "Нүүр будалт", color: "bg-emerald-100 text-emerald-950", bar: "bg-emerald-500", noShow: true },
      { from: "14:00", to: "15:00", name: "А. Дөлгөөн", item: "Сүйт бүсгүйн багц", color: "bg-orange-100 text-orange-950", bar: "bg-orange-400", mark: "confirmed", star: true },
    ],
  },
  {
    name: "Болор",
    initials: "БО",
    blocks: [
      { from: "10:00", to: "10:45", name: "Ц. Сувдаа", item: "Гар засал", color: "bg-teal-100 text-teal-950", bar: "bg-teal-500", mark: "done" },
      { from: "11:00", to: "12:00", name: "П. Оюука", item: "Хумсны засал", color: "bg-fuchsia-100 text-fuchsia-950", bar: "bg-fuchsia-400", mark: "pending" },
      { from: "13:30", to: "14:30", name: "Н. Хулан", item: "Хумсны засал", color: "bg-amber-100 text-amber-950", bar: "bg-amber-500", mark: "confirmed", group: true },
    ],
  },
];

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const pct = (min: number) => `${(min / TOTAL) * 100}%`;

export default function CalendarPreview() {
  return (
    <div className="card p-3 sm:p-5" aria-hidden>
      <div className="flex">
        <div className="w-10 shrink-0" />
        {columns.map((c) => (
          <div key={c.name} className="flex min-w-0 flex-1 items-center gap-1.5 border-l border-border/60 px-2 pb-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[9px] font-semibold text-primary">
              {c.initials}
            </span>
            <span className="truncate text-xs font-medium text-foreground">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="relative flex h-[19rem] sm:h-[22rem]">
        <div className="relative w-10 shrink-0">
          {[10, 11, 12, 13, 14, 15].map((h) => (
            <span
              key={h}
              style={{ top: pct(h * 60 - OPEN) }}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-muted"
            >
              {h}:00
            </span>
          ))}
          <span
            style={{ top: pct(NOW - OPEN) }}
            className="absolute right-0.5 z-20 -translate-y-1/2 rounded bg-rose-500 px-1 text-[9px] font-semibold tabular-nums text-white"
          >
            12:40
          </span>
        </div>

        {columns.map((c) => (
          <div key={c.name} className="relative min-w-0 flex-1 border-l border-border/60">
            {Array.from({ length: TOTAL / 30 }, (_, i) => (
              <span
                key={i}
                style={{ top: pct(i * 30) }}
                className={`absolute inset-x-0 border-t ${i % 2 === 0 ? "border-border/70" : "border-dashed border-border/40"}`}
              />
            ))}
            {c.blocks.map((b) => (
              <div
                key={b.from}
                style={{ top: pct(toMin(b.from) - OPEN), height: pct(toMin(b.to) - toMin(b.from)) }}
                className={`absolute inset-x-0.5 overflow-hidden rounded-md py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(46,39,35,0.08)] sm:inset-x-1 ${b.color} ${
                  b.noShow ? "opacity-50" : ""
                }`}
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${b.bar}`} />
                {b.mark === "done" && (
                  <span className="absolute right-1 top-1 rounded-full bg-sky-600 px-0.5 text-[7px] font-bold leading-3 tracking-[-0.15em] text-white">
                    ✓✓
                  </span>
                )}
                {(b.mark === "confirmed" || b.mark === "pending") && (
                  <span
                    className={`absolute right-1 top-1 flex h-3 w-3 items-center justify-center rounded-[3px] text-[8px] font-bold ${
                      b.mark === "confirmed"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-transparent ring-2 ring-inset ring-rose-400"
                    }`}
                  >
                    ✓
                  </span>
                )}
                <p className="truncate pr-3 text-[9px] tabular-nums opacity-70">
                  {b.from}–{b.to}
                  {b.group && " · 👥"}
                </p>
                <p className={`truncate text-[11px] font-semibold leading-tight ${b.noShow ? "line-through" : ""}`}>
                  {b.star && <span className="text-amber-500">★ </span>}
                  {b.name}
                </p>
                <p className="truncate text-[10px] opacity-75">{b.item}</p>
              </div>
            ))}
          </div>
        ))}

        <span
          style={{ top: pct(NOW - OPEN) }}
          className="pointer-events-none absolute left-10 right-0 z-10 h-px bg-rose-500"
        />
      </div>
    </div>
  );
}
