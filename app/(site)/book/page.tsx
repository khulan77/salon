import { getServices, getStaff } from "@/app/lib/db";
import BookingForm from "./booking-form";

export const metadata = { title: "Цаг захиалах — Lumière" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; staff?: string }>;
}) {
  const sp = await searchParams;
  const [services, staff] = await Promise.all([
    getServices({ activeOnly: true }),
    getStaff({ activeOnly: true }),
  ]);

  return (
    <div className="bg-warm min-h-[70vh]">
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <header className="text-center">
          <p className="text-sm font-medium text-primary">Онлайн захиалга</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
            Цаг захиалах
          </h1>
          <p className="mt-3 text-muted">
            Дөрвөн энгийн алхмаар өөрт тохирсон цагаа сонгоно уу.
          </p>
        </header>

        <BookingForm
          services={services}
          staff={staff}
          initialServiceId={sp.service}
          initialStaffId={sp.staff}
        />
      </div>
    </div>
  );
}
