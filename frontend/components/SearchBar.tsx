"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import DateRangePicker from "./DateRangePicker";
import { parse } from "@/lib/dates";

type Panel = "where" | "when" | "who" | null;
const NO_BOOKED = new Set<string>(); // the home search has no blocked dates
const DESTINATIONS = ["New Delhi", "Goa", "Jaipur", "Manali"];
const short = (s: string) => parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [panel, setPanel] = useState<Panel>(null);
  const [q, setQ] = useState(params.get("q") || "");
  const [checkIn, setCheckIn] = useState(params.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(params.get("check_out") || "");
  const [guests, setGuests] = useState(Number(params.get("guests")) || 0);

  function search() {
    const p = new URLSearchParams(params.toString());
    const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
    set("q", q.trim());
    set("check_in", checkIn);
    set("check_out", checkOut);
    set("guests", guests ? String(guests) : "");
    setPanel(null);
    router.push(`/?${p.toString()}`);
  }

  // the active segment turns white, the others go grey (like Airbnb)
  const seg = (name: Panel) =>
    `flex-1 cursor-pointer rounded-full px-7 py-3.5 transition ${
      panel === name ? "bg-white shadow-xl" : panel ? "hover:bg-[#dcdcdc]" : "hover:bg-gray-100"
    }`;
  const label = "block text-xs font-semibold";
  const popover = "absolute top-[calc(100%+12px)] z-50 rounded-3xl bg-white p-6 shadow-2xl";

  return (
    <div className="relative mx-auto my-6 w-full max-w-[850px]">
      {panel && <div className="fixed inset-0 z-30" onClick={() => setPanel(null)} />}

      <div
        className={`relative z-40 flex flex-col items-stretch rounded-3xl border border-gray-200 shadow-md md:flex-row md:items-center md:rounded-full ${
          panel ? "bg-[#ebebeb]" : "bg-white"
        }`}
      >
        <div className={seg("where")} onClick={() => setPanel("where")}>
          <span className={label}>Where</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search destinations"
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-500"
          />
        </div>
        <span className="hidden h-8 w-px bg-gray-300 md:block" />

        <div className={seg("when")} onClick={() => setPanel("when")}>
          <span className={label}>When</span>
          <span className="text-sm text-gray-500">
            {checkIn && checkOut ? `${short(checkIn)} – ${short(checkOut)}` : checkIn ? `${short(checkIn)} – ?` : "Add dates"}
          </span>
        </div>
        <span className="hidden h-8 w-px bg-gray-300 md:block" />

        <div className={seg("who")} onClick={() => setPanel("who")}>
          <span className={label}>Who</span>
          <span className="text-sm text-gray-500">
            {guests ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests"}
          </span>
        </div>

        <button
          onClick={search}
          className="m-2 flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#FF385C] font-medium text-white hover:bg-[#E31C5F] md:w-12"
          aria-label="Search"
        >
          <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" stroke="white" strokeWidth="4">
            <circle cx="13" cy="13" r="10" /><path d="M29 29 21 21" />
          </svg>
          <span className="md:hidden">Search</span>
        </button>
      </div>

      {panel === "where" && (
        <div className={`${popover} left-0 w-[400px] max-w-full`}>
          <p className="mb-3 text-xs font-semibold">Suggested destinations</p>
          {DESTINATIONS.map((d) => (
            <button
              key={d}
              onClick={() => { setQ(d); setPanel("when"); }}
              className="flex w-full items-center gap-4 rounded-xl p-3 text-left hover:bg-gray-100"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xl">📍</span>
              <span className="font-medium">{d}, India</span>
            </button>
          ))}
        </div>
      )}

      {panel === "when" && (
        <div className={`${popover} left-1/2 w-[min(820px,92vw)] -translate-x-1/2`}>
          <DateRangePicker
            booked={NO_BOOKED}
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(a, b) => { setCheckIn(a); setCheckOut(b); if (b) setPanel("who"); }}
          />
        </div>
      )}

      {panel === "who" && (
        <div className={`${popover} right-0 w-[380px] max-w-full`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Guests</p>
              <p className="text-sm text-gray-500">Total number of guests</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setGuests(Math.max(0, guests - 1))} disabled={guests === 0}
                className="h-8 w-8 rounded-full border border-gray-400 disabled:opacity-30">−</button>
              <span className="w-4 text-center">{guests}</span>
              <button onClick={() => setGuests(guests + 1)}
                className="h-8 w-8 rounded-full border border-gray-400">+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}