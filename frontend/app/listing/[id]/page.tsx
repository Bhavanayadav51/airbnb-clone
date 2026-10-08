import { Suspense } from "react";
import ListingDetail from "@/components/ListingDetail";

export default function ListingPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-gray-500">Loading...</p>}>
      <ListingDetail />
    </Suspense>
  );
}