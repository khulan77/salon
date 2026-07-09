import { getReviews } from "@/app/lib/db";
import ReviewManager from "./review-manager";

export const metadata = { title: "Сэтгэгдэл — Lumière Admin" };

export default async function AdminReviewsPage() {
  const reviews = await getReviews();
  return <ReviewManager reviews={reviews} />;
}
