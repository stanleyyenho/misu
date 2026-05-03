import { CalendarView } from "@/components/CalendarView";
import { NotificationBell } from "@/components/NotificationBell";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 md:max-w-5xl md:mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Check-ins</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 hidden md:block">
            Click any event to mark it done, skip, or reschedule
          </p>
        </div>
        <NotificationBell />
      </div>
      <CalendarView />
    </div>
  );
}
