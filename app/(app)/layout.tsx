"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error("fetch error"), { status: res.status });
  return res.json();
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");

  const { data: profile, error } = useSWR<UserProfile>("/api/profile", fetcher);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthEmail(user?.email ?? "");
      setAuthPhone(user?.phone ?? "");
    });
  }, []);

  // Only show onboarding when we have a confirmed profile with onboardingComplete === false.
  // Errors (transient 500s, network blips) must not trigger the modal — middleware handles 401s.
  const onboarding =
    !profile && !error
      ? "loading"
      : profile && !profile.onboardingComplete
        ? "needed"
        : "done";

  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <BottomNav />
      {onboarding === "needed" && (
        <OnboardingModal
          initialEmail={authEmail}
          initialPhone={authPhone}
          onComplete={() => mutate("/api/profile")}
        />
      )}
    </div>
  );
}
