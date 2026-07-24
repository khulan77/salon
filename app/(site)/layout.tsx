import SiteHeader from "@/app/components/site-header";
import SiteFooter from "@/app/components/site-footer";
import { getEffectiveLocations, getSettings } from "@/app/lib/db";
import { getSelectedLocationId, resolveLocation } from "@/app/lib/location";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, locations, selectedId] = await Promise.all([
    getSettings(),
    getEffectiveLocations(),
    getSelectedLocationId(),
  ]);
  const selected = resolveLocation(locations, selectedId);

  return (
    <>
      <SiteHeader
        salonName={settings.salonName}
        locations={locations}
        selectedLocationId={selected?.id}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} location={selected} />
    </>
  );
}
