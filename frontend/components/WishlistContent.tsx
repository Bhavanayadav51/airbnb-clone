"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Listing } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import ListingCard from "./ListingCard";

export default function WishlistContent() {
  const { user, wishlist } = useApp();
  const [items, setItems] = useState<Listing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Listing[]>(`/wishlist?user_id=${user.id}`).then(setItems).catch(() => setItems([]));
  }, [user]);

  if (!items) return <p className="py-20 text-center text-gray-500">Loading...</p>;

  // hide a card as soon as its heart is un-clicked
  const visible = items.filter((l) => wishlist.includes(l.id));

  return (
    <div className="py-10">
      <h1 className="mb-8 text-3xl font-semibold">Wishlists</h1>
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xl font-semibold">Create your first wishlist</p>
          <p className="mt-2 text-gray-500">Tap the heart on any place to save it here.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-[#222] px-5 py-3 font-medium text-white">
            Explore places
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}