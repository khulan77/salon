import { cookies } from "next/headers";
import type { Location } from "./types";

/** Үйлчлүүлэгчийн сонгосон салбарыг хадгалдаг cookie. */
export const LOCATION_COOKIE = "loc";

/** Cookie-с сонгосон салбарын id-г уншина (байхгүй бол undefined). */
export async function getSelectedLocationId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(LOCATION_COOKIE)?.value || undefined;
}

/**
 * Cookie-гийн сонголт + боломжит салбаруудаас идэвхтэй салбарыг тодорхойлно.
 * Сонголт олдохгүй, эсвэл хүчингүй бол эхний салбарыг сонгоно.
 */
export function resolveLocation(
  locations: Location[],
  selectedId?: string,
): Location | undefined {
  if (locations.length === 0) return undefined;
  return locations.find((l) => l.id === selectedId) ?? locations[0];
}
