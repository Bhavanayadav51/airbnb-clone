"use client";
import Link from "next/link";
import { useState } from "react";
import { api, Booking, dispatchNotificationUpdate, Listing, inr } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import { fmt, nightsBetween } from "@/lib/dates";

type Props = {
  listing: Listing;
  checkIn: string;
  checkOut: string;
  guests: number;
  onClose: () => void;
  onBooked: () => void; // lets the page refresh the blocked dates
};

export default function CheckoutModal({ listing, checkIn, checkOut, guests, onClose, onBooked }: Props) {
  const { user, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = nights * listing.price_per_night;
  const total = Math.round(subtotal * 1.14);
  const serviceFee = total - subtotal;

  async function confirm() {
    if (!user) return;
    setLoading(true);
    try {
      const b = await api<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          listing_id: listing.id, check_in: checkIn, check_out: checkOut, guests,
        }),
      });
      setBooking(b);
      dispatchNotificationUpdate();
      onBooked();
      toast("Your trip is booked!");
    } catch (e) {
      toast((e as Error).message, "error"); // e.g. "These dates are no longer available"
      onBooked();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        {booking ? (
          <div className="py-6 text-center">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-4 text-2xl font-semibold">Booking confirmed</h2>
            <p className="mt-2 text-gray-500">Reservation #{booking.id} at {listing.title}</p>
            <p className="mt-1 text-gray-500">{fmt(booking.check_in)} - {fmt(booking.check_out)}</p>
            <p className="mt-2 font-semibold">{inr(booking.total_price)} paid with mock checkout</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/trips" className="rounded-lg bg-[#222] px-6 py-3 font-medium text-white">View my trips</Link>
              <button onClick={onClose} className="rounded-lg border border-gray-300 px-6 py-3 font-medium">Close</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Confirm and pay</h2>
              <button onClick={onClose} className="text-xl">✕</button>
            </div>
            <p className="font-semibold">{listing.title}</p>
            <p className="text-gray-500">{listing.location}</p>
            <p className="mt-2 text-sm text-gray-600">Hosted by {listing.host.name}</p>

            <div className="mt-5 space-y-1 border-t border-gray-200 pt-5">
              <p className="font-semibold">Your trip</p>
              <p className="text-gray-600">{fmt(checkIn)} - {fmt(checkOut)} ({nights} night{nights > 1 ? "s" : ""})</p>
              <p className="text-gray-600">{guests} guest{guests > 1 ? "s" : ""}</p>
            </div>

            <div className="mt-5 border-t border-gray-200 pt-5">
              <p className="font-semibold">Payment method (mock)</p>
              <div className="mt-2 rounded-lg border border-gray-300 p-3 text-sm text-gray-600">
                💳 Test card •••• 4242 (mock payment, no real charge)
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-gray-200 pt-5 text-sm">
              <div className="flex justify-between">
                <span className="underline">{inr(listing.price_per_night)} × {nights} night{nights > 1 ? "s" : ""}</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="underline">Service fee</span>
                <span>{inr(serviceFee)}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-between border-t border-gray-200 pt-5 text-lg font-semibold">
              <span>Total (INR)</span>
              <span>{inr(total)}</span>
            </div>

            <button onClick={confirm} disabled={loading}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#D70466] py-3.5 font-semibold text-white disabled:opacity-60">
              {loading ? "Processing mock payment..." : "Confirm and pay"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">Demo checkout only. No payment details are collected or charged.</p>
          </>
        )}
      </div>
    </div>
  );
}