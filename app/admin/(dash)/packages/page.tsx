import { getPackages, getServices } from "@/app/lib/db";
import PackageManager from "./package-manager";

export const metadata = { title: "Багц" };

export default async function AdminPackagesPage() {
  const [packages, services] = await Promise.all([
    getPackages(),
    getServices({ activeOnly: true }),
  ]);
  return <PackageManager packages={packages} services={services} />;
}
