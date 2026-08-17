const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY && EMAIL_FROM);
}

/**
 * Sends an email via the Resend HTTP API. No-ops (with a log) when not
 * configured, and never throws — email failures must not break a booking.
 */
export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const to = opts.to.filter(Boolean);
  if (!isEmailConfigured() || to.length === 0) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error("[email] send failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[email] error:", e);
  }
}

/** Үйлчлүүлэгчийн бичсэн текст имэйлийн HTML-ийг эвдэхээс сэргийлнэ. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 12px;color:#8a7d72">${label}</td>` +
  `<td style="padding:6px 12px;color:#2e2723;font-weight:600">${esc(value)}</td></tr>`;

/** Мэдэгдлийн имэйлийн ерөнхий хүрээ — толгой, мөрүүдийн хүснэгт, тайлбар. */
function emailShell(opts: {
  salonName: string;
  lead: string;
  rows: string[];
  footer: string;
}): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#faf6f1;padding:24px;border-radius:16px">
    <h1 style="font-size:20px;color:#b76e79;margin:0 0 4px">${esc(opts.salonName)} ✦</h1>
    <p style="color:#2e2723;margin:0 0 16px">${opts.lead}</p>
    <table style="width:100%;background:#fff;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden">
      ${opts.rows.join("")}
    </table>
    <p style="color:#8a7d72;font-size:12px;margin:16px 0 0">${opts.footer}</p>
  </div>`;
}

/** HTML for the "new booking" notification sent to admin + assigned staff. */
export function newBookingEmail(b: {
  salonName: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  note?: string;
}): string {
  return emailShell({
    salonName: b.salonName,
    lead: "Шинэ цаг захиалга ирлээ 🎉",
    rows: [
      row("Үйлчилгээ", b.service),
      row("Мастер", b.staff),
      row("Огноо", b.date),
      row("Цаг", b.time),
      row("Үйлчлүүлэгч", b.customerName),
      row("Утас", b.customerPhone),
      b.note ? row("Тэмдэглэл", b.note) : "",
    ],
    footer: "Энэ бол автомат мэдэгдэл. Админ хэсгээс захиалгыг баталгаажуулна уу.",
  });
}

/**
 * Захиалга цуцлагдсан тухай мэдэгдэл. Хэн цуцалсныг (үйлчлүүлэгч эсвэл
 * мастер) тодруулж бичнэ — админ хуваарийг шууд ойлгоно.
 */
export function cancelledBookingEmail(b: {
  salonName: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  code: string;
  by: "customer" | "staff";
}): string {
  const who = b.by === "staff" ? "Мастер" : "Үйлчлүүлэгч";
  return emailShell({
    salonName: b.salonName,
    lead: `❌ Захиалга цуцлагдлаа — ${who.toLowerCase()} цуцалсан байна.`,
    rows: [
      row("Үйлчилгээ", b.service),
      row("Мастер", b.staff),
      row("Огноо", b.date),
      row("Цаг", b.time),
      row("Үйлчлүүлэгч", b.customerName),
      row("Утас", b.customerPhone),
      row("Захиалгын код", b.code),
    ],
    footer: "Энэ цаг дахин сул болсон тул өөр үйлчлүүлэгчид санал болгож болно.",
  });
}
