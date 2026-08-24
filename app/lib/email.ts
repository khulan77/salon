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
  /** Хүснэгтийн доор гарах том товчнуудын HTML. */
  actions?: string;
}): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#faf6f1;padding:24px;border-radius:16px">
    <h1 style="font-size:20px;color:#b76e79;margin:0 0 4px">${esc(opts.salonName)} ✦</h1>
    <p style="color:#2e2723;margin:0 0 16px">${opts.lead}</p>
    <table style="width:100%;background:#fff;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden">
      ${opts.rows.join("")}
    </table>
    ${opts.actions ?? ""}
    <p style="color:#8a7d72;font-size:12px;margin:16px 0 0">${opts.footer}</p>
  </div>`;
}

/**
 * Имэйлийн товч. Гар утасны шуудангийн апп дээр хуруугаар дарахад тохиромжтой
 * өндөртэй; `<a>`-г товч мэт харуулна (имэйлд `<button>` ажилладаггүй).
 */
function emailButton(href: string, label: string, primary: boolean): string {
  const bg = primary ? "#b76e79" : "#ffffff";
  const fg = primary ? "#ffffff" : "#8a7d72";
  const border = primary ? "#b76e79" : "#e8ddd2";
  return (
    `<a href="${href}" style="display:inline-block;padding:13px 26px;margin:0 6px 8px 0;` +
    `background:${bg};color:${fg};border:1px solid ${border};border-radius:999px;` +
    `font-size:14px;font-weight:600;text-decoration:none">${label}</a>`
  );
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
  /** Нэг товшилтоор баталгаажуулах/цуцлах холбоос (тохируулаагүй бол хоосон). */
  confirmUrl?: string | null;
  cancelUrl?: string | null;
}): string {
  const actions =
    b.confirmUrl && b.cancelUrl
      ? `<div style="margin:18px 0 0">` +
        emailButton(b.confirmUrl, "✓ Баталгаажуулах", true) +
        emailButton(b.cancelUrl, "✕ Цуцлах", false) +
        `</div>`
      : "";

  return emailShell({
    salonName: b.salonName,
    lead: "Шинэ цаг захиалга ирлээ 🎉",
    actions,
    rows: [
      row("Үйлчилгээ", b.service),
      row("Мастер", b.staff),
      row("Огноо", b.date),
      row("Цаг", b.time),
      row("Үйлчлүүлэгч", b.customerName),
      row("Утас", b.customerPhone),
      b.note ? row("Тэмдэглэл", b.note) : "",
    ],
    footer: actions
      ? "Товчийг дарахад баталгаажуулах хуудас нээгдэнэ — нэвтрэх шаардлагагүй. Холбоос 30 хоног хүчинтэй."
      : "Энэ бол автомат мэдэгдэл. Админ хэсгээс захиалгыг баталгаажуулна уу.",
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
