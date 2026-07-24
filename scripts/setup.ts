/**
 * One-time Supabase setup: creates the public "uploads" storage bucket and
 * seeds the tables with starter data. Safe to run multiple times.
 *
 *   bun run scripts/setup.ts
 *
 * Requires the tables to already exist — run supabase/schema.sql first.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL болон SUPABASE_SECRET_KEY тохируулна уу (.env.local).");
  process.exit(1);
}
const sb = createClient(url, secret, { auth: { persistSession: false } });

async function ensureBucket() {
  const { error } = await sb.storage.createBucket("uploads", { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(error ? "✓ bucket 'uploads' already exists" : "✓ created bucket 'uploads'");
}

async function seedTable(
  table: string,
  rows: Record<string, unknown>[],
) {
  const { count } = await sb.from(table).select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    console.log(`• ${table}: ${count} rows already — skipped`);
    return;
  }
  const { error } = await sb.from(table).insert(rows);
  if (error) throw error;
  console.log(`✓ seeded ${table} (${rows.length})`);
}

async function main() {
  await ensureBucket();

  await seedTable("services", [
    { id: "svc-haircut", name: "Үс засалт & загвар", description: "Мэргэжлийн үс засалт, угаалга болон загварчлал.", category: "Үс", duration_min: 60, price: 45000, emoji: "✂️", active: true },
    { id: "svc-color", name: "Үс будалт", description: "Чанартай будгаар үс будах, өнгө сэргээх, балаяж, омбре.", category: "Үс", duration_min: 120, price: 120000, emoji: "🎨", active: true },
    { id: "svc-manicure", name: "Гар засал (Manicure)", description: "Хумсны арчилгаа, гель лак, дизайн.", category: "Хумс", duration_min: 90, price: 55000, emoji: "💅", active: true },
    { id: "svc-facial", name: "Нүүрний арчилгаа", description: "Гүн цэвэрлэгээ, чийгшүүлэлт болон тайвшруулах массаж.", category: "Арьс", duration_min: 75, price: 80000, emoji: "🧖‍♀️", active: true },
    { id: "svc-makeup", name: "Нүүр будалт", description: "Өдөр тутмын болон онцгой үйл явдлын мэргэжлийн нүүр будалт.", category: "Гоо сайхан", duration_min: 60, price: 70000, emoji: "💄", active: true },
    { id: "svc-lash", name: "Сормуус суулгац", description: "Байгалийн болон өтгөн сормуусны суулгац, засвар.", category: "Гоо сайхан", duration_min: 90, price: 90000, emoji: "👁️", active: true },
  ]);

  await seedTable("locations", [
    { id: "loc-main", name: "Төв салбар", address: "", phone: "", open_time: "10:00", close_time: "20:00", slot_minutes: 30, closed_days: [], sort_order: 0, active: true },
  ]);

  await seedTable("staff", [
    { id: "stf-saraa", name: "Сараа", title: "Ахлах стилист", bio: "10 гаруй жилийн туршлагатай, олон улсын сертификаттай үсчин.", service_ids: ["svc-haircut", "svc-color"], emoji: "💇‍♀️", location_id: "loc-main", active: true },
    { id: "stf-bolor", name: "Болор", title: "Хумсны мастер", bio: "Nail art-ын мэргэжилтэн. Нарийн дизайн, цэвэрхэн ажил.", service_ids: ["svc-manicure"], emoji: "💅", location_id: "loc-main", active: true },
    { id: "stf-nomin", name: "Номин", title: "Гоо сайхны мэргэжилтэн", bio: "Арьс арчилгаа, нүүр будалт, сормуусны чиглэлээр мэргэшсэн.", service_ids: ["svc-facial", "svc-makeup", "svc-lash"], emoji: "🌸", location_id: "loc-main", active: true },
  ]);

  await seedTable("packages", [
    { id: "pkg-bridal", name: "Сүйн бүсгүйн багц", description: "Онцгой өдрийн иж бүрэн бэлтгэл: үс засалт, нүүр будалт, гар засал.", service_ids: ["svc-haircut", "svc-makeup", "svc-manicure"], price: 150000, emoji: "👰", sort_order: 0, active: true },
    { id: "pkg-glow", name: "Гэрэлт арьс багц", description: "Нүүрний арчилгаа болон сормуус суулгацын хосолсон багц.", service_ids: ["svc-facial", "svc-lash"], price: 155000, emoji: "✨", sort_order: 1, active: true },
  ]);

  await seedTable("reviews", [
    { id: "rev-1", customer_name: "Оюунаа", rating: 5, text: "Маш тансаг үйлчилгээ. Сараа гуайн үс засалт үнэхээр гоё болсон, дахин очно!", active: true },
    { id: "rev-2", customer_name: "Тэмүүлэн", rating: 5, text: "Онлайн цаг захиалга нь маш хялбар. Цаг барьдаг, цэвэрхэн орчин.", active: true },
    { id: "rev-3", customer_name: "Сарантуяа", rating: 4, text: "Номин маань нүүр будалтыг гоё хийдэг. Найзууддаа санал болгосон.", active: true },
  ]);

  // settings singleton
  const { error: sErr } = await sb.from("settings").upsert({
    id: 1, open_time: "10:00", close_time: "20:00", slot_minutes: 30, closed_days: [],
  });
  if (sErr) throw sErr;
  console.log("✓ settings ready");

  console.log("\n🎉 Supabase setup дууслаа.");
}

main().catch((e) => {
  console.error("Setup алдаа:", e.message);
  process.exit(1);
});
