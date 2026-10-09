"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Notification } from "@/lib/api";
import { useApp } from "@/lib/AppContext";

const COMING_SOON = [
  { label: "Experiences", icon: "🎈" },
  { label: "Services", icon: "🛎️" },
];

export default function Navbar() {
  const { user, authReady, theme, toggleTheme, signOut, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const close = () => setOpen(false);
  const circle = "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#f2f2f2] hover:bg-gray-200";

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = () => {
      api<Notification[]>("/notifications")
        .then((rows) => { if (active) setUnread(rows.filter((item) => !item.read).length); })
        .catch((error: unknown) => {
          if (active) toast(error instanceof Error ? error.message : "Could not load notifications", "error");
        });
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("notifications-updated", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("notifications-updated", refresh);
    };
  }, [user, toast]);

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="relative mx-auto flex h-20 max-w-[1760px] items-center justify-between px-5 md:px-10 xl:px-20">
        <Link href="/" className="text-[28px] font-bold tracking-tight text-[#FF385C]">
          airbnb
        </Link>

        {/* centered tabs; only Homes is real, the others are placeholders */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-8 md:flex">
          <Link href="/" className="flex items-center gap-2 border-b-[3px] border-black py-3 text-base font-medium">
            <span className="text-3xl">🏠</span> Homes
          </Link>
          {COMING_SOON.map((t) => (
            <button
              key={t.label}
              onClick={() => toast(`${t.label} are coming soon`)}
              className="flex items-center gap-2 border-b-[3px] border-transparent py-3 text-base text-gray-600 hover:text-black"
            >
              <span className="text-3xl">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <div className="relative flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-gray-200 px-3 text-sm font-medium hover:bg-gray-100"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          {user?.role === "host" && (
            <Link href="/host" className="hidden rounded-full px-4 py-3 text-sm font-medium hover:bg-gray-100 md:block">
              Host dashboard
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className={circle} aria-label="Account">
            {user && <img src={user.avatar} alt="" className="h-full w-full object-cover" />}
          </button>
          <button onClick={() => setOpen(!open)} className={`${circle} relative`} aria-label="Menu">
            ☰
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E61E4D] px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>

          {open && (
            <>
              <div className="fixed inset-0" onClick={close} />
              <div className="absolute right-0 top-14 z-50 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                {!authReady ? (
                  <p className="px-4 py-3 text-sm text-gray-500">Loading account...</p>
                ) : user ? (
                  <>
                    <div className="border-b border-gray-100 px-4 pb-3">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="mt-1 text-xs text-green-700">{user.email_verified ? "Email verified" : "Email not verified"}</p>
                    </div>
                    <Link href="/trips" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Trips</Link>
                    <Link href="/wishlist" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Wishlists</Link>
                    <Link href="/messages" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Messages</Link>
                    <Link href="/notifications" onClick={close} className="flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-gray-100">
                      Notifications {unread > 0 && <span className="rounded-full bg-[#E61E4D] px-2 py-0.5 text-xs text-white">{unread}</span>}
                    </Link>
                    {user.role === "host" && (
                      <Link href="/host" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Host dashboard</Link>
                    )}
                    <div className="my-2 border-t border-gray-200" />
                    <button onClick={() => { close(); void signOut(); }} className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-100">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth" onClick={close} className="block px-4 py-3 text-sm font-semibold hover:bg-gray-100">Sign in</Link>
                    <Link href="/auth" onClick={close} className="block px-4 py-3 text-sm hover:bg-gray-100">Create an account</Link>
                    <div className="my-2 border-t border-gray-200" />
                    <button onClick={() => { close(); toast("Create an account and choose Host to start hosting."); }} className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-100">Become a host</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}