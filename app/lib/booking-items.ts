import type { BookingDraft, DraftItem } from "./types";

/*
  Олон үйлчилгээтэй захиалгын дүрэм — хөтөч, сервер хоёулаа үүнийг ашиглана.

  Өөр өөр мастерт оногдсон үйлчилгээнүүд ЗЭРЭГ эхэлнэ (маникюр + педикюр
  хоёр мастер нэг дор хийвэл үйлчлүүлэгч хоёр дахин хурдан гарна). Нэг
  мастерт хоёр үйлчилгээ оногдвол тэр нь ДАРААЛАН — эхнийх нь дуусмагц
  дараагийнх нь эхэлнэ.
*/

/** Нэг захиалгад сонгож болох үйлчилгээний дээд тоо. */
export const MAX_ITEMS = 3;

/** Ноорогийн үйлчилгээнүүд. Ганц үйлчилгээтэй (хуучин) ноорогт ч ажиллана. */
export function draftItems(draft: Pick<BookingDraft, "serviceId" | "staffId" | "items">): DraftItem[] {
  if (draft.items && draft.items.length > 0) return draft.items;
  return draft.serviceId ? [{ serviceId: draft.serviceId, staffId: draft.staffId }] : [];
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** Үйлчилгээ бүр хэдэн цагт эхлэхийг тооцно. */
export function scheduleItems(
  items: DraftItem[],
  start: string,
  durationOf: (serviceId: string) => number,
): (DraftItem & { time: string; durationMin: number })[] {
  const cursor = new Map<string, number>();
  return items.map((item) => {
    const at = cursor.get(item.staffId) ?? toMinutes(start);
    const durationMin = durationOf(item.serviceId);
    cursor.set(item.staffId, at + durationMin);
    return { ...item, time: toHHMM(at), durationMin };
  });
}

/** Бүх үйлчилгээ дуусах хүртэлх хугацаа — хамгийн их ачаалалтай мастерынхаар. */
export function totalSpanMin(
  items: DraftItem[],
  durationOf: (serviceId: string) => number,
): number {
  const perStaff = new Map<string, number>();
  for (const i of items) {
    perStaff.set(i.staffId, (perStaff.get(i.staffId) ?? 0) + durationOf(i.serviceId));
  }
  return Math.max(0, ...perStaff.values());
}
