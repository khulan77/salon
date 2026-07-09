import { getServices } from "@/app/lib/db";
import ServiceCard from "@/app/components/service-card";

export const metadata = { title: "Үйлчилгээ — Lumière" };

export default async function ServicesPage() {
  const services = await getServices({ activeOnly: true });
  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="bg-warm">
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Манай үйлчилгээ</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
            Гоо сайхны иж бүрэн үйлчилгээ
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Үс, хумс, арьс арчилгаанаас нүүр будалт хүртэл — өөрт хэрэгтэйгээ
            сонгоод цагаа захиалаарай.
          </p>
        </header>

        {categories.map((cat) => (
          <section key={cat} className="mt-14">
            <h2 className="font-display text-2xl font-semibold text-foreground">{cat}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services
                .filter((s) => s.category === cat)
                .map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
            </div>
          </section>
        ))}

        {services.length === 0 && (
          <p className="mt-14 text-muted">Одоогоор үйлчилгээ бүртгэгдээгүй байна.</p>
        )}
      </div>
    </div>
  );
}
