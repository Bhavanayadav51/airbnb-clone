"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, User } from "./api";

type ToastState = { msg: string; type: "success" | "error" } | null;

type AppCtx = {
  users: User[];
  user: User | null;
  setUserId: (id: number) => void;
  wishlist: number[];
  toggleWishlist: (listingId: number) => Promise<void>;
  toast: (msg: string, type?: "success" | "error") => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [toastState, setToastState] = useState<ToastState>(null);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3000);
  }, []);

  // load users once, restore the previously chosen user from the browser
  useEffect(() => {
    api<User[]>("/users")
      .then((list) => {
        setUsers(list);
        const saved = Number(localStorage.getItem("userId"));
        setUser(list.find((u) => u.id === saved) || list.find((u) => u.role === "guest") || list[0]);
      })
      .catch(() => toast("Cannot reach the backend. Is it running?", "error"));
  }, [toast]);

  // reload the wishlist whenever the user changes
  useEffect(() => {
    if (!user) return;
    api<{ id: number }[]>(`/wishlist?user_id=${user.id}`)
      .then((rows) => setWishlist(rows.map((r) => r.id)))
      .catch(() => {});
  }, [user]);

  function setUserId(id: number) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setUser(u);
    localStorage.setItem("userId", String(id));
    toast(`Switched to ${u.name}`);
  }

  async function toggleWishlist(listingId: number) {
    if (!user) return;
    const res = await api<{ saved: boolean }>(
      `/wishlist/toggle?user_id=${user.id}&listing_id=${listingId}`,
      { method: "POST" }
    );
    setWishlist((w) => (res.saved ? [...w, listingId] : w.filter((x) => x !== listingId)));
    toast(res.saved ? "Added to wishlist" : "Removed from wishlist");
  }

  return (
    <Ctx.Provider value={{ users, user, setUserId, wishlist, toggleWishlist, toast }}>
      {children}
      {toastState && (
        <div
          className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toastState.type === "error" ? "bg-[#C13515]" : "bg-[#222]"
          }`}
        >
          {toastState.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}