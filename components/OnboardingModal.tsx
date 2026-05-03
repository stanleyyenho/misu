"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  initialEmail?: string;
  initialPhone?: string;
  onComplete: (profile: { firstName: string; lastName: string; email: string; phone: string }) => void;
}

export function OnboardingModal({ initialEmail = "", initialPhone = "", onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), onboardingComplete: true }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() });
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-[400px] rounded-[16px] border-2 border-[#1F2024] bg-card p-6"
        style={{ boxShadow: "6px 6px 0 #1F2024" }}
      >
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor: step >= s ? "#1F2024" : "var(--secondary)",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <p
              style={{
                fontFamily: "var(--font-pixel-display)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              welcome to misu
            </p>
            <h2
              className="text-2xl font-semibold mt-0.5 mb-5"
              style={{ fontFamily: "var(--font-script)" }}
            >
              let&apos;s get you set up
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-semibold">First name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && firstName.trim() && setStep(2)}
                  className="mt-1.5"
                  style={{ borderRadius: "8px" }}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-semibold">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Johnson"
                  onKeyDown={(e) => e.key === "Enter" && firstName.trim() && setStep(2)}
                  className="mt-1.5"
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </div>

            <Button
              className="w-full mt-5"
              disabled={!firstName.trim()}
              onClick={() => setStep(2)}
              style={{ borderRadius: "8px" }}
            >
              Next →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <p
              style={{
                fontFamily: "var(--font-pixel-display)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              step 2 of 2
            </p>
            <h2
              className="text-2xl font-semibold mt-0.5 mb-1"
              style={{ fontFamily: "var(--font-script)" }}
            >
              confirm your contact info
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              This is how misu identifies your account. You can update these any time in Settings.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                  style={{ borderRadius: "8px" }}
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-semibold">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1.5"
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                style={{ borderRadius: "8px" }}
              >
                ← Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1"
                style={{ borderRadius: "8px" }}
              >
                {saving ? "Saving..." : "Get started →"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
