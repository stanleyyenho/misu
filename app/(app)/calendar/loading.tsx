export default function CalendarLoading() {
  return (
    <div className="p-4 md:p-6 md:max-w-5xl md:mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <div className="h-3 w-16 bg-muted rounded mb-2" />
          <div className="h-7 w-48 bg-muted rounded" />
        </div>
        <div className="h-9 w-9 bg-muted rounded-full" />
      </div>
      <div className="border-2 border-[#1F2024] rounded-[10px] bg-card p-3">
        <div className="h-6 w-40 bg-muted rounded mb-3" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square border border-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
