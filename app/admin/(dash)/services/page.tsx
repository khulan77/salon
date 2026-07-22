import { getServices } from "@/app/lib/db";
import ServiceManager from "./service-manager";

export const metadata = { title: "Үйлчилгээ" };

export default async function AdminServicesPage() {
  const services = await getServices();
  return <ServiceManager services={services} />;
}
