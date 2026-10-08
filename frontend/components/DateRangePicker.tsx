"use client";
import { useState } from "react";
import { iso, parse, addDays } from "@/lib/dates";

type Props = {
  booked: Set<string>; // nights that are already taken
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DateRangePicker({ booked, checkIn, checkOut, onChange }: Props) {
  const today = iso(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = checkIn ? parse(checkIn) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const selectingEnd = !!checkIn && !checkOut;

  // true if every night from `from` up to (not including) `to` is free
  function nightsFree(from: string, to: string) {
    for (let d = parse(from); iso(d) < to; d = addDays(d, 1)) {
      if (booked.has(iso(d))) return false;
    }
    return true;
  }

  function isDisabled(day: string) {
    // choosing checkout: allowed if no booked night lies between check-in and this day
    if (selectingEnd && day > checkIn) return !nightsFree(checkIn, day);
    // choosing check-in: not in the past, not already booked
    return day < today || booked.has(day);
  }

  function pick(day: string) {
    if (isDisabled(day)) return;
    if (selectingEnd && day > checkIn) onChange(checkIn, day);
    else onChange(day, "");
  }

  const months = [cursor, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)];
  const canGoBack = iso(cursor) > iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  return (
    <div>
      <div className="flex items-start gap-10">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          disabled={!canGoBack}
          className="mt-1 h-8 w-8 rounded-full hover:bg-gray-100 disabled:opacity-20"
        >
          ‹
        </button>

        <div className="grid flex-1 gap-10 md:grid-cols-2">
          {months.map((m, idx) => {
            const first = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
            const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
            return (
              <div key={idx} className={idx === 1 ? "hidden md:block" : ""}>
                <p className="mb-4 text-center font-semibold">
                  {m.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
                <div className="grid grid-cols-7 text-center text-xs text-gray-500">
                  {WEEKDAYS.map((w) => (
                    <span key={w} className="py-2">{w}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: first }).map((_, i) => (
                    <span key={"b" + i} />
                  ))}
                  {Array.from({ length: count }).map((_, i) => {
                    const day = iso(new Date(m.getFullYear(), m.getMonth(), i + 1));
                    const dis = isDisabled(day);
                    const selected = day === checkIn || day === checkOut;
                    const inRange = !!checkIn && !!checkOut && day > checkIn && day < checkOut;
                    return (
                      <button
                        key={day}
                        disabled={dis}
                        onClick={() => pick(day)}
                        className={`mx-auto h-12 w-full text-sm ${
                          selected
                            ? "rounded-full bg-[#222] font-semibold text-white"
                            : inRange
                            ? "bg-gray-100"
                            : dis
                            ? "cursor-not-allowed text-gray-300 line-through"
                            : "rounded-full border border-transparent hover:border-black"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="mt-1 h-8 w-8 rounded-full hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      <div className="mt-4 text-right">
        <button onClick={() => onChange("", "")} className="text-sm font-semibold underline">
          Clear dates
        </button>
      </div>
    </div>
  );
}