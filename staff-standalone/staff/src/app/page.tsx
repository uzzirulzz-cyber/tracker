"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole, MapPinned, RadioTower, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [pin, setPin] = useState("24562456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!pin) {
      setError("Access code is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin", pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied");
      } else {
        window.location.href = "/admin";
      }
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_32%),linear-gradient(135deg,_#030712_0%,_#0f172a_45%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 shadow-[0_0_100px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_35%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/10 text-sky-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Geo Command</p>
                  <h1 className="text-xl font-semibold text-white">Staff Portal</h1>
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-slate-300">
                  <RadioTower className="h-3.5 w-3.5 text-sky-400" />
                  Live Operations Network
                </div>
                <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Secure access to the admin command center.
                </h2>
                <p className="max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                  Use the dedicated access code to enter the geo intelligence dashboard and review live incidents.
                </p>
              </div>
            </div>

            <div className="relative mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPinned className="h-4 w-4 text-sky-400" />
                <span>Geo-map monitoring ready</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Regions</p>
                  <p className="mt-1 text-lg font-semibold text-white">12</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Devices</p>
                  <p className="mt-1 text-lg font-semibold text-white">184</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Status</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">Nominal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-slate-950/70 p-6 sm:p-8">
            <div className="w-full max-w-md rounded-[24px] border border-slate-800/80 bg-slate-900/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Administrator</p>
                  <h3 className="text-lg font-semibold text-white">Secure entry</h3>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Access code</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none transition focus:border-sky-400"
                    placeholder="Enter 8-digit access code"
                  />
                </div>
              </div>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Authenticating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Access command center
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
