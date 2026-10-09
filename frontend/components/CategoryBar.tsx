"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AMENITIES } from "@/lib/constants";
import { useApp } from "@/lib/AppContext";

const TYPES = [
  { name: "All", icon: "🌍" },
  { name: "House", icon: "🏡" },
  { name: "Apartment", icon: "🏢" },
  { name: "Villa", icon: "🏖️" },
  { name: "Cabin", icon: "🛖" },
  { name: "Boat", icon: "⛵" },
  { name: "Treehouse", icon: "🌳" },
];

export default function CategoryBar() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useApp();
  const key = params.toString();
  const active = params.get("property_type") || "All";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{
    key: string; min: string; max: string; amen: string[];
  } | null>(null);
  const current = draft?.key === key ? draft : null;
  const min = current?.min ?? params.get("min_price") ?? "";
  const max = current?.max ?? params.get("max_price") ?? "";
  const amen = current?.amen ?? (params.get("amenities") || "").split(",").filter(Boolean);

  function updateDraft(changes: Partial<Omit<NonNullable<typeof draft>, "key">>) {
    setDraft({ key, min, max, amen, ...changes });
  }

  // change some URL params and keep the rest
  function update(changes: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.push(`/?${p.toString()}`);
  }

  const toggle = (a: string) =>
    updateDraft({ amen: amen.includes(a) ? amen.filter((x) => x !== a) : [...amen, a] });

  return (
    <div className="flex items-center justify-between gap-6 border-b border-gray-100 pt-2">
      <div className="flex gap-8 overflow-x-auto">
        {TYPES.map((t) => (
          <button
            key={t.name}
            onClick={() => update({ property_type: t.name === "All" ? "" : t.name })}
            className={`flex shrink-0 flex-col items-center gap-1 border-b-2 pb-3 text-xs font-medium ${
              active === t.name ? "border-black text-black" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-black"
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>

      <button onClick={() => setOpen(true)} className="mb-2 shrink-0 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium hover:border-black">
        ⚙ Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setOpen(false)} className="text-xl">✕</button>
            </div>

            <h3 className="mb-3 font-semibold">Price range (per night)</h3>
            <div className="flex gap-4">
              <input type="number" min="0" placeholder="Min ₹" value={min} onChange={(e) => updateDraft({ min: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black" />
              <input type="number" min="0" placeholder="Max ₹" value={max} onChange={(e) => updateDraft({ max: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black" />
            </div>

            <h3 className="mb-3 mt-8 font-semibold">Amenities</h3>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={amen.includes(a)} onChange={() => toggle(a)} /> {a}
                </label>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => { updateDraft({ min: "", max: "", amen: [] }); update({ min_price: "", max_price: "", amenities: "" }); setOpen(false); }}
                className="font-semibold underline"
              >
                Clear all
              </button>
              <button
                onClick={() => {
                  if (min && Number(min) < 0 || max && Number(max) < 0) {
                    toast("Prices cannot be negative", "error");
                    return;
                  }
                  if (min && max && Number(min) > Number(max)) {
                    toast("Minimum price cannot exceed maximum price", "error");
                    return;
                  }
                  update({ min_price: min, max_price: max, amenities: amen.join(",") });
                  setOpen(false);
                }}
                className="rounded-lg bg-[#222] px-6 py-3 font-medium text-white hover:bg-black"
              >
                Show places
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}