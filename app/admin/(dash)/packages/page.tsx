import { redirect } from "next/navigation";

/*
  Багц одоо «Үйлчилгээ» хуудасны нэг таб болсон. Хуучин хаягаар орж ирсэн
  холбоос, хавчуургыг тасалдуулахгүйн тулд шилжүүлнэ.
*/
export default function AdminPackagesPage() {
  redirect("/admin/services?tab=packages");
}
