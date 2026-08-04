"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, User, Mail, Phone, KeyRound, Loader2 } from "lucide-react";

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/activate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInviteData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to validate invitation link");
        setLoading(false);
      });
  }, [token]);

  const handleActivate = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setValidating(true);
    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Activation failed");
      } else {
        toast.success("Account activated successfully!");
        window.location.href = "/admin";
      }
    } catch {
      toast.error("Network error");
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0f1729, #1a2744)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(180deg, #0f1729, #1a2744)" }}>
        <Card className="w-full max-w-md border-[#1e3a5f]/50" style={{ background: "linear-gradient(180deg, #111827, #0f1729)" }}>
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2 text-white">Invalid Link</h2>
            <p className="text-sm text-[#64748b]">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(180deg, #0f1729, #1a2744)" }}>
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <path d="M150,80 Q250,60 320,90 Q350,120 340,180 Q300,220 250,210 Q180,200 140,160 Q120,120 150,80Z" fill="none" stroke="#2d4a6f" strokeWidth="1" />
          <path d="M520,90 Q580,80 600,100 Q610,130 580,150 Q540,160 520,140 Q510,110 520,90Z" fill="none" stroke="#2d4a6f" strokeWidth="1" />
          <path d="M620,80 Q780,60 850,90 Q900,120 880,180 Q820,220 720,210 Q640,190 620,140Q620,80Z" fill="none" stroke="#2d4a6f" strokeWidth="1" />
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.2), rgba(6,182,212,0.1))", border: "1px solid rgba(20,184,166,0.3)" }}>
            <ShieldCheck className="h-7 w-7 text-[#14b8a6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Activate Your Account</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Join {inviteData?.organization?.name || "your organization"}
          </p>
        </div>

        <Card className="border-[#1e3a5f]/50" style={{ background: "linear-gradient(180deg, #111827, #0f1729)" }}>
          <CardHeader>
            <CardTitle className="text-base text-white">Invitation Details</CardTitle>
            <CardDescription className="text-[#64748b]">Review your information and set a password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(30,58,95,0.2)" }}>
                <User className="h-4 w-4 text-[#64748b]" />
                <div>
                  <div className="text-xs text-[#64748b]">Name</div>
                  <div className="text-sm font-medium text-white">{inviteData?.invitee?.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(30,58,95,0.2)" }}>
                <Mail className="h-4 w-4 text-[#64748b]" />
                <div>
                  <div className="text-xs text-[#64748b]">Email</div>
                  <div className="text-sm font-medium text-white">{inviteData?.invitee?.email}</div>
                </div>
              </div>
              {inviteData?.invitee?.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(30,58,95,0.2)" }}>
                  <Phone className="h-4 w-4 text-[#64748b]" />
                  <div>
                    <div className="text-xs text-[#64748b]">Phone</div>
                    <div className="text-sm font-medium text-white">{inviteData?.invitee?.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(30,58,95,0.2)" }}>
                <KeyRound className="h-4 w-4 text-[#64748b]" />
                <div>
                  <div className="text-xs text-[#64748b]">Role</div>
                  <div className="text-sm font-medium text-white capitalize">{inviteData?.invitee?.role}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1e3a5f]/30">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94a3b8]">Set Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-10 bg-[#0f1729] border-[#334155] text-white placeholder:text-[#475569] focus:border-[#14b8a6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94a3b8]">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="h-10 bg-[#0f1729] border-[#334155] text-white placeholder:text-[#475569] focus:border-[#14b8a6]"
                />
              </div>
            </div>

            <Button
              className="w-full h-10 font-semibold"
              style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", boxShadow: "0 4px 14px rgba(20,184,166,0.3)" }}
              onClick={handleActivate}
              disabled={validating}
            >
              {validating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Activate Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0f1729, #1a2744)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}
