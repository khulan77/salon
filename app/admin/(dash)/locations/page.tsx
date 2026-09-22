import { getLocations } from "@/app/lib/db";
import LocationManager from "./location-manager";

export const metadata = { title: "Салбарууд" };

export default async function AdminLocationsPage() {
  const locations = await getLocations();
  return (
    <div className="px-4 pb-8 sm:px-0">
      <LocationManager locations={locations} />
    </div>
  );
}
