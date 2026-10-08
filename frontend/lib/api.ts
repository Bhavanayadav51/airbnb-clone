export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type User = { id: number; name: string; role: "guest" | "host"; avatar: string };

export type Review = {
  id: number; user: string; avatar: string; rating: number; comment: string; created_at: string;
};

export type Listing = {
  id: number; title: string; description: string; location: string; property_type: string;
  price_per_night: number; max_guests: number; bedrooms: number;
  amenities: string[]; images: string[];
  rating: number | null; review_count: number;
  host: { id: number; name: string; avatar: string };
  reviews?: Review[];
};

export type Booking = {
  id: number; listing_id: number; listing_title: string; listing_image: string | null;
  location: string; guest_id: number; guest_name: string;
  check_in: string; check_out: string; guests: number; total_price: number; status: string;
};

// One helper for every backend call, so errors are handled in one place
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Something went wrong");
  }
  return res.json();
}

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");