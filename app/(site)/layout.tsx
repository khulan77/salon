import SiteHeader from "@/app/components/site-header";
import SiteFooter from "@/app/components/site-footer";
import { getSettings } from "@/app/lib/db";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <>
      <SiteHeader salonName={settings.salonName} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
