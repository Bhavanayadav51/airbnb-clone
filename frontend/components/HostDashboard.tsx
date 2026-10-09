"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, Booking, Listing, inr } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import { fmt } from "@/lib/dates";
import ConfirmationDialog from "./ConfirmationDialog";

export default function HostDashboard() {
  const { user, toast } = useApp();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadError, setLoadError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user || user.role !== "host") return;
    setLoadError("");
    try {
      const [hostListings, hostBookings] = await Promise.all([
        api<Listing[]>(`/host/${user.id}/listings`),
        api<Booking[]>(`/host/${user.id}/bookings`),
      ]);
      setListings(hostListings);
      setBookings(hostBookings);
    } catch {
      setLoadError("Could not load host information. Please try again.");
      toast("Could not load host information", "error");
      setListings([]);
      setBookings([]);
    }
  }, [user, toast]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function remove() {
    if (!user || !pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/listings/${pendingDelete.id}?host_id=${user.id}`, { method: "DELETE" });
      toast("Listing deleted");
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  if (user.role !== "host") {
    return (
      <div className="py-24 text-center">
        <p className="text-xl font-semibold">Hosting is for host accounts</p>
        <p className="mt-2 text-gray-500">Use the top-right menu to switch to a host account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Your listings</h1>
        <Link href="/host/new" className="rounded-lg bg-[#222] px-5 py-3 font-medium text-white hover:bg-black">
          + Create listing
        </Link>
      </div>

      {!listings ? (
        <p className="text-gray-500">Loading...</p>
      ) : loadError ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="text-gray-600">{loadError}</p>
          <button onClick={load} className="mt-3 font-semibold underline">Try again</button>
        </div>
      ) : listings.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-8 text-center text-gray-500">You have no listings yet.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-5 rounded-xl border border-gray-200 p-4">
              <img src={l.images[0]} alt="" className="h-20 w-28 rounded-lg object-cover" />
              <div className="flex-1">
                <Link href={`/listing/${l.id}`} className="font-semibold hover:underline">{l.title}</Link>
                <p className="text-sm text-gray-500">{l.location} · {inr(l.price_per_night)} / night</p>
              </div>
              <Link href={`/host/edit/${l.id}`} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:border-black">
                Edit
              </Link>
              <button onClick={() => setPendingDelete(l)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-14 text-2xl font-semibold">Reservations</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No reservations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">Listing</th><th className="p-3">Guest</th><th className="p-3">Dates</th>
                <th className="p-3">Guests</th><th className="p-3">Total</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="p-3">{b.listing_title}</td>
                  <td className="p-3">{b.guest_name}</td>
                  <td className="p-3">{fmt(b.check_in)} - {fmt(b.check_out)}</td>
                  <td className="p-3">{b.guests}</td>
                  <td className="p-3">{inr(b.total_price)}</td>
                  <td className="p-3 capitalize">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pendingDelete && (
        <ConfirmationDialog
          title="Delete this listing?"
          description={`“${pendingDelete.title}” and its reservations will be permanently deleted. This can’t be undone.`}
          cancelLabel="Keep listing"
          confirmLabel="Delete listing"
          busyLabel="Deleting..."
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}