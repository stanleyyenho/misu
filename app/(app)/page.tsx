import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { loadDashboardData } from "@/lib/loaders/dashboard";
import { DashboardClient } from "@/components/DashboardClient";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

// Auth state varies per request; the dashboard data is per-user so this page
// can't be statically rendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData userId={user.id} />
    </Suspense>
  );
}

async function DashboardData({ userId }: { userId: string }) {
  const data = await loadDashboardData(userId);

  // Serialize Date fields to strings so the shape matches `/api/dashboard`'s
  // JSON response — that lets SWR's `fallbackData` slot in seamlessly without
  // a hydration-mismatch on date strings.
  const initialData = JSON.parse(JSON.stringify(data));

  return <DashboardClient initialData={initialData} />;
}
