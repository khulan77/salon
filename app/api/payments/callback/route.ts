import { resolveProvider } from "@/app/lib/payment/provider";
import { finalizePaidBooking } from "@/app/lib/payment/flow";

/**
 * Төлбөрийн системийн буцах дуудлага (webhook). Систем "төлөгдлөө" гэж
 * мэдэгдэхэд захиалгыг эцэслэн үүсгэнэ.
 *
 * Аюулгүй байдал: энэ хаяг нээлттэй тул биед нь итгэж болохгүй. Баталгаажуулах
 * ажлыг provider-ийн `verifyCallback` хийнэ (QPay бол төлбөрийг эргэж шалгана).
 *
 * Давхар дуудлага энгийн үзэгдэл — `finalizePaidBooking` нэг л захиалга
 * үүсгэдэг тул давхар захиалга үүсэхгүй.
 */
export async function POST(request: Request) {
  const provider = resolveProvider();

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // Зарим систем query string-ээр илгээдэг — биегүй ч байж болно.
  }

  const result = await provider.verifyCallback(request, body);
  if (!result) {
    return Response.json({ ok: false, error: "unverified" }, { status: 400 });
  }
  if (!result.paid) {
    return Response.json({ ok: true, ignored: "not_paid" });
  }

  const finalized = await finalizePaidBooking(result.paymentId);
  // Амжилтгүй байсан ч 200 буцаана — систем дахин дахин давтахаас сэргийлнэ.
  // Төлөв нь payments хүснэгтэд (refund_due) үлдэж, админд харагдана.
  return Response.json({ ok: finalized.ok });
}

/** Зарим систем холболтоо шалгахдаа GET явуулдаг. */
export async function GET() {
  return Response.json({ ok: true });
}
