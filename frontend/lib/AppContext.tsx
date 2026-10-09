"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, User } from "./api";

type ToastState = { msg: string; type: "success" | "error" } | null;

type AppCtx = {
  user: User | null;
  authReady: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  setAuthenticated: (token: string, user: User) => void;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [toastState, setToastState] = useState<ToastState>(null);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3000);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    Promise.resolve().then(() => setTheme(initialTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      Promise.resolve().then(() => setAuthReady(true));
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch((error: unknown) => {
        localStorage.removeItem("authToken");
        if (error instanceof Error && !error.message.includes("session has expired")) {
          toast(error.message, "error");
        }
      })
      .finally(() => setAuthReady(true));
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api<{ id: number }[]>("/wishlist")
      .then((rows) => { if (active) setWishlist(rows.map((r) => r.id)); })
      .catch((error: unknown) => {
        if (active) toast(error instanceof Error ? error.message : "Could not load your wishlist", "error");
      });
    return () => { active = false; };
  }, [user, toast]);

  const setAuthenticated = useCallback((token: string, nextUser: User) => {
    localStorage.setItem("authToken", token);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
      toast("You are signed out");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not sign out from the server", "error");
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      setWishlist([]);
    }
  }, [toast]);

  async function toggleWishlist(listingId: number) {
    if (!user) {
      toast("Sign in to save listings", "error");
      return;
    }
    try {
      const res = await api<{ saved: boolean }>(
        `/wishlist/toggle?listing_id=${listingId}`,
        { method: "POST" }
      );
      setWishlist((w) => (res.saved ? [...w, listingId] : w.filter((x) => x !== listingId)));
      toast(res.saved ? "Added to wishlist" : "Removed from wishlist");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update your wishlist", "error");
    }
  }

  return (
    <Ctx.Provider value={{ user, authReady, theme, toggleTheme, setAuthenticated, signOut, wishlist, toggleWishlist, toast }}>
      {children}
      {toastState && (
        <div
          className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toastState.type === "error" ? "bg-[#C13515]" : "bg-[#222]"
          }`}
          role="status"
          aria-live="polite"
        >
          {toastState.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
