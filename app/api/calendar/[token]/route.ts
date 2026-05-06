import { prisma } from "@/lib/prisma";
import { generateIcal } from "@/lib/ical";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const share = await prisma.calendarShare.findUnique({ where: { token } });
  if (!share) {
    return new Response("Not found", { status: 404 });
  }

  const checkIns = await prisma.checkIn.findMany({
    where: { status: "pending", contact: { userId: share.userId } },
    include: { contact: true },
    orderBy: { scheduledAt: "asc" },
  });

  const icsContent = generateIcal(checkIns, "Misu Check-ins");

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="misu.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
