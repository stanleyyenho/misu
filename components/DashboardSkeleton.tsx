// Static shell shown while `loadDashboardData` resolves. Mirrors the real
// dashboard's layout/dimensions so swapping in the loaded UI doesn't shift
// the page (CLS).

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

function CardPlaceholder() {
  return (
    <div
      className="h-[72px] rounded-[10px] border-2 border-[#1F2024] bg-secondary animate-pulse"
      style={{ boxShadow: "4px 4px 0 #1F2024" }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-5 pb-24 md:pb-6">
      <div className="mb-6">
        <p style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          dashboard
        </p>
        <h1 className="text-2xl font-semibold mt-0.5" style={{ fontFamily: "var(--font-script)" }}>
          who are you seeing?
        </h1>
      </div>

      <div
        className="mb-6 h-[44px] rounded-[10px] border-2 border-[#1F2024] bg-card animate-pulse"
        style={{ boxShadow: "3px 3px 0 #1F2024" }}
      />

      <section className="mb-10">
        <div className="mb-4">
          <SectionLabel>hangouts</SectionLabel>
        </div>
        <div className="space-y-3">
          <CardPlaceholder />
          <CardPlaceholder />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4">
          <SectionLabel>check-in messages</SectionLabel>
        </div>
        <div className="space-y-3">
          <CardPlaceholder />
        </div>
      </section>
    </div>
  );
}
