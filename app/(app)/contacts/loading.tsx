export default function ContactsLoading() {
  return (
    <div className="flex flex-col h-full max-w-[480px] mx-auto animate-pulse">
      <div className="px-4 pt-5 pb-3 border-b-2 border-[#1F2024] md:border-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            <div className="h-6 w-32 bg-muted rounded" />
          </div>
          <div className="h-9 w-20 border-2 border-foreground" />
        </div>
        <div className="h-10 w-full bg-card border-2 border-[#1F2024] rounded mb-3" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="h-7 w-16 bg-muted rounded-full shrink-0" />
          <div className="h-7 w-20 bg-muted rounded-full shrink-0" />
          <div className="h-7 w-16 bg-muted rounded-full shrink-0" />
        </div>
      </div>
      <div className="px-4 pt-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border-2 border-[#1F2024] rounded-[10px] bg-card">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
