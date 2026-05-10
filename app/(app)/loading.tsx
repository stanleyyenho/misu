export default function AppLoading() {
  return (
    <div className="w-full max-w-[480px] mx-auto px-4 pt-5 animate-pulse">
      <div className="h-5 w-24 bg-muted rounded mb-2" />
      <div className="h-7 w-48 bg-muted rounded mb-5" />
      <div className="space-y-3">
        <div className="h-20 border-2 border-[#1F2024] rounded-[10px] bg-card" />
        <div className="h-20 border-2 border-[#1F2024] rounded-[10px] bg-card" />
        <div className="h-20 border-2 border-[#1F2024] rounded-[10px] bg-card" />
        <div className="h-20 border-2 border-[#1F2024] rounded-[10px] bg-card" />
      </div>
    </div>
  );
}
