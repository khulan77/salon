import { createHmac, timingSafeEqual } from "node:crypto";

/*
  Имэйлээс шууд баталгаажуулах холбоосын гарын үсэг.

  Админ шинэ захиалгын мэдэгдэл авмагцаа сайт руу орж, нэвтэрч, захиалгаа
  хайх шаардлагагүй байх ёстой — имэйл дэх товчийг дарахад л болно. Гэхдээ
  холбоос нь таамаглахын аргагүй байх ёстой тул захиалгын id-г HMAC-SHA256
  гарын үсгээр битүүмжилнэ. Нууц түлхүүр зөвхөн серверт байдаг тул хэн ч
  өөрөө хүчинтэй холбоос зохиож чадахгүй.

  Түлхүүр тохируулаагүй бол холбоос ҮҮСГЭХГҮЙ (имэйл хуучнаараа явна) —
  хамгаалалтгүй холбоос илгээхээс илүү аюулгүй.
*/

export type BookingAction = "confirm" | "cancel";

/** Холбоос хэдэн хоног хүчинтэй байх вэ. Захиалга ихэвчлэн ойрын өдрүүдэд. */
const TTL_DAYS = 30;

function secret(): string {
  // Тусад нь түлхүүр өгөөгүй бол Supabase-ийн нууц түлхүүрээс гаргаж авна —
  // тэр нь аль хэдийн зөвхөн серверт байдаг.
  return process.env.BOOKING_ACTION_SECRET || process.env.SUPABASE_SECRET_KEY || "";
}

export function isBookingActionConfigured(): boolean {
  return secret().length > 0;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Захиалгын id + үйлдлийг битүүмжилсэн богино текст. */
export function signBookingAction(id: string, action: BookingAction): string {
  const payload = Buffer.from(
    JSON.stringify({ id, action, exp: Date.now() + TTL_DAYS * 86_400_000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Хүчинтэй бол захиалгын id, үйлдлийг буцаана. Эс бөгөөс null. */
export function readBookingAction(
  token: string,
): { id: string; action: BookingAction } | null {
  if (!isBookingActionConfigured()) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  // `timingSafeEqual` урт нь тэнцүү биш бол шидэх тул урьдчилж шалгана.
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data?.id !== "string") return null;
    if (data.action !== "confirm" && data.action !== "cancel") return null;
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return { id: data.id, action: data.action };
  } catch {
    return null;
  }
}

/** Имэйлд тавих бүтэн хаяг. Түлхүүргүй бол null — товч огт харагдахгүй. */
export function bookingActionUrl(id: string, action: BookingAction): string | null {
  if (!isBookingActionConfigured()) return null;
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://salon-ecru-seven.vercel.app"
  ).replace(/\/$/, "");
  return `${base}/confirm/${signBookingAction(id, action)}`;
}
