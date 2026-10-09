import { Suspense } from "react";
import MessagesContent from "@/components/MessagesContent";

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-gray-500">Loading messages...</p>}>
      <MessagesContent />
    </Suspense>
  );
}
