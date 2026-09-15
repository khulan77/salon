import DemoAdmin from "./demo-admin";

/*
  Админ талын үзүүлэн (/demo/admin).

  Жинхэнэ админ (`/admin`) нэвтрэх эрхтэй хэвээр — энд зөвхөн жишээ өгөгдөлтэй
  хуулбар харагдана. Тиймээс салоны эзэнд нууц үг өгөхгүйгээр удирдлагын
  хэсгээ шууд үзүүлж болно. `?tab=calendar` гэвэл шууд хуанли нээгдэнэ —
  салоны эзэнд явуулах линкэнд тохиромжтой.
*/

export const metadata = {
  title: "Demo — Админ",
  description: "Салоны удирдлагын хэсэг ямар харагдахыг жишээ өгөгдөл дээр үзүүлнэ.",
  robots: { index: false, follow: false },
};

export default async function DemoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <DemoAdmin initialTab={tab} />;
}
