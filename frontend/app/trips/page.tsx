import { Suspense } from "react";
import TripsContent from "@/components/TripsContent";

export default function TripsPage() {
  return (
    <Suspense fallback={null}>
      <TripsContent />
    </Suspense>
  );
}