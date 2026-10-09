"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, dispatchNotificationUpdate, Notification } from "@/lib/api";
import { useApp } from "@/lib/AppContext";

export default function NotificationsContent() {
  const { user, toast } = useApp();
  const [items, setItems] = useState<Notification[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api<Notification[]>("/notifications")
      .then((rows) => { if (active) setItems(rows); })
      .catch((error: unknown) => {
        if (!active) return;
        toast(error instanceof Error ? error.message : "Could not load notifications", "error");
        setItems([]);
      });
    return () => { active = false; };
  }, [user, toast]);

  async function markRead(id: number) {
    try {
      await api(`/notifications/${id}/read`, { method: "POST" });
      setItems((current) => current?.map((item) => item.id === id ? { ...item, read: true } : item) ?? []);
      dispatchNotificationUpdate();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not mark notification as read", "error");
    }
  }

  async function markAllRead() {
    try {
      await api("/notifications/read-all", { method: "POST" });
      setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? []);
      dispatchNotificationUpdate();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not mark notifications as read", "error");
    }
  }

  if (!user) {
    return <div className="py-24 text-center"><p className="text-xl font-semibold">Sign in to see notifications</p><Link href="/auth" className="mt-3 inline-block font-semibold underline">Sign in or create an account</Link></div>;
  }
  if (!items) return <p className="py-20 text-center text-gray-500">Loading notifications...</p>;

  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        {items.some((item) => !item.read) && (
          <button onClick={() => void markAllRead()} className="text-sm font-semibold underline">Mark all as read</button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-8 text-center text-gray-600">You&apos;re all caught up. Booking and message updates will appear here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`rounded-xl border p-4 ${item.read ? "border-gray-200" : "border-rose-200 bg-rose-50/50"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-gray-700">{item.message}</p>
                  <time className="mt-2 block text-xs text-gray-500" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {!item.read && <button onClick={() => void markRead(item.id)} className="text-xs font-semibold underline">Mark read</button>}
                  <Link href={item.link} onClick={() => { if (!item.read) void markRead(item.id); }} className="text-sm font-semibold underline">Open</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
