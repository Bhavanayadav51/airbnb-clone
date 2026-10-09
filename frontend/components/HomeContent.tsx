"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, Listing } from "@/lib/api";
import ListingCard from "./ListingCard";
import ListingRow from "./ListingRow";
import SearchBar from "./SearchBar";
import CategoryBar from "./CategoryBar";

const SEARCH_KEYS = ["q", "check_in", "check_out", "guests", "property_type", "min_price", "max_price", "amenities"];
const TAGLINES: Record<string, string> = {
  "New Delhi": "India's capital with grand boulevards",
  Goa: "Beaches, villas and sunsets",
  Jaipur: "The Pink City of palaces and forts",
  Manali: "Snowy peaks and pine forests",
  Pune: "Maharashtra city with old forts",
  Mumbai: "The city that never sleeps",
};

export default function HomeContent() {
  const params = useSearchParams();
  const key = params.toString();
  const searching = SEARCH_KEYS.some((k) => params.get(k)); // rows when browsing, grid when searching
  const pageSize = searching ? 12 : 100;

  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");

  async function requestPage(pageNum: number) {
    const p = new URLSearchParams(key);
    p.set("page", String(pageNum));
    p.set("page_size", String(pageSize));
    return api<{ items: Listing[]; total: number }>(`/listings?${p.toString()}`);
  }

  async function load(pageNum: number, append: boolean) {
    setLoading(true);
    try {
      const res = await requestPage(pageNum);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      setTotal(res.total);
      setPage(pageNum);
      setError("");
    } catch {
      setError("Could not load listings. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const res = await requestPage(1);
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
        setError("");
      } catch {
        if (!active) return;
        setItems([]);
        setTotal(0);
        setError("Could not load listings. Is the backend running?");
      } finally {
        if (active) {
          setLoading(false);
          setLoadedKey(key);
        }
      }
    }

    void refresh();
    return () => {
      active = false;
    };
    // requestPage captures the current search parameters from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const isLoading = loading || loadedKey !== key;

  // dates and guests are carried over to the detail page
  const carry = new URLSearchParams();
  ["check_in", "check_out", "guests"].forEach((k) => {
    const v = params.get(k);
    if (v) carry.set(k, v);
  });

  // group by city for the row layout
  const groups = items.reduce<Record<string, Listing[]>>((acc, l) => {
    const city = l.location.split(",")[0];
    (acc[city] ||= []).push(l);
    return acc;
  }, {});

  const skeleton = (
    <div className="grid grid-cols-2 gap-4 py-6 md:grid-cols-4 xl:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-gray-200" />
          <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <SearchBar />
      <CategoryBar />

      {error && <p className="py-10 text-center text-red-600">{error}</p>}
      {isLoading && items.length === 0 && skeleton}

      {searching ? (
        <>
          {!isLoading && total > 0 && <p className="pt-6 text-sm font-medium">{total} place{total > 1 ? "s" : ""}</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 py-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {(isLoading ? [] : items).map((l) => (
              <ListingCard key={l.id} listing={l} query={carry.toString()} />
            ))}
          </div>

          {!isLoading && !error && items.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-xl font-semibold">No exact matches</p>
              <p className="mt-2 text-gray-500">Try changing or removing some of your filters.</p>
            </div>
          )}

          {!isLoading && items.length < total && (
            <div className="flex justify-center pb-16">
              <button
                onClick={() => load(page + 1, true)}
                disabled={loading}
                className="rounded-lg bg-[#222] px-6 py-3 font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {loading ? "Loading..." : "Show more"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="pb-16">
          {Object.entries(groups).map(([city, list]) => (
            <ListingRow key={city} city={city} tagline={TAGLINES[city]} items={list} />
          ))}
        </div>
      )}
    </>
  );
}