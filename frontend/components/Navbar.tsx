"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";

const COMING_SOON = [
  { label: "Experiences", icon: "🎈" },
  { label: "Services", icon: "🛎️" },
];

export default function Navbar() {
  const { users, user, setUserId, toast } = useApp();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const circle = "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#f2f2f2] hover:bg-gray-200";

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
          <Link href="/host" className="hidden rounded-full px-4 py-3 text-sm font-medium hover:bg-gray-100 md:block">
            Become a host
          </Link>
          <button onClick={() => setOpen(!open)} className={circle} aria-label="Account">
            {user && <img src={user.avatar} alt="" className="h-full w-full object-cover" />}
          </button>
          <button onClick={() => setOpen(!open)} className={circle} aria-label="Menu">
            ☰
          </button>

          {open && (
            <>
              <div className="fixed inset-0" onClick={close} />
              <div className="absolute right-0 top-14 z-50 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                <Link href="/trips" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Trips</Link>
                <Link href="/wishlist" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Wishlists</Link>
                {user?.role === "host" && (
                  <Link href="/host" onClick={close} className="block px-4 py-3 text-sm font-medium hover:bg-gray-100">Host dashboard</Link>
                )}
                <div className="my-2 border-t border-gray-200" />
                <p className="px-4 pb-1 text-xs font-semibold text-gray-500">SWITCH ACCOUNT</p>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setUserId(u.id); close(); }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 ${user?.id === u.id ? "font-semibold" : ""}`}
                  >
                    <img src={u.avatar} alt="" className="h-6 w-6 rounded-full" />
                    {u.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}