/**
 * Захиалгын код/утасны дугаарыг зөвхөн тухайн төхөөрөмжийн localStorage-д
 * хадгална — ингэснээр үйлчлүүлэгч дараа орохдоо дахин бичихгүйгээр захиалгаа
 * хардаг. Сервер рүү илгээгддэггүй, зөвхөн хайлт хийхэд ашиглагдана.
 */
export type MyBookingEntry = { code: string; phone: string };

const STORAGE_KEY = "lumiere:my-bookings";

export function readEntries(): MyBookingEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // өгөгдөл эвдэрсэн эсвэл localStorage хаалттай
  }
}

function writeEntries(entries: MyBookingEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {
    // Хадгалах боломжгүй бол алгасана — гараар хайх нь ажилласан хэвээр.
  }
}

/** Кодыг жагсаалтын эхэнд нэмнэ (давхардвал шинэчилнэ). */
export function rememberEntry(entry: MyBookingEntry): MyBookingEntry[] {
  const next = [entry, ...readEntries().filter((e) => e.code !== entry.code)];
  writeEntries(next);
  return next;
}

export function forgetEntry(code: string): MyBookingEntry[] {
  const next = readEntries().filter((e) => e.code !== code);
  writeEntries(next);
  return next;
}
