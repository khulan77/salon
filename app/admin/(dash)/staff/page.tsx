import { getServices, getStaff } from "@/app/lib/db";
import StaffManager from "./staff-manager";

export const metadata = { title: "Мастерууд" };

export default async function AdminStaffPage() {
  const [staff, services] = await Promise.all([getStaff(), getServices()]);
  return <StaffManager staff={staff} services={services} />;
}
