"use client";
import { Listing, inr } from "@/lib/api";
import { fmt, nightsBetween } from "@/lib/dates";

type Props = {
  listing: Listing;
  checkIn: string;
  checkOut: string;
  guests: number;
  setGuests: (n: number) => void;
  onReserve: () => void;
};

export default function BookingCard({ listing, checkIn, checkOut, guests, setGuests, onReserve }: Props) {
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const subtotal = nights * listing.price_per_night;
  const total = Math.round(subtotal * 1.14); // same formula as the backend
  const fee = total - subtotal;

  return (
    <div className="sticky top-28 rounded-xl border border-gray-200 p-6 shadow-xl">
      <p className="mb-4">
        <span className="text-2xl font-semibold">{inr(listing.price_per_night)}</span> night
      </p>

      <div className="overflow-hidden rounded-lg border border-gray-400">
        <div className="grid grid-cols-2 border-b border-gray-400">
          <div className="border-r border-gray-400 p-3">
            <p className="text-[10px] font-bold">CHECK-IN</p>
            <p className="text-sm">{checkIn ? fmt(checkIn) : "Add date"}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold">CHECKOUT</p>
            <p className="text-sm">{checkOut ? fmt(checkOut) : "Add date"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div>
            <p className="text-[10px] font-bold">GUESTS</p>
            <p className="text-sm">{guests} guest{guests > 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}
              className="h-8 w-8 rounded-full border border-gray-400 disabled:opacity-30">−</button>
            <button onClick={() => setGuests(Math.min(listing.max_guests, guests + 1))} disabled={guests >= listing.max_guests}
              className="h-8 w-8 rounded-full border border-gray-400 disabled:opacity-30">+</button>
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">Maximum {listing.max_guests} guests</p>

      <button onClick={onReserve} className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#D70466] py-3.5 font-semibold text-white hover:opacity-90">
        {nights ? "Reserve" : "Check availability"}
      </button>

      {nights > 0 && (
        <>
          <p className="mt-3 text-center text-sm text-gray-500">You won&apos;t be charged yet</p>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between">
              <span className="underline">{inr(listing.price_per_night)} x {nights} night{nights > 1 ? "s" : ""}</span>
              <span>{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="underline">Airbnb service fee</span>
              <span>{inr(fee)}</span>
            </div>
          </div>
          <div className="mt-5 flex justify-between border-t border-gray-200 pt-5 font-semibold">
            <span>Total before taxes</span>
            <span>{inr(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}