import Link from "next/link";
import { expireStalePayments, getPayments, getSettings, getStaff } from "@/app/lib/db";
import { markRefundedAction } from "@/app/lib/actions";
import { formatDate, formatPrice } from "@/app/lib/format";
import { isMockPayment } from "@/app/lib/payment/provider";
import ConfirmForm from "../confirm-form";
import type { Payment, PaymentStatus } from "@/app/lib/types";

export const metadata = { title: "Төлбөрүүд" };

const LABELS: Record<PaymentStatus, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  expired: "Хугацаа дууссан",
  refund_due: "Буцаалт хийх",
  refunded: "Буцаагдсан",
};

const STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  expired: "bg-zinc-200 text-zinc-700",
  refund_due: "bg-rose-100 text-rose-700",
  refunded: "bg-sky-100 text-sky-800",
};

export default async function AdminPaymentsPage() {
  // Хугацаа хэтэрсэн нэхэмжлэхийг эхлээд хаана.
  await expireStalePayments();

  const [payments, staff, settings] = await Promise.all([
    getPayments(),
    getStaff(),
    getSettings(),
  ]);

  const refundDue = payments.filter((p) => p.status === "refund_due");
  const paid = payments.filter((p) => p.status === "paid");
  const collected = paid.reduce((sum, p) => sum + p.amount, 0);
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">Төлбөрүүд</h1>
      <p className="mt-1 text-muted">
        Захиалгын урьдчилгаа төлбөрийн бүртгэл.{" "}
        {settings.depositAmount > 0 ? (
          <>
            Одоогийн урьдчилгаа: <b>{formatPrice(settings.depositAmount)}</b>.
          </>
        ) : (
          <>
            Урьдчилгаа идэвхгүй байна —{" "}
            <Link href="/admin/settings" className="text-primary hover:underline">
              Тохиргооноос
            </Link>{" "}
            дүн тавина уу.
          </>
        )}
      </p>

      {isMockPayment() && (
        <p className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
          ⚠️ <b>Туршилтын горим</b> — төлбөрийн систем холбогдоогүй тул бодит
          мөнгө хөдлөхгүй. QPay merchant данс авмагц{" "}
          <code>app/lib/payment/qpay.ts</code> доторх зааврыг дагаж холбоно.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Цуглуулсан урьдчилгаа" value={formatPrice(collected)} hint={`${paid.length} захиалга`} />
        <Stat label="Буцаалт хийх" value={String(refundDue.length)} hint="төлөгдсөн ч цаг завгүй болсон" alert={refundDue.length > 0} />
        <Stat label="Нийт бичлэг" value={String(payments.length)} hint="сүүлийн 200" />
      </div>

      {refundDue.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-rose-700">
            ⚠️ Буцаалт хийх шаардлагатай
          </h2>
          <p className="mt-1 text-sm text-muted">
            Төлбөр нь орсон боловч төлж байх хооронд цагийг нь өөр хүн авсан
            байна. Үйлчлүүлэгчид залгаж, төлбөрийг буцаагаад доор тэмдэглэнэ үү.
          </p>
          <div className="mt-4 space-y-3">
            {refundDue.map((p) => (
              <Row key={p.id} payment={p} staffName={staffName(p.draft.staffId)} showRefund />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-foreground">Бүх төлбөр</h2>
        {payments.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
            Одоогоор төлбөрийн бичлэг алга байна.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {payments.map((p) => (
              <Row key={p.id} payment={p} staffName={staffName(p.draft.staffId)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({
  payment,
  staffName,
  showRefund,
}: {
  payment: Payment;
  staffName: string;
  showRefund?: boolean;
}) {
  const d = payment.draft;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{d.customerName || "—"}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[payment.status]}`}
          >
            {LABELS[payment.status]}
          </span>
          <span className="font-mono text-xs text-muted">{payment.id}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {d.customerPhone} · {staffName} ·{" "}
          {d.date ? `${formatDate(d.date)} ${d.time}` : "—"}
        </p>
        {payment.error && (
          <p className="mt-1 text-xs text-rose-600">⚠️ {payment.error}</p>
        )}
      </div>
      <div className="text-right">
        <div className="font-medium text-foreground">{formatPrice(payment.amount)}</div>
        <div className="text-xs text-muted">
          {new Date(payment.createdAt).toLocaleString("mn-MN")}
        </div>
      </div>
      {showRefund && (
        <ConfirmForm
          action={markRefundedAction}
          message={`${d.customerName} — ${formatPrice(payment.amount)} буцаасан гэж тэмдэглэх үү?`}
        >
          <input type="hidden" name="id" value={payment.id} />
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
          >
            Буцаасан
          </button>
        </ConfirmForm>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        alert ? "border-rose-200 bg-rose-50" : "border-border bg-surface"
      }`}
    >
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </div>
  );
}
