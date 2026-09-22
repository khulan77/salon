import { getReviews } from "@/app/lib/db";
import ReviewManager from "./review-manager";

export const metadata = { title: "Сэтгэгдэл" };

export default async function AdminReviewsPage() {
  const reviews = await getReviews();
  return (
    <div className="px-4 pb-8 sm:px-0">
      <ReviewManager reviews={reviews} />
    </div>
  );
}
