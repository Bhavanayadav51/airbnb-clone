import { Suspense } from "react";
import ListingForm from "@/components/ListingForm";

export default function EditListingPage() {
  return (
    <Suspense fallback={null}>
      <ListingForm mode="edit" />
    </Suspense>
  );
}