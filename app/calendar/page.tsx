import { CalendarView } from "@/components/CalendarView";
import { NotificationBell } from "@/components/NotificationBell";

export default function CalendarPage() {
  return (
    <div className="p-4 md:p-6 md:max-w-5xl md:mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <p className="misu-eyebrow mb-1" style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            schedule
          </p>
          <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-script)" }}>
            check-in calendar
          </h1>
        </div>
        <NotificationBell />
      </div>
      <CalendarView />
    </div>
  );
}
