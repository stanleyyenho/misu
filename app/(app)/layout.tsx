"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { OnboardingModal } from "@/components/OnboardingModal";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  onboardingComplete: boolean;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [onboarding, setOnboarding] = useState<"loading" | "needed" | "done">("loading");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setAuthEmail(user?.email ?? "");
      setAuthPhone(user?.phone ?? "");

      const res = await fetch("/api/profile");
      if (!res.ok) {
        // If 401, middleware will redirect to login. Any other error (e.g. DB down)
        // — show onboarding so the user isn't stuck on a blank screen.
        setOnboarding(res.status === 401 ? "done" : "needed");
        return;
      }
      const profile: UserProfile | null = await res.json();
      setOnboarding(!profile || !profile.onboardingComplete ? "needed" : "done");
    }
    check();
  }, []);

  function handleOnboardingComplete() {
    setOnboarding("done");
  }

  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <BottomNav />
      {onboarding === "needed" && (
        <OnboardingModal
          initialEmail={authEmail}
          initialPhone={authPhone}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}
