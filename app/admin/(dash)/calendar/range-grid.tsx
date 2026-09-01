import Link from "next/link";

/*
  15/30 хоногийн тойм. Өдрийн торыг 30 хоногоор сунгавал уншигдахгүй болох тул
  өдөр бүрийг нэг нүд болгож, зөвхөн ХЭР ЗЭРЭГ ДҮҮРСЭН болохыг харуулна.
  Аль өдөр сул байгааг нэг харцаар олж, тэр өдөр рүү нь дарж ороод дэлгэрэнгүй
  хуваарийг харна.
*/

export type DayCell = {
  date: string;
  weekday: string;
  /** Захиалгын тоо (цуцлагдсанаас бусад). */
  count: number;
  /** Ачаалал 0–100. Хаалттай өдөрт утгагүй. */
  loadPercent: number;
  closed: boolean;
  isToday: boolean;
  isPast: boolean;
};

export default function RangeGrid({
  cells,
  hrefFor,
}: {
  cells: DayCell[];
  hrefFor: (date: string) => string;
}) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
      {cells.map((c) => (
        <Link
          key={c.date}
          href={hrefFor(c.date)}
          className={`flex flex-col rounded-2xl px-3 py-3 transition-colors ${
            c.isToday
              ? "bg-primary-soft ring-2 ring-primary"
              : c.closed
                ? "bg-surface-2/40"
                : "bg-surface-2/60 hover:bg-primary-soft/70"
          } ${c.isPast && !c.isToday ? "opacity-60" : ""}`}
        >
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-[11px] text-muted">{c.weekday}</span>
            <span className="font-display text-lg font-semibold leading-none text-foreground">
              {Number(c.date.slice(8))}
            </span>
          </div>

          {c.closed ? (
            <span className="mt-3 text-[11px] text-muted">Амарна</span>
          ) : (
            <>
              {/* Ачааллын зурвас — дүүрэх тусам ягаан нь уртасна. */}
              <span className="mt-3 block h-1.5 rounded-full bg-surface">
                <span
                  style={{ width: `${Math.min(100, c.loadPercent)}%` }}
                  className={`block h-full rounded-full ${
                    c.loadPercent >= 80 ? "bg-primary" : "bg-primary/60"
                  }`}
                />
              </span>
              <span className="mt-1.5 text-[11px] text-muted">
                {c.count > 0 ? `${c.count} захиалга · ${c.loadPercent}%` : "Сул"}
              </span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
