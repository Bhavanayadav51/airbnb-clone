import { Suspense } from "react";
import WishlistContent from "@/components/WishlistContent";

export default function WishlistPage() {
  return (
    <Suspense fallback={null}>
      <WishlistContent />
    </Suspense>
  );
}