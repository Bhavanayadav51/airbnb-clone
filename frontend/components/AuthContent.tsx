"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";
import { useApp } from "@/lib/AppContext";

type AuthResponse = { token: string; user: User };
type RegistrationResponse = { user: User; message: string; verification_code: string };

export default function AuthContent() {
  const { setAuthenticated, toast } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"account" | "verify">("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "host">("guest");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "verify") {
        const result = await api<AuthResponse>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ email, code }),
        });
        setAuthenticated(result.token, result.user);
        toast("Email verified. Welcome!");
        router.push("/");
      } else if (mode === "register") {
        const result = await api<RegistrationResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        });
        setDemoCode(result.verification_code);
        setStep("verify");
      } else {
        const result = await api<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuthenticated(result.token, result.user);
        toast(`Welcome back, ${result.user.name}`);
        router.push("/");
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Something went wrong";
      if (mode === "login" && step === "account" && message.includes("Verify your email")) {
        try {
          const result = await api<{ verification_code: string }>("/auth/resend-verification", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          setDemoCode(result.verification_code);
          setStep("verify");
          return;
        } catch (resendError) {
          setError(resendError instanceof Error ? resendError.message : message);
          return;
        }
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ verification_code: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDemoCode(result.verification_code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend the verification code");
    } finally {
      setBusy(false);
    }
  }

  function chooseMode(next: "login" | "register") {
    setMode(next);
    setStep("account");
    setError("");
    setDemoCode("");
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-2xl border border-gray-200 p-7 shadow-sm">
        <h1 className="text-2xl font-semibold">
          {step === "verify" ? "Verify your email" : mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {step === "verify"
            ? `Enter the six-digit demo code for ${email}.`
            : mode === "login"
              ? "Sign in to manage your trips, messages, and listings."
              : "Your account keeps your profile, bookings, and messages together."}
        </p>

        {step === "verify" && (
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            Email delivery is mocked for this demo. Your verification code is{" "}
            <strong className="font-mono text-lg">{demoCode}</strong>.
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {step === "account" && mode === "register" && (
            <>
              <label className="block text-sm font-medium">
                Full name
                <input
                  required minLength={1} maxLength={100} autoComplete="name"
                  value={name} onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Account type
                <select
                  value={role} onChange={(event) => setRole(event.target.value as "guest" | "host")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3"
                >
                  <option value="guest">Guest</option>
                  <option value="host">Host</option>
                </select>
              </label>
            </>
          )}

          {step === "account" && (
            <>
              <label className="block text-sm font-medium">
                Email
                <input
                  required type="email" autoComplete="email" value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  required minLength={mode === "register" ? 8 : 1}
                  type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password} onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3"
                />
                {mode === "register" && <span className="mt-1 block text-xs text-gray-500">Use at least 8 characters.</span>}
              </label>
            </>
          )}

          {step === "verify" && (
            <label className="block text-sm font-medium">
              Verification code
              <input
                required inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={code} onChange={(event) => setCode(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-mono tracking-[0.3em]"
              />
            </label>
          )}

          <button
            disabled={busy}
            className="w-full rounded-lg bg-[#E61E4D] py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Please wait..." : step === "verify" ? "Verify and continue" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {step === "account" ? (
          <p className="mt-5 text-center text-sm text-gray-600">
            {mode === "login" ? "New to Airbnb?" : "Already have an account?"}{" "}
            <button
              onClick={() => chooseMode(mode === "login" ? "register" : "login")}
              className="font-semibold underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        ) : (
          <div className="mt-5 flex justify-center gap-5">
            <button type="button" onClick={() => void resendVerification()} disabled={busy} className="text-sm font-medium underline">
              Resend demo code
            </button>
            <button type="button" onClick={() => { setStep("account"); setError(""); }} className="text-sm font-medium underline">
              Use a different email
            </button>
          </div>
        )}
      </div>
      <Link href="/" className="mt-5 block text-center text-sm text-gray-600 underline">Back to exploring</Link>
    </div>
  );
}
