import { getServices, getStaff } from "@/app/lib/db";
import StaffCard from "@/app/components/staff-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мастерууд" };

export default async function StaffPage() {
  const [staff, services] = await Promise.all([
    getStaff({ activeOnly: true }),
    getServices({ activeOnly: true }),
  ]);

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
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((m) => (
            <StaffCard key={m.id} staff={m} services={services} />
          ))}
        </div>

        {staff.length === 0 && (
          <p className="mt-12 text-muted">Одоогоор мастер бүртгэгдээгүй байна.</p>
        )}
      </div>
    </div>
  );
}
