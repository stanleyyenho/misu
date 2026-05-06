import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: contactId } = await params;
  const owned = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = await prisma.checkInSchedule.findFirst({ where: { contactId, scheduleType: "hangout" } });
  if (!schedule) return NextResponse.json([], { status: 200 });

  const instances = await prisma.hangoutInstance.findMany({
    where: { scheduleId: schedule.id },
    orderBy: { instanceNum: "asc" },
  });

  return NextResponse.json(instances);
}

// Replaces all instances for a schedule with the provided list (up to 10)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: contactId } = await params;
  const owned = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = await prisma.checkInSchedule.findFirst({ where: { contactId, scheduleType: "hangout" } });
  if (!schedule) return NextResponse.json({ error: "No schedule set" }, { status: 422 });

  const body = await request.json();
  const instances: Array<{
    instanceNum: number;
    date: string;
    locationName?: string;
    locationAddr?: string;
    locationLat?: number;
    locationLng?: number;
    platform?: string;
    meetingLink?: string;
  }> = body.instances ?? [];

  if (instances.length > 5) {
    return NextResponse.json({ error: "Maximum 5 instances allowed" }, { status: 400 });
  }

  // Delete only unactivated instances (keep ones already linked to a real Hangout)
  await prisma.hangoutInstance.deleteMany({
    where: { scheduleId: schedule.id, hangoutId: null },
  });

  const created = await Promise.all(
    instances.map((inst) =>
      prisma.hangoutInstance.upsert({
        where: { scheduleId_instanceNum: { scheduleId: schedule.id, instanceNum: inst.instanceNum } },
        create: {
          scheduleId: schedule.id,
          instanceNum: inst.instanceNum,
          date: new Date(inst.date),
          locationName: inst.locationName ?? null,
          locationAddr: inst.locationAddr ?? null,
          locationLat: inst.locationLat ?? null,
          locationLng: inst.locationLng ?? null,
          platform: inst.platform ?? null,
          meetingLink: inst.meetingLink ?? null,
        },
        update: {
          date: new Date(inst.date),
          locationName: inst.locationName ?? null,
          locationAddr: inst.locationAddr ?? null,
          locationLat: inst.locationLat ?? null,
          locationLng: inst.locationLng ?? null,
          platform: inst.platform ?? null,
          meetingLink: inst.meetingLink ?? null,
        },
      })
    )
  );

  return NextResponse.json(created);
}
