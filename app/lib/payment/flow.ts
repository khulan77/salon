import "server-only";
import { randomUUID } from "crypto";
import {
  createBooking,
  deleteBooking,
  getMultiAvailableSlots,
  getPackage,
  getPackageAvailableSlots,
  getPayment,
  getServices,
  getSettings,
  getStaff,
  getStaffMember,
  updatePayment,
} from "../db";
import { formatDate } from "../format";
import { newBookingEmail, sendEmail } from "../email";
import { draftItems, scheduleItems } from "../booking-items";
import type { Booking, BookingDraft, BookingStatus, Payment } from "../types";

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
  const services = await getServices();
  const names = draftItems(draft).map(
    (i) => services.find((s) => s.id === i.serviceId)?.name ?? "Үйлчилгээ",
  );
  return names.join(" + ") || "Үйлчилгээ";
}

/** Ноорогийн мастеруудын нэр, давхардалгүй ("Сараа · Уянга"). */
export async function draftStaffNames(draft: BookingDraft): Promise<string> {
  const staff = await getStaff();
  const ids = draft.packageId ? [draft.staffId] : draftItems(draft).map((i) => i.staffId);
  return [...new Set(ids)]
    .map((id) => staff.find((m) => m.id === id)?.name ?? "—")
    .join(" · ");
}

/**
 * Ноорогийг захиалга болгон бичнэ. Олон үйлчилгээтэй бол үйлчилгээ бүр өөрийн
 * мөртэй (мастер, цаг, код), бүгд нэг `groupId`-тай. Аль нэг нь бичигдэж
 * чадахгүй бол (цаг дөнгөж эзлэгдсэн) өмнө нь бичсэнийг буцааж устгана —
 * хагас захиалга үлдэхгүй. Сул цагийг дуудагч тал шалгасан байх ёстой.
 */
export async function placeDraftBookings(
  draft: BookingDraft,
  status: BookingStatus,
): Promise<Booking[]> {
  const staff = await getStaff();
  const base = {
    date: draft.date,
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    note: draft.note,
    status,
  };
  // Ажилтны хамаарах салбар давуу эрхтэй; байхгүй бол формоос сонгосон
  // салбар. Хоосон мөр ирж болох тул `??` биш `||` ашиглана.
  const locationOf = (staffId: string) =>
    staff.find((m) => m.id === staffId)?.locationId || draft.locationId || undefined;

  if (draft.packageId) {
    return [
      await createBooking({
        ...base,
        serviceId: "",
        packageId: draft.packageId,
        staffId: draft.staffId,
        time: draft.time,
        locationId: locationOf(draft.staffId),
      }),
    ];
  }

  const services = await getServices();
  const planned = scheduleItems(
    draftItems(draft),
    draft.time,
    (id) => services.find((s) => s.id === id)?.durationMin ?? 30,
  );
  const groupId = planned.length > 1 ? `grp-${randomUUID().slice(0, 8)}` : undefined;

  const created: Booking[] = [];
  try {
    for (const item of planned) {
      created.push(
        await createBooking({
          ...base,
          serviceId: item.serviceId,
          staffId: item.staffId,
          time: item.time,
          locationId: locationOf(item.staffId),
          groupId,
        }),
      );
    }
  } catch (e) {
    await Promise.all(created.map((b) => deleteBooking(b.id)));
    throw e;
  }
  return created;
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
    : await getMultiAvailableSlots(draftItems(draft), draft.date, draft.locationId);

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
    // Урьдчилгаа орсон тул шууд баталгаажсанд тооцно. Олон үйлчилгээтэй бол
    // төлбөрийг эхнийхтэй нь холбоно — бусад нь groupId-оор холбогдоно.
    [booking] = await placeDraftBookings(draft, "confirmed");
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

  await notifyNewBooking(payment, booking);
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
async function notifyNewBooking(payment: Payment, booking: Booking): Promise<void> {
  const draft = payment.draft;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  // Олон үйлчилгээтэй бол оролцох мастер бүр мэдэгдэл авна.
  const staffIds = draft.packageId ? [draft.staffId] : draftItems(draft).map((i) => i.staffId);
  const allStaff = await getStaff();
  const staffEmails = allStaff
    .filter((m) => staffIds.includes(m.id) && m.email)
    .map((m) => m.email!);
  const to = Array.from(new Set([...admins, ...staffEmails]));
  if (to.length === 0) return;

  const [item, staffName, { salonName }] = await Promise.all([
    draftItemName(draft),
    draftStaffNames(draft),
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
