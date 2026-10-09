"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, Booking, inr } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import { fmt, iso } from "@/lib/dates";
import ConfirmationDialog from "./ConfirmationDialog";

export default function TripsContent() {
  const { user, toast } = useApp();
  const [trips, setTrips] = useState<Booking[] | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    api<Booking[]>(`/bookings?guest_id=${user.id}`)
      .then(setTrips)
      .catch(() => {
        toast("Could not load your trips", "error");
        setTrips([]);
      });
  }, [user, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel() {
    if (!user) return;
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await api(`/bookings/${pendingCancel.id}?guest_id=${user.id}`, { method: "DELETE" });
      toast("Reservation cancelled");
      setPendingCancel(null);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setCancelling(false);
    }
  }

  if (!trips) return <p className="py-20 text-center text-gray-500">Loading...</p>;

  const today = iso(new Date());
  const isUpcoming = (t: Booking) => t.status === "confirmed" && t.check_out >= today;
  const upcoming = trips.filter(isUpcoming);
  const past = trips.filter((t) => !isUpcoming(t));

  function TripCard({ t }: { t: Booking }) {
    return (
      <div className="flex gap-5 rounded-xl border border-gray-200 p-4">
        <img src={t.listing_image || ""} alt="" className="h-28 w-28 shrink-0 rounded-lg object-cover md:h-36 md:w-44" />
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <Link href={`/listing/${t.listing_id}`} className="text-lg font-semibold hover:underline">
              {t.listing_title}
            </Link>
            <p className="text-gray-500">{t.location}</p>
            <p className="mt-1 text-sm">
              {fmt(t.check_in)} - {fmt(t.check_out)} · {t.guests} guest{t.guests > 1 ? "s" : ""}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="font-semibold">
              {inr(t.total_price)}
              {t.status === "cancelled" && (
                <span className="ml-3 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Cancelled</span>
              )}
            </p>
            {isUpcoming(t) && (
              <button onClick={() => setPendingCancel(t)} className="text-sm font-semibold underline">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="mb-8 text-3xl font-semibold">Trips</h1>

      <h2 className="mb-4 text-xl font-semibold">Upcoming</h2>
      {upcoming.length === 0 ? (
        <div className="mb-10 rounded-xl bg-gray-50 p-8 text-center">
          <p className="font-semibold">No trips booked yet</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-[#222] px-5 py-3 font-medium text-white">
            Start searching
          </Link>
        </div>
      ) : (
        <div className="mb-10 space-y-4">{upcoming.map((t) => <TripCard key={t.id} t={t} />)}</div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Where you&apos;ve been</h2>
          <div className="space-y-4">{past.map((t) => <TripCard key={t.id} t={t} />)}</div>
        </>
      )}
      {pendingCancel && (
        <ConfirmationDialog
          title="Cancel this reservation?"
          description={`Your stay at ${pendingCancel.listing_title} from ${fmt(pendingCancel.check_in)} to ${fmt(pendingCancel.check_out)} will be cancelled. You can’t undo this action.`}
          cancelLabel="Keep reservation"
          confirmLabel="Cancel reservation"
          busyLabel="Cancelling..."
          busy={cancelling}
          onCancel={() => setPendingCancel(null)}
          onConfirm={cancel}
        />
      )}
    </div>
  );
}