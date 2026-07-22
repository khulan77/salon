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
    <div className="card card-hover group flex flex-col items-center p-8 text-center">
      {staff.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staff.imageUrl}
          alt={staff.name}
          className="h-28 w-28 rounded-full object-cover ring-4 ring-primary-soft"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary-soft to-surface-2 text-4xl ring-4 ring-primary-soft/50">
          {staff.emoji}
        </div>
      )}
      <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
        {staff.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-primary">{staff.title}</p>
      <p className="mt-3 flex-1 text-sm leading-6 text-muted">{staff.bio}</p>

      <p className="mt-4 text-xs leading-5 text-muted">
        {specialties.slice(0, 3).join(" · ")}
      </p>

      <Link
        href={`/book?staff=${staff.id}`}
        className="mt-6 rounded-full bg-primary-soft px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
      >
        Цаг захиалах
      </Link>
    </div>
  );
}
