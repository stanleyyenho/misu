import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { getUser } from "@/lib/supabase/server";

// MapKit JS tokens are valid for 30 minutes; we cache per process
let cached: { token: string; expiresAt: number } | null = null;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Math.floor(Date.now() / 1000);

  if (cached && cached.expiresAt - now > 60) {
    return NextResponse.json({ token: cached.token });
  }

  const teamId = process.env.APPLE_MAPS_TEAM_ID;
  const keyId = process.env.APPLE_MAPS_KEY_ID;
  const privateKeyPem = process.env.APPLE_MAPS_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKeyPem) {
    return NextResponse.json({ error: "Apple Maps credentials not configured" }, { status: 500 });
  }

  const privateKey = await importPKCS8(privateKeyPem, "ES256");
  const exp = now + 30 * 60; // 30 minutes

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);

  cached = { token, expiresAt: exp };
  return NextResponse.json({ token });
}
