import "server-only";
import {
  createBooking,
  getAvailableSlots,
  getPackage,
  getPackageAvailableSlots,
  getPayment,
  getService,
  getSettings,
  getStaffMember,
  updatePayment,
} from "../db";
import { formatDate } from "../format";
import { newBookingEmail, sendEmail } from "../email";
import type { Booking, BookingDraft, Payment } from "../types";

/**
 * Урьдчилгаа төлөгдсөний дараа захиалгыг үүсгэх алхам.
 *
 * Төлбөр төлөгдтөл захиалга үүсдэггүй тул төлж байх хооронд тэр цагийг өөр
 * хүн авчихсан байх боломж бий. Тийм үед захиалга үүсгэхгүй, төлбөрийг
 * `refund_due` болгож админд буцаалт хийхийг сануулна.
 */

export type FinalizeResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: "slot_taken" | "invalid" | "already"; message: string };

/** Ноорогийн үйлчилгээ/багцын нэр — имэйл, хураангуйд хэрэглэнэ. */
export async function draftItemName(draft: BookingDraft): Promise<string> {
  if (draft.packageId) {
    const pkg = await getPackage(draft.packageId);
    return pkg ? `${pkg.name} (багц)` : "Багц";
  }
  const service = await getService(draft.serviceId);
  return service?.name ?? "Үйлчилгээ";
}

/**
 * Төлбөр баталгаажсан гэж үзээд захиалгыг бичнэ. Хоёр удаа дуудагдсан ч
 * (webhook давхар ирэх нь энгийн үзэгдэл) нэг л захиалга үүснэ.
 */
export async function finalizePaidBooking(paymentId: string): Promise<FinalizeResult> {
  const payment = await getPayment(paymentId);
  if (!payment) {
    return { ok: false, reason: "invalid", message: "Төлбөр олдсонгүй." };
  }
  if (payment.bookingId) {
    return { ok: false, reason: "already", message: "Захиалга аль хэдийн үүссэн." };
  }
  if (payment.status === "refund_due" || payment.status === "refunded") {
    return { ok: false, reason: "slot_taken", message: "Энэ цаг завгүй болсон байна." };
  }

  const draft = payment.draft;
  const staff = await getStaffMember(draft.staffId);
  if (!staff) {
    await markRefundDue(payment, "Мастер олдсонгүй.");
    return { ok: false, reason: "invalid", message: "Мастер олдсонгүй." };
  }

  // Төлж байх хугацаанд цаг эзлэгдсэн эсэхийг эцсийн байдлаар шалгана.
  const available = draft.packageId
    ? await getPackageAvailableSlots(draft.packageId, draft.staffId, draft.date, draft.locationId)
    : await getAvailableSlots(draft.serviceId, draft.staffId, draft.date, draft.locationId);

  if (!available.includes(draft.time)) {
    await markRefundDue(payment, "Төлбөр хийгдэх хооронд цаг завгүй болсон.");
    return {
      ok: false,
      reason: "slot_taken",
      message: "Уучлаарай, төлбөр хийгдэх хооронд энэ цаг завгүй болжээ.",
    };
  }

  let booking: Booking;
  try {
    booking = await createBooking({
      serviceId: draft.packageId ? "" : draft.serviceId,
      packageId: draft.packageId,
      staffId: draft.staffId,
      date: draft.date,
      time: draft.time,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      note: draft.note,
      locationId: draft.locationId,
      // Урьдчилгаа орсон тул шууд баталгаажсанд тооцно.
      status: "confirmed",
    });
  } catch (e) {
    const message = (e as Error).message;
    await markRefundDue(payment, message);
    return {
      ok: false,
      reason: message === "SLOT_TAKEN" ? "slot_taken" : "invalid",
      message:
        message === "SLOT_TAKEN"
          ? "Уучлаарай, төлбөр хийгдэх хооронд энэ цаг завгүй болжээ."
          : "Захиалга үүсгэхэд алдаа гарлаа.",
    };
  }

  await updatePayment(payment.id, {
    status: "paid",
    bookingId: booking.id,
    paidAt: new Date().toISOString(),
    error: "",
  });

  await notifyNewBooking(payment, booking, staff.email, staff.name);
  return { ok: true, booking };
}

/** Төлбөр орсон ч захиалга үүсээгүй — салон буцаалт хийх ёстой. */
async function markRefundDue(payment: Payment, reason: string): Promise<void> {
  await updatePayment(payment.id, {
    status: "refund_due",
    paidAt: payment.paidAt ?? new Date().toISOString(),
    error: reason,
  });
}

/** Админ болон мастерт шинэ захиалгын мэдэгдэл (тохируулаагүй бол алгасна). */
async function notifyNewBooking(
  payment: Payment,
  booking: Booking,
  staffEmail: string | undefined,
  staffName: string,
): Promise<void> {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const to = Array.from(new Set([...admins, ...(staffEmail ? [staffEmail] : [])]));
  if (to.length === 0) return;

  const [item, { salonName }] = await Promise.all([
    draftItemName(payment.draft),
    getSettings(),
  ]);
  await sendEmail({
    to,
    subject: `Шинэ захиалга (урьдчилгаа төлөгдсөн) — ${item} (${formatDate(booking.date)} ${booking.time})`,
    html: newBookingEmail({
      salonName,
      service: item,
      staff: staffName,
      date: formatDate(booking.date),
      time: booking.time,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      note: booking.note,
    }),
  });
}
