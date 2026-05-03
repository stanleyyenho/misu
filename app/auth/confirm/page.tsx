"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "email" | "magiclink" | null;

    if (!token_hash || !type) {
      setError("Invalid confirmation link.");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .verifyOtp({ token_hash, type })
      .then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          window.location.href = "/";
        }
      });
  }, [searchParams]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-[360px] text-center space-y-4">
        <h1 className="text-4xl font-bold" style={{ fontFamily: "var(--font-script)" }}>
          misu
        </h1>
        {error ? (
          <>
            <p className="font-bold text-destructive">Link expired or already used</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <a href="/login" className="text-sm underline">
              Back to sign in
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
