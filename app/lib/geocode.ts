/**
 * Хаягийг газрын зургийн координат болгож хөрвүүлнэ (OpenStreetMap Nominatim).
 *
 * Салоны эзэн зөвхөн хаягаа бичнэ — координатыг Тохиргоо хадгалах үед нэг л
 * удаа тооцоод хадгална. Ингэснээр хуудас ачаалах бүрд гадны сервис рүү
 * хандахгүй.
 */

import { parseCoords } from "./format";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/**
 * Хаягаас "өргөрөг,уртраг" гаргана. Олдоогүй, эсвэл алдаа гарвал хоосон
 * буцаана — газрын зураг бол нэмэлт зүйл тул тохиргоо хадгалахыг зогсоох
 * ёсгүй.
 */
export async function geocodeAddress(address: string): Promise<string> {
  const query = address.trim();
  if (!query) return "";

  // Хэн нэгэн шууд координат бичсэн бол дэмий хайлт хийхгүй.
  const direct = parseCoords(query);
  if (direct) return direct;

  try {
    const res = await fetch(
      `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        // Nominatim-ийн журам: аппаа танигдахуйц User-Agent-ээр танилцуулна.
        headers: {
          "User-Agent": "salon-booking/1.0 (Mongolian salon booking site)",
          "Accept-Language": "mn,en",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) return "";

    const rows = await res.json();
    const hit = Array.isArray(rows) ? rows[0] : null;
    if (!hit?.lat || !hit?.lon) return "";

    return parseCoords(`${hit.lat},${hit.lon}`) ?? "";
  } catch {
    return "";
  }
}
