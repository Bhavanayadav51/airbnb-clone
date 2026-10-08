"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Listing } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import { AMENITIES, PROPERTY_TYPES } from "@/lib/constants";

type Field = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

export default function ListingForm({ mode }: { mode: "create" | "edit" }) {
  const { user, toast } = useApp();
  const router = useRouter();
  const { id } = useParams<{ id?: string }>();

  const [f, setF] = useState({
    title: "", description: "", location: "", property_type: "House",
    price_per_night: "", max_guests: "2", bedrooms: "1",
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState(""); // one URL per line
  const [saving, setSaving] = useState(false);

  // edit mode: load the existing listing into the form
  useEffect(() => {
    if (mode !== "edit" || !id) return;
    api<Listing>(`/listings/${id}`).then((l) => {
      setF({
        title: l.title, description: l.description, location: l.location,
        property_type: l.property_type, price_per_night: String(l.price_per_night),
        max_guests: String(l.max_guests), bedrooms: String(l.bedrooms),
      });
      setAmenities(l.amenities);
      setImages(l.images.join("\n"));
    });
  }, [mode, id]);

  const set = (k: keyof typeof f) => (e: Field) => setF({ ...f, [k]: e.target.value });
  const toggleAmenity = (a: string) =>
    setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  function fillSamplePhotos() {
    const seed = Math.floor(Math.random() * 10000);
    setImages(Array.from({ length: 5 }, (_, i) => `https://picsum.photos/seed/new${seed}-${i}/900/700`).join("\n"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const imageList = images.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!f.title.trim() || !f.location.trim()) return toast("Title and location are required", "error");
    if (!(Number(f.price_per_night) > 0)) return toast("Enter a valid nightly price", "error");
    if (imageList.length === 0) return toast("Add at least one photo URL", "error");

    setSaving(true);
    try {
      await api(mode === "create" ? "/listings" : `/listings/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify({
          host_id: user.id,
          title: f.title.trim(), description: f.description, location: f.location.trim(),
          property_type: f.property_type,
          price_per_night: Number(f.price_per_night),
          max_guests: Number(f.max_guests), bedrooms: Number(f.bedrooms),
          amenities, images: imageList,
        }),
      });
      toast(mode === "create" ? "Listing created" : "Listing updated");
      router.push("/host");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (user && user.role !== "host") {
    return <p className="py-24 text-center text-gray-600">Switch to a host account to manage listings.</p>;
  }

  const box = "w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black";
  const lab = "mb-1 block text-sm font-semibold";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 py-10">
      <h1 className="text-3xl font-semibold">{mode === "create" ? "Create a listing" : "Edit listing"}</h1>

      <div><label className={lab}>Title</label><input className={box} value={f.title} onChange={set("title")} /></div>
      <div><label className={lab}>Description</label><textarea rows={4} className={box} value={f.description} onChange={set("description")} /></div>
      <div><label className={lab}>Location (e.g. Goa, India)</label><input className={box} value={f.location} onChange={set("location")} /></div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lab}>Property type</label>
          <select className={box} value={f.property_type} onChange={set("property_type")}>
            {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={lab}>Price per night (₹)</label><input type="number" min="1" className={box} value={f.price_per_night} onChange={set("price_per_night")} /></div>
        <div><label className={lab}>Max guests</label><input type="number" min="1" className={box} value={f.max_guests} onChange={set("max_guests")} /></div>
        <div><label className={lab}>Bedrooms</label><input type="number" min="1" className={box} value={f.bedrooms} onChange={set("bedrooms")} /></div>
      </div>

      <div>
        <label className={lab}>Amenities</label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} /> {a}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold">Photo URLs (one per line)</label>
          <button type="button" onClick={fillSamplePhotos} className="text-sm font-semibold underline">Use sample photos</button>
        </div>
        <textarea rows={5} className={box} value={images} onChange={(e) => setImages(e.target.value)} placeholder="https://..." />
      </div>

      <button disabled={saving} className="w-full rounded-lg bg-[#222] py-3.5 font-semibold text-white hover:bg-black disabled:opacity-60">
        {saving ? "Saving..." : mode === "create" ? "Create listing" : "Save changes"}
      </button>
    </form>
  );
}