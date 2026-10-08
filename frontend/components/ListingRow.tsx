"use client";
import Link from "next/link";
import { useRef } from "react";
import { Listing } from "@/lib/api";
import ListingCard from "./ListingCard";

export default function ListingRow({ city, tagline, items }: { city: string; tagline?: string; items: Listing[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200";

  return (
    <section className="py-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <Link href={`/?q=${encodeURIComponent(city)}`} className="flex items-center gap-2 text-[22px] font-semibold">
            Popular homes in {city}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-sm">→</span>
          </Link>
          {tagline && <p className="text-gray-500">{tagline}</p>}
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => scroll(-1)} className={arrow} aria-label="Previous">‹</button>
          <button onClick={() => scroll(1)} className={arrow} aria-label="Next">›</button>
        </div>
      </div>

      <div ref={ref} className="flex gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((l) => (
          <div key={l.id} className="w-[44%] shrink-0 sm:w-[30%] md:w-[22%] lg:w-[18%] xl:w-[13.2%]">
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
    </section>
  );
}