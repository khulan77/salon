import type { BookingStatus } from "@/app/lib/types";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  done: "Дууссан",
  cancelled: "Цуцлагдсан",
  no_show: "Ирээгүй",
};

const STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  done: "bg-sky-100 text-sky-800",
  cancelled: "bg-rose-100 text-rose-700",
  no_show: "bg-zinc-200 text-zinc-700",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
