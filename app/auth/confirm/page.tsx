"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "email" | "magiclink" | null;

    if (code) {
      // Came via {{ .ConfirmationURL }} redirect — delegate to server-side handler
      // which properly exchanges the code and sets the auth cookie.
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}`;
      return;
    }

    if (token_hash && type) {
      // Came via direct {{ .TokenHash }} URL — exchange here via browser client.
      // Pre-fetchers won't reach this branch since they don't execute JS.
      const supabase = createClient();
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) setError(error.message);
        else window.location.href = "/";
      });
      return;
    }

    setError("Invalid confirmation link.");
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
