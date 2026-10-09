export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type User = {
  id: number; name: string; email: string | null; role: "guest" | "host";
  avatar: string; email_verified: boolean;
};

export type Review = {
  id: number; user: string; avatar: string; rating: number; comment: string; created_at: string;
};

export type Listing = {
  id: number; title: string; description: string; location: string; property_type: string;
  price_per_night: number; max_guests: number; bedrooms: number;
  amenities: string[]; images: string[];
  rating: number | null; review_count: number;
  host: { id: number; name: string; avatar: string; verified: boolean };
  reviews?: Review[];
};

export type Booking = {
  id: number; listing_id: number; listing_title: string; listing_image: string | null;
  location: string; guest_id: number; guest_name: string;
  guest_avatar: string; guest_verified: boolean; host_id: number; host_name: string;
  host_avatar: string; host_verified: boolean;
  check_in: string; check_out: string; guests: number; total_price: number; status: string;
};

export type Notification = {
  id: number; title: string; message: string; link: string; booking_id: number | null;
  read: boolean; created_at: string;
};

export type Message = {
  id: number; booking_id: number; sender_id: number; sender_name: string;
  sender_avatar: string; body: string; created_at: string;
};

export type Conversation = {
  booking: Booking;
  other_user: Pick<User, "id" | "name" | "role" | "avatar" | "email_verified">;
  last_message: string | null;
};

// One helper for every backend call, so errors are handled in one place
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = typeof window === "undefined" ? null : localStorage.getItem("authToken");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(API + path, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Something went wrong");
  }
  return res.json();
}

export function dispatchNotificationUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notifications-updated"));
  }
}

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");