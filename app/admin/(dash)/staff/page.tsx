import { getLocations, getServices, getStaff } from "@/app/lib/db";
import StaffManager from "./staff-manager";

export const metadata = { title: "Мастерууд" };

export default async function AdminStaffPage() {
  const [staff, services, locations] = await Promise.all([
    getStaff(),
    getServices(),
    getLocations(),
  ]);
  return (
    <div className="px-4 pb-8 sm:px-0">
      <StaffManager staff={staff} services={services} locations={locations} />
    </div>
  );
}
