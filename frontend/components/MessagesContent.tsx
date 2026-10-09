"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, Conversation, dispatchNotificationUpdate, Message } from "@/lib/api";
import { useApp } from "@/lib/AppContext";
import { fmt } from "@/lib/dates";

export default function MessagesContent() {
  const { user, toast } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = Number(searchParams.get("booking")) || null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    const rows = await api<Conversation[]>("/conversations");
    setConversations(rows);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api<Conversation[]>("/conversations")
      .then((rows) => { if (active) setConversations(rows); })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : "Could not load messages";
          setError(message);
          toast(message, "error");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, toast]);

  useEffect(() => {
    if (!user || !bookingId) return;
    let active = true;
    api<Message[]>(`/conversations/${bookingId}/messages`)
      .then((rows) => {
        if (!active) return;
        setMessages(rows);
        setError("");
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load this conversation");
      });
    return () => { active = false; };
  }, [user, bookingId]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!bookingId || !draft.trim()) return;
    setSending(true);
    try {
      const sent = await api<Message>(`/conversations/${bookingId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: draft.trim() }),
      });
      setMessages((current) => [...current, sent]);
      dispatchNotificationUpdate();
      setDraft("");
      await loadConversations();
      toast("Message sent");
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Could not send your message", "error");
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return <div className="py-24 text-center"><p className="text-xl font-semibold">Sign in to see your messages</p><Link href="/auth" className="mt-3 inline-block font-semibold underline">Sign in or create an account</Link></div>;
  }

  const activeConversation = conversations.find((item) => item.booking.id === bookingId);

  return (
    <div className="mx-auto max-w-5xl py-10">
      <h1 className="mb-6 text-3xl font-semibold">Messages</h1>
      {loading ? <p className="text-gray-500">Loading conversations...</p> : conversations.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="font-semibold">No conversations yet</p>
          <p className="mt-2 text-sm text-gray-600">You can message your host or guest after a reservation is made.</p>
          <Link href={user.role === "host" ? "/host" : "/trips"} className="mt-4 inline-block font-semibold underline">
            {user.role === "host" ? "View hosting" : "View your trips"}
          </Link>
        </div>
      ) : (
        <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-gray-200 md:grid-cols-[300px_1fr]">
          <aside className="border-b border-gray-200 md:border-b-0 md:border-r">
            <h2 className="border-b border-gray-100 px-4 py-3 font-semibold">Your conversations</h2>
            {conversations.map((item) => (
              <button
                key={item.booking.id}
                onClick={() => router.push(`/messages?booking=${item.booking.id}`)}
                className={`w-full border-b border-gray-100 p-4 text-left hover:bg-gray-50 ${item.booking.id === bookingId ? "bg-gray-50" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <img src={item.other_user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.other_user.name}</span>
                    <span className="block truncate text-xs text-gray-500">{item.booking.listing_title}</span>
                  </span>
                </span>
                {item.last_message && <span className="mt-2 block truncate text-xs text-gray-500">{item.last_message}</span>}
              </button>
            ))}
          </aside>

          <section className="flex min-h-[520px] flex-col">
            {!bookingId ? (
              <p className="m-auto px-6 text-center text-gray-500">Choose a conversation to message your host or guest.</p>
            ) : (
              <>
                <header className="border-b border-gray-200 px-5 py-4">
                  {activeConversation ? (
                    <>
                      <h2 className="font-semibold">{activeConversation.other_user.name}</h2>
                      <p className="text-sm text-gray-500">{activeConversation.booking.listing_title} · {fmt(activeConversation.booking.check_in)} - {fmt(activeConversation.booking.check_out)}</p>
                      <p className="mt-1 text-xs text-green-700">{activeConversation.other_user.email_verified ? "Email verified" : "Email not verified"}</p>
                    </>
                  ) : <p className="text-sm text-gray-500">Reservation conversation</p>}
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender_id === user.id ? "bg-[#222] text-white" : "bg-gray-100 text-gray-900"}`}>
                        <p className="mb-1 text-xs opacity-70">{message.sender_name} · {new Date(message.created_at).toLocaleString()}</p>
                        <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && !error && <p className="text-center text-sm text-gray-500">Start the conversation with a message.</p>}
                </div>
                <form onSubmit={send} className="flex gap-3 border-t border-gray-200 p-4">
                  <input
                    value={draft} onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000} placeholder="Write a message..." aria-label="Message"
                    className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-3"
                  />
                  <button disabled={sending || !draft.trim()} className="rounded-full bg-[#222] px-5 font-semibold text-white disabled:opacity-50">
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
