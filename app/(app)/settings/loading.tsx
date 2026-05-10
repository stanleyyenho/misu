export default function SettingsLoading() {
  return (
    <div className="w-full max-w-[480px] mx-auto px-4 pt-5 animate-pulse">
      <div className="h-3 w-16 bg-muted rounded mb-2" />
      <div className="h-7 w-32 bg-muted rounded mb-5" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-2 border-[#1F2024] rounded-[10px] bg-card" />
        ))}
      </div>
    </div>
  );
}
