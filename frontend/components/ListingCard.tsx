"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Listing, inr } from "@/lib/api";
import { useApp } from "@/lib/AppContext";

export default function ListingCard({ listing, query = "" }: { listing: Listing; query?: string }) {
  const { wishlist, toggleWishlist } = useApp();
  const saved = wishlist.includes(listing.id);
  const city = listing.location.split(",")[0];
  const favourite = (listing.rating ?? 0) >= 4.7;

  return (
    <Link href={`/listing/${listing.id}${query ? `?${query}` : ""}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-200">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {favourite && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[13px] font-medium shadow-sm">
            Guest favourite
          </span>
        )}
        <button
          aria-label="Save to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(listing.id);
          }}
          className="absolute right-3 top-3"
        >
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill={saved ? "#FF385C" : "rgba(0,0,0,0.5)"} stroke="white" strokeWidth="2">
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>
      <p className="mt-2 truncate text-[15px] font-medium">{listing.title}</p>
      <p className="truncate text-sm text-gray-500">{city}, {listing.location.split(",").slice(1).join(",").trim()}</p>
      <p className="text-sm text-gray-500">
        <span className="font-medium text-[#222]">{inr(listing.price_per_night)}</span> night
        {listing.rating ? ` · ★ ${listing.rating.toFixed(2)}` : ""}
      </p>
    </Link>
  );
}