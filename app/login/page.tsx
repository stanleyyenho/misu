"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Method = "email" | "phone";
type Phase = "input" | "verify" | "sent";

export default function LoginPage() {
  const [method, setMethod] = useState<Method>("email");
  const [phase, setPhase] = useState<Phase>("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneTipVisible, setPhoneTipVisible] = useState(false);
  const [phoneHovered, setPhoneHovered] = useState(false);

  const supabase = createClient();

  async function sendEmail() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setPhase("sent");
  }

  async function sendPhone() {
    setLoading(true);
    setError("");
    // Normalize: if no + prefix, assume US
    const normalized = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setPhase("verify");
  }

  async function verifyEmailOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: "email",
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    window.location.href = "/";
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const normalized = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    window.location.href = "/";
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: "var(--font-script)" }}
          >
            misu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">stay in touch</p>
        </div>

        <div
          className="border-2 border-[#1F2024] rounded-[12px] p-6"
          style={{ boxShadow: "4px 4px 0 #1F2024" }}
        >
          {/* Method tabs */}
          <div className="relative mb-6 group">
            <div className="flex rounded-[8px] border-2 border-[#1F2024] overflow-hidden">
              <button
                onClick={() => { setMethod("email"); setPhase("input"); setError(""); }}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${
                  method === "email"
                    ? "bg-[var(--button-fill)] text-white"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Email
              </button>
              <button
                aria-disabled="true"
                onClick={() => {
                  setPhoneTipVisible(true);
                  setTimeout(() => setPhoneTipVisible(false), 2000);
                }}
                onMouseEnter={() => setPhoneHovered(true)}
                onMouseLeave={() => setPhoneHovered(false)}
                className="flex-1 py-2 text-sm font-bold text-muted-foreground/50 bg-muted/40 cursor-not-allowed"
              >
                Phone
              </button>
            </div>
            {/* Tooltip — outside overflow-hidden so it isn't clipped */}
            <div
              className={`pointer-events-none absolute bottom-[calc(100%+8px)] right-0 w-1/2 flex justify-center transition-opacity duration-150 z-10 ${
                phoneTipVisible || phoneHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <div>
                <div
                  className="bg-[var(--button-fill)] text-white text-xs font-bold px-3 py-1.5 rounded-[6px] whitespace-nowrap"
                  style={{ boxShadow: "2px 2px 0 #555" }}
                >
                  Coming Soon!
                </div>
                <div className="w-2 h-2 bg-[var(--button-fill)] rotate-45 mx-auto -mt-1" />
              </div>
            </div>
          </div>

          {method === "email" && phase === "input" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendEmail()}
                  placeholder="you@example.com"
                  className="mt-1.5"
                  style={{ borderRadius: "8px" }}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <ActionButton
                onClick={sendEmail}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? "Sending..." : "Send magic link"}
              </ActionButton>
            </div>
          )}

          {method === "email" && phase === "sent" && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="text-3xl">📬</div>
                <p className="font-bold">Check your inbox</p>
                <p className="text-sm text-muted-foreground">
                  We sent an email to <strong>{email}</strong>. Click the link to sign in, or enter the 6-digit code below.
                </p>
              </div>

              <div className="relative flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">or enter code</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={emailOtp}
                  onChange={(e) => { setEmailOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && verifyEmailOtp()}
                  placeholder="00000000"
                  className="text-center text-xl tracking-[0.4em] font-mono"
                  style={{ borderRadius: "8px" }}
                  autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <ActionButton
                  onClick={verifyEmailOtp}
                  disabled={loading || emailOtp.length < 8}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Sign in"}
                </ActionButton>
              </div>

              <button
                className="w-full text-xs text-muted-foreground underline"
                onClick={() => { setPhase("input"); setEmailOtp(""); setError(""); }}
              >
                Use a different email
              </button>
            </div>
          )}

          {method === "phone" && phase === "input" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendPhone()}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1.5"
                  style={{ borderRadius: "8px" }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +1 for US/Canada</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <ActionButton
                onClick={sendPhone}
                disabled={loading || !phone}
                className="w-full"
              >
                {loading ? "Sending..." : "Send code"}
              </ActionButton>
            </div>
          )}

          {method === "phone" && phase === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to <strong>{phone}</strong>.
              </p>
              <div>
                <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Verification code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                  placeholder="000000"
                  className="mt-1.5 text-center text-xl tracking-[0.4em] font-mono"
                  style={{ borderRadius: "8px" }}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <ActionButton
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full"
              >
                {loading ? "Verifying..." : "Sign in"}
              </ActionButton>
              <button
                className="w-full text-xs text-muted-foreground underline"
                onClick={() => { setPhase("input"); setOtp(""); setError(""); }}
              >
                Use a different number
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          New to misu? Enter your email above to create an account.
        </p>
      </div>
    </div>
  );
}
