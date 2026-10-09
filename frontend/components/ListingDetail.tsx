"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api, Listing } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import { fmt, nightsBetween } from "@/lib/dates";
import PhotoGallery from "./PhotoGallery";
import DateRangePicker from "./DateRangePicker";
import BookingCard from "./BookingCard";
import CheckoutModal from "./CheckoutModal";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const searchKey = sp.toString();
  const { user, toast, wishlist, toggleWishlist } = useApp();

  const [listing, setListing] = useState<Listing | null>(null);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [bookingDraft, setBookingDraft] = useState<{
    key: string; checkIn: string; checkOut: string; guests: number;
  } | null>(null);
  const currentDraft = bookingDraft?.key === searchKey ? bookingDraft : null;
  const checkIn = currentDraft?.checkIn ?? sp.get("check_in") ?? "";
  const checkOut = currentDraft?.checkOut ?? sp.get("check_out") ?? "";
  const guests = currentDraft?.guests ?? (Number(sp.get("guests")) || 1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const loadBooked = useCallback(
    async () => {
      try {
        const dates = await api<string[]>(`/listings/${id}/booked-dates`);
        setBooked(new Set(dates));
      } catch {
        toast("Could not load this listing's availability", "error");
        setError("Availability could not be loaded. Please try again.");
      }
    },
    [id, toast]
  );

  useEffect(() => {
    api<Listing>(`/listings/${id}`).then(setListing).catch(() => setError("This listing could not be found."));
    void Promise.resolve().then(loadBooked);
  }, [id, loadBooked]);

  if (error) return <p className="py-20 text-center text-gray-600">{error}</p>;
  if (!listing) return <p className="py-20 text-center text-gray-500">Loading...</p>;

  const saved = wishlist.includes(listing.id);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  function updateBookingDraft(changes: Partial<Omit<NonNullable<typeof bookingDraft>, "key">>) {
    setBookingDraft({ key: searchKey, checkIn, checkOut, guests, ...changes });
  }

  function reserve() {
    if (!user || !listing) return;
    if (!checkIn || !checkOut) return toast("Select your check-in and checkout dates first", "error");
    if (user.id === listing.host.id) return toast("You can't book your own listing", "error");
    setCheckoutOpen(true);
  }

  return (
    <div className="pb-20 pt-6">
      <h1 className="text-2xl font-semibold md:text-3xl">{listing.title}</h1>
      <div className="mb-6 mt-2 flex items-center justify-between text-sm">
        <p className="font-medium">
          {listing.rating ? `★ ${listing.rating} · ${listing.review_count} reviews · ` : ""}
          <span className="underline">{listing.location}</span>
        </p>
        <button onClick={() => toggleWishlist(listing.id)} className="rounded-lg px-3 py-2 font-medium underline hover:bg-gray-100">
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
      </div>

      <PhotoGallery images={listing.images} title={listing.title} />

      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-20">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-xl font-semibold">{listing.property_type} hosted by {listing.host.name}</h2>
              <p className="mt-1 text-gray-500">
                {listing.max_guests} guests · {listing.bedrooms} bedroom{listing.bedrooms > 1 ? "s" : ""}
              </p>
            </div>
            <img src={listing.host.avatar} alt="" className="h-14 w-14 rounded-full" />
          </div>

          <p className="border-b border-gray-200 py-8 leading-relaxed">{listing.description}</p>

          <div className="border-b border-gray-200 py-8">
            <h2 className="mb-5 text-xl font-semibold">What this place offers</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listing.amenities.map((a) => (
                <p key={a} className="flex items-center gap-3">✓ {a}</p>
              ))}
            </div>
          </div>

          <div className="border-b border-gray-200 py-8">
            <h2 className="text-xl font-semibold">
              {nights ? `${nights} night${nights > 1 ? "s" : ""} in ${listing.location}` : "Select check-in date"}
            </h2>
            <p className="mb-6 mt-1 text-sm text-gray-500">
              {checkIn && checkOut ? `${fmt(checkIn)} - ${fmt(checkOut)}` : "Add your travel dates for exact pricing"}
            </p>
            <DateRangePicker
              booked={booked}
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(a, b) => updateBookingDraft({ checkIn: a, checkOut: b })}
            />
          </div>

          <div className="border-b border-gray-200 py-8">
            <h2 className="mb-5 text-xl font-semibold">Where you&apos;ll be</h2>
            <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              📍 {listing.location} (map coming soon)
            </div>
          </div>

          <div className="py-8">
            <h2 className="mb-6 text-xl font-semibold">
              {listing.rating ? `★ ${listing.rating} · ${listing.review_count} reviews` : "No reviews yet"}
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {listing.reviews?.map((r) => (
                <div key={r.id}>
                  <div className="mb-2 flex items-center gap-3">
                    <img src={r.avatar} alt="" className="h-10 w-10 rounded-full" />
                    <div>
                      <p className="font-semibold">{r.user}</p>
                      <p className="text-xs text-gray-500">{"★".repeat(r.rating)}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <BookingCard
            listing={listing}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            setGuests={(n) => updateBookingDraft({ guests: n })}
            onReserve={reserve}
          />
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          listing={listing}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onClose={() => {
            setCheckoutOpen(false);
            updateBookingDraft({ checkIn: "", checkOut: "" });
          }}
          onBooked={loadBooked}
        />
      )}
    </div>
  );
}