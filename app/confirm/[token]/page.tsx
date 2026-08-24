import Link from "next/link";
import { emailBookingActionAction } from "@/app/lib/actions";
import { readBookingAction } from "@/app/lib/booking-token";
import {
  getBooking,
  getPackage,
  getService,
  getSettings,
  getStaffMember,
} from "@/app/lib/db";
import { formatDate } from "@/app/lib/format";

/*
  Имэйлийн товчоор нээгддэг хуудас (/confirm/<токен>).

  Зорилго нь админд төвөг өгөхгүй байх: мэдэгдлийн имэйл дэх товчийг дарахад
  шууд энд ирж, нэвтрэхгүйгээр нэг товшилтоор шийднэ.

  Яагаад товч дарах алхам үлдээв? Холбоос нээгдэнгүүт автоматаар
  баталгаажуулбал шуудангийн үйлчилгээний "линк шалгагч" робот өөрөө орж
  захиалгыг санамсаргүй баталгаажуулах эрсдэлтэй. Тиймээс эхлээд захиалгын
  мэдээллийг харуулж, хүн өөрөө нэг дарж баталгаажуулна.
*/

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Захиалга баталгаажуулах",
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const parsed = readBookingAction(token);
  const { salonName } = await getSettings();

  if (!parsed) {
    return (
      <Shell salonName={salonName}>
        <Notice
          icon="⚠️"
          title="Холбоос хүчингүй байна"
          text="Холбоосын хугацаа дууссан эсвэл буруу байж болзошгүй. Админ хэсгээс захиалгаа шууд шийднэ үү."
        />
      </Shell>
    );
  }

  const booking = await getBooking(parsed.id);
  if (!booking) {
    return (
      <Shell salonName={salonName}>
        <Notice
          icon="🔍"
          title="Захиалга олдсонгүй"
          text="Энэ захиалгыг устгасан байж магадгүй."
        />
      </Shell>
    );
  }

  const [staff, service, pkg] = await Promise.all([
    getStaffMember(booking.staffId),
    booking.serviceId ? getService(booking.serviceId) : undefined,
    booking.packageId ? getPackage(booking.packageId) : undefined,
  ]);
  const itemName = pkg?.name ?? service?.name ?? "Үйлчилгээ";

  const confirming = parsed.action === "confirm";
  const target = confirming ? "confirmed" : "cancelled";
  const done = booking.status === target;

  return (
    <Shell salonName={salonName}>
      <div className="card p-6 sm:p-8">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
            done ? "bg-primary-soft text-primary" : "bg-surface-2"
          }`}
        >
          {done ? (confirming ? "✓" : "✕") : confirming ? "🗓️" : "✕"}
        </span>

        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">
          {done
            ? confirming
              ? "Баталгаажлаа"
              : "Цуцлагдлаа"
            : confirming
              ? "Энэ захиалгыг баталгаажуулах уу?"
              : "Энэ захиалгыг цуцлах уу?"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {done
            ? confirming
              ? "Захиалгын төлөв «Баталгаажсан» боллоо. Өөр юу ч хийх шаардлагагүй."
              : "Захиалгын төлөв «Цуцлагдсан» боллоо. Тэр цаг дахин сул боллоо."
            : "Доорх мэдээллийг шалгаад товчоо дарна уу."}
        </p>

        <dl className="mt-6 space-y-3 rounded-2xl bg-surface-2/60 p-5 text-sm">
          <Row label="Үйлчлүүлэгч" value={booking.customerName} />
          <Row label="Утас" value={booking.customerPhone} />
          <Row label={pkg ? "Багц" : "Үйлчилгээ"} value={itemName} />
          <Row label="Мастер" value={staff?.name ?? "—"} />
          <Row label="Огноо" value={formatDate(booking.date)} />
          <Row label="Цаг" value={booking.time} />
          <Row label="Код" value={booking.code} />
          {booking.note && <Row label="Тэмдэглэл" value={booking.note} />}
        </dl>

        {!done && (
          <form action={emailBookingActionAction} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className={`w-full rounded-full py-3.5 text-sm font-medium transition-colors ${
                confirming
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-surface-2 text-foreground hover:bg-border/60"
              }`}
            >
              {confirming ? "✓ Тийм, баталгаажуулах" : "✕ Тийм, цуцлах"}
            </button>
          </form>
        )}

        {/* Одоогийн төлөв — өөр хүн аль хэдийн шийдсэн бол энд харагдана. */}
        {!done && booking.status !== "pending" && (
          <p className="mt-4 rounded-2xl bg-surface-2/60 px-4 py-3 text-xs leading-5 text-muted">
            Анхаар: энэ захиалгын одоогийн төлөв «{statusLabel(booking.status)}» байна.
          </p>
        )}

        <Link
          href="/admin/bookings"
          className="mt-6 block text-center text-sm text-muted transition-colors hover:text-primary"
        >
          Бүх захиалгыг харах →
        </Link>
      </div>
    </Shell>
  );
}

function statusLabel(status: string): string {
  return (
    {
      pending: "Хүлээгдэж буй",
      confirmed: "Баталгаажсан",
      cancelled: "Цуцлагдсан",
      done: "Үйлчилсэн",
      no_show: "Ирээгүй",
    }[status] ?? status
  );
}

function Shell({
  salonName,
  children,
}: {
  salonName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-warm flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-baseline justify-center gap-1.5">
          <span className="font-display text-2xl font-semibold text-foreground">
            {salonName}
          </span>
          <span className="text-primary">✦</span>
        </Link>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Notice({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-2xl">
        {icon}
      </span>
      <h1 className="mt-5 font-display text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
      <Link
        href="/admin/bookings"
        className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Админ хэсэг рүү орох
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
