import Link from "next/link";
import type { Service, Staff } from "@/app/lib/types";

export default function StaffCard({
  staff,
  services,
}: {
  staff: Staff;
  services: Service[];
}) {
  const specialties =
    staff.serviceIds.length === 0
      ? ["Бүх үйлчилгээ"]
      : services
          .filter((s) => staff.serviceIds.includes(s.id))
          .map((s) => s.name);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-lg">
      {staff.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staff.imageUrl}
          alt={staff.name}
          className="h-24 w-24 rounded-full object-cover shadow-inner"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-soft to-surface-2 text-4xl shadow-inner">
          {staff.emoji}
        </div>
      )}
      <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
        {staff.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-primary">{staff.title}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{staff.bio}</p>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {specialties.slice(0, 3).map((label) => (
          <span
            key={label}
            className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted"
          >
            {label}
          </span>
        ))}
      </div>

      <Link
        href={`/book?staff=${staff.id}`}
        className="mt-6 rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
      >
        {staff.name}-д захиалах
      </Link>
    </div>
  );
}
