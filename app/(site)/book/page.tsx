import { getEffectiveLocations, getPackages, getServices, getStaff } from "@/app/lib/db";
import { getSelectedLocationId, resolveLocation } from "@/app/lib/location";
import BookingForm from "./booking-form";

export const metadata = { title: "Цаг захиалах" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; staff?: string; location?: string; package?: string }>;
}) {
  const sp = await searchParams;
  const [services, staff, locations, packages, cookieLocationId] = await Promise.all([
    getServices({ activeOnly: true }),
    getStaff({ activeOnly: true }),
    getEffectiveLocations(),
    getPackages({ activeOnly: true }),
    getSelectedLocationId(),
  ]);
  // URL-ийн ?location давуу эрхтэй, дараа нь cookie-гийн сонголт.
  const initial = resolveLocation(locations, sp.location ?? cookieLocationId);

  return (
    <div className="bg-warm min-h-[70vh]">
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <header className="text-center">
          <p className="eyebrow">Онлайн захиалга</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
            Цаг захиалах
          </h1>
          <p className="mt-3 text-muted">
            Хэдхэн энгийн алхмаар өөрт тохирсон цагаа сонгоно уу.
          </p>
        </header>

        <BookingForm
          services={services}
          staff={staff}
          locations={locations}
          packages={packages}
          initialServiceId={sp.service}
          initialStaffId={sp.staff}
          initialLocationId={initial?.id}
          initialPackageId={sp.package}
        />
      </div>
    </div>
  );
}
