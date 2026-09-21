export default function CalendarLegend() {
  return (
    <details className="group mt-2 text-[11px] text-muted">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        Тэмдэглэгээ
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className="h-3 w-3 transition-transform group-open:rotate-180"
        >
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface-2/50 p-3 sm:w-fit sm:grid-cols-3 sm:gap-x-6">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] bg-emerald-600 text-[8px] font-bold text-white">✓</span>
          Баталгаажсан
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-[3px] bg-white ring-2 ring-inset ring-rose-400" />
          Баталгаажаагүй
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-3 shrink-0 items-center justify-center rounded-full bg-sky-600 px-0.5 text-[7px] font-bold tracking-[-0.15em] text-white">✓✓</span>
          Дууссан
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="text-sm leading-none text-amber-500">★</span>
          Тогтмол мастер
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true">👥</span>
          Хамт захиалсан
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="line-through opacity-60">Нэр</span>
          Ирээгүй
        </li>
      </ul>
    </details>
  );
}
