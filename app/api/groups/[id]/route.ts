import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contactGroup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// Add / remove a contact from the group
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const { contactId, action } = await request.json();

  if (!contactId || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "contactId and action (add|remove) required" }, { status: 400 });
  }

  if (action === "add") {
    await prisma.contactGroupMember.upsert({
      where: { contactId_groupId: { contactId, groupId } },
      create: { contactId, groupId },
      update: {},
    });
  } else {
    await prisma.contactGroupMember.deleteMany({ where: { contactId, groupId } });
  }

  return NextResponse.json({ success: true });
}
