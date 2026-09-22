import {
  getBookings,
  getEffectiveLocations,
  getPackages,
  getServices,
  getStaff,
} from "@/app/lib/db";
import { salonToday } from "@/app/lib/time";
import DashboardReport from "./dashboard-report";

export const metadata = { title: "Хянах самбар" };

export default async function AdminDashboard() {
  const [bookings, services, staff, packages, locations] = await Promise.all([
    getBookings(),
    getServices(),
    getStaff(),
    getPackages(),
    getEffectiveLocations(),
  ]);
  return (
    <DashboardReport
      bookings={bookings}
      services={services}
      staff={staff}
      packages={packages}
      locations={locations}
      today={salonToday()}
    />
  );
}
