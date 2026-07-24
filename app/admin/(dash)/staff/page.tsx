import { getLocations, getServices, getStaff } from "@/app/lib/db";
import StaffManager from "./staff-manager";

export const metadata = { title: "Мастерууд" };

export default async function AdminStaffPage() {
  const [staff, services, locations] = await Promise.all([
    getStaff(),
    getServices(),
    getLocations(),
  ]);
  return <StaffManager staff={staff} services={services} locations={locations} />;
}
