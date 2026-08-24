import DemoAdmin from "./demo-admin";

/*
  Админ талын үзүүлэн (/demo/admin).

  Жинхэнэ админ (`/admin`) нэвтрэх эрхтэй хэвээр — энд зөвхөн жишээ өгөгдөлтэй
  хуулбар харагдана. Тиймээс салоны эзэнд нууц үг өгөхгүйгээр удирдлагын
  хэсгээ шууд үзүүлж болно.
*/

export const metadata = {
  title: "Demo — Админ",
  description: "Салоны удирдлагын хэсэг ямар харагдахыг жишээ өгөгдөл дээр үзүүлнэ.",
  robots: { index: false, follow: false },
};

export default function DemoAdminPage() {
  return <DemoAdmin />;
}
