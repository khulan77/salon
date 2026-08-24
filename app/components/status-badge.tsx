import type { BookingStatus } from "@/app/lib/types";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  done: "Дууссан",
  cancelled: "Цуцлагдсан",
  no_show: "Ирээгүй",
};

/** Төлөв өөрчлөх товчны бичиг. */
export const ACTION_LABELS: Record<BookingStatus, string> = {
  pending: "Хүлээлгэх",
  confirmed: "Батлах",
  done: "Дуусгах",
  no_show: "Ирээгүй",
  cancelled: "Цуцлах",
};

/**
 * Аль төлөвөөс аль төлөв рүү шилжихийг зөвшөөрөх вэ.
 *
 * Өмнө нь одоогийнхоос бусад БҮХ төлөв товч болж гардаг байсан тул "Дуусгах"
 * дарсны дараа "Батлах" гарч, аль хэдийн үйлчилчихсэн захиалгыг буцаах
 * боломжтой байв. Дууссан захиалга бол ЭЦСИЙН — цаашид шилжихгүй (алдаатай
 * бол устгана). Админ болон мастерын хуудас хоёулаа энэ дүрмийг дагана.
 */
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "done", "cancelled"],
  confirmed: ["done", "no_show", "cancelled"],
  done: [],
  // Андуурч цуцалсныг сэргээх боломж үлдээнэ (цаг нь сул бол л болно).
  cancelled: ["confirmed"],
  // "Ирээгүй" гэж андуурсан бол үйлчилсэн болгож засна.
  no_show: ["done"],
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
