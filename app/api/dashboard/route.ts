import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { loadDashboardData } from "@/lib/loaders/dashboard";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await loadDashboardData(user.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
