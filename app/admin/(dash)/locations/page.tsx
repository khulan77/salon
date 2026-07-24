import { getLocations } from "@/app/lib/db";
import LocationManager from "./location-manager";

export const metadata = { title: "Салбарууд" };

export default async function AdminLocationsPage() {
  const locations = await getLocations();
  return <LocationManager locations={locations} />;
}
