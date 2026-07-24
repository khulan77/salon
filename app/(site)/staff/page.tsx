import { getEffectiveLocations, getServices, getStaff } from "@/app/lib/db";
import StaffCard from "@/app/components/staff-card";
import { getSelectedLocationId, resolveLocation } from "@/app/lib/location";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мастерууд" };

export default async function StaffPage() {
  const [staff, services, locations, selectedId] = await Promise.all([
    getStaff({ activeOnly: true }),
    getServices({ activeOnly: true }),
    getEffectiveLocations(),
    getSelectedLocationId(),
  ]);
  const location = resolveLocation(locations, selectedId);

  // Сонгосон салбарын мастеруудыг (болон салбаргүй = бүх салбарт ажилладаг) харуулна.
  const visible =
    locations.length > 1 && location
      ? staff.filter((m) => !m.locationId || m.locationId === location.id)
      : staff;

  return (
    <div className="bg-warm">
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        <header className="max-w-2xl">
          <p className="eyebrow">Манай баг</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
            Туршлагатай мастерууд
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Мэргэжлийн, найрсаг баг таныг угтан авч, хамгийн сайн үйлчилгээг үзүүлнэ.
          </p>
          {locations.length > 1 && location && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-1 text-sm font-medium text-primary">
              🏢 {location.name || location.address}
            </p>
          )}
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <StaffCard key={m.id} staff={m} services={services} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-12 text-muted">
            {locations.length > 1
              ? "Энэ салбарт мастер бүртгэгдээгүй байна."
              : "Одоогоор мастер бүртгэгдээгүй байна."}
          </p>
        )}
      </div>
    </div>
  );
}
