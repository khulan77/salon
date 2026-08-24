import Link from "next/link";
import { getBookings, getPackages, getServices, getStaff } from "@/app/lib/db";
import { bookingPrice, formatDate, formatPrice } from "@/app/lib/format";
import { StatusBadge } from "@/app/components/status-badge";
import { salonToday } from "@/app/lib/time";

export const metadata = { title: "Хянах самбар" };

export default async function AdminDashboard() {
  const [services, staff, bookings, packages] = await Promise.all([
    getServices(),
    getStaff(),
    getBookings(),
    getPackages(),
  ]);

  const today = salonToday();
  const pending = bookings.filter((b) => b.status === "pending").length;
  const todayCount = bookings.filter(
    (b) => b.date === today && b.status !== "cancelled",
  ).length;
  // Багц захиалгад serviceId хоосон байдаг тул үнийг нь багцаас нь авна.
  const revenue = bookings
    .filter((b) => b.status === "done" || b.status === "confirmed")
    .reduce((sum, b) => sum + bookingPrice(b, services, packages), 0);

  const stats = [
    { label: "Нийт захиалга", value: bookings.length, icon: "🗓️", href: "/admin/bookings" },
    { label: "Өнөөдөр", value: todayCount, icon: "☀️", href: "/admin/bookings" },
    { label: "Үйлчилгээ", value: services.length, icon: "✨", href: "/admin/services" },
    { label: "Мастерууд", value: staff.length, icon: "💇‍♀️", href: "/admin/staff" },
  ];

  const recent = bookings.slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        Хянах самбар
      </h1>
      <p className="mt-1 text-sm text-muted sm:text-base">
        Салоны үйл ажиллагааны ерөнхий байдал.
      </p>

      {/*
        Хүлээгдэж буй захиалга бол админы хамгийн эхэнд хийх ажил — тиймээс
        бусад тооноос дээгүүр, шууд дарж ордог мөр болгов. Байхгүй бол огт
        харагдахгүй, дэлгэц цэвэрхэн үлдэнэ.
      */}
      {pending > 0 && (
        <Link
          href="/admin/bookings?status=pending"
          className="mt-5 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-white shadow-sm transition-transform hover:scale-[1.01] sm:mt-6 sm:px-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-base">
            ⏳
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              {pending} захиалга хүлээгдэж байна
            </span>
            <span className="block text-xs text-white/80">
              Баталгаажуулах эсэхийг шийднэ үү
            </span>
          </span>
          <span aria-hidden className="shrink-0">
            →
          </span>
        </Link>
      )}

      {/* Орлого — гол тоо тул тусдаа, том харагдана. */}
      <div className="mt-3 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary-soft via-surface-2/70 to-surface px-5 py-6 sm:mt-4 sm:px-7 sm:py-7">
        <p className="text-xs text-muted sm:text-sm">
          Тооцоолсон орлого · баталгаажсан ба дууссан
        </p>
        <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {formatPrice(revenue)}
        </p>
        <Link
          href="/admin/revenue"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary sm:text-sm"
        >
          Дэлгэрэнгүй тайлан
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/*
        Тоонууд утсан дээр нэг баганаар өрөгдвөл дэлгэц дүүрэн асар том хайрцаг
        болдог байсан тул хоёр баганаар нягтруулав. Хүрээ ашиглахгүй — зөөлөн
        дэвсгэрээр ялгана.
      */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex items-center gap-3 rounded-2xl bg-surface-2/60 px-3.5 py-3.5 transition-colors hover:bg-primary-soft/70 sm:px-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-base">
              {s.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-none text-foreground sm:text-2xl">
                {s.value}
              </span>
              <span className="mt-1 block truncate text-[11px] text-muted sm:text-xs">
                {s.label}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            Сүүлийн захиалга
          </h2>
          <Link
            href="/admin/bookings"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Бүгд →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="card mt-4 p-6 text-center text-sm text-muted">
            Одоогоор захиалга алга байна.
          </p>
        ) : (
          /*
            Өмнө нь хүснэгт байсан тул утсан дээр хажуу тийш гүйлгэж байж
            бүтнээр нь уншдаг байв. Одоо нэг картан дотор мөр мөрөөр эгнэнэ —
            гүйлгэх шаардлагагүй, аль ч дэлгэцэд адилхан цэвэрхэн.
          */
          <ul className="card mt-4 divide-y divide-border/60 overflow-hidden">
            {recent.map((b) => {
              const pkg = b.packageId
                ? packages.find((p) => p.id === b.packageId)
                : undefined;
              const svc = services.find((s) => s.id === b.serviceId);
              const item = pkg ? `${pkg.name} (багц)` : (svc?.name ?? "—");
              return (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {b.customerName.trim().slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {b.customerName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {item} · {formatDate(b.date)} {b.time}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
