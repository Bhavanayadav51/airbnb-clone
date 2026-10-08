import { Suspense } from "react";
import ListingForm from "@/components/ListingForm";

export default function NewListingPage() {
  return (
    <Suspense fallback={null}>
      <ListingForm mode="create" />
    </Suspense>
  );
}