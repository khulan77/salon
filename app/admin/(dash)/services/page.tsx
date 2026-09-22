import Link from "next/link";
import { getPackages, getServices } from "@/app/lib/db";
import ServiceManager from "./service-manager";
import PackageManager from "../packages/package-manager";

export const metadata = { title: "Үйлчилгээ" };

/*
  Үйлчилгээ ба багц нэг хуудсанд.

  Багц гэдэг нь үйлчилгээнүүдийн нийлбэр тул тусдаа цэс болгох нь цэсийг л
  уртасгадаг байв. Одоо энд хоёр таб — сонголт нь хаягт (`?tab=packages`)
  хадгалагдана, тиймээс linkээ хуваалцаж болно, буцах товч ч зөв ажиллана.
*/

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const onPackages = tab === "packages";

  const [services, packages] = await Promise.all([getServices(), getPackages()]);

  const tabs = [
    { key: "", label: "Үйлчилгээ", count: services.length },
    { key: "packages", label: "Багц", count: packages.length },
  ];

  return (
    <div className="px-4 pb-8 sm:px-0">
      <div className="flex w-fit rounded-full bg-surface-2/70 p-1">
        {tabs.map((t) => {
          const on = t.key === (onPackages ? "packages" : "");
          return (
            <Link
              key={t.label}
              href={t.key ? `/admin/services?tab=${t.key}` : "/admin/services"}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                on ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={on ? "text-primary" : "text-muted/70"}>{t.count}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {onPackages ? (
          <PackageManager
            packages={packages}
            services={services.filter((s) => s.active)}
          />
        ) : (
          <ServiceManager services={services} />
        )}
      </div>
    </div>
  );
}
