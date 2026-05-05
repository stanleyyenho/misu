-- AlterTable: add v2 hangout coordination fields to CheckInSchedule
ALTER TABLE "CheckInSchedule" ADD COLUMN "hangoutType" TEXT NOT NULL DEFAULT 'in-person';
ALTER TABLE "CheckInSchedule" ADD COLUMN "cadenceMode" TEXT NOT NULL DEFAULT 'prompt';
ALTER TABLE "CheckInSchedule" ADD COLUMN "leadTimeDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "CheckInSchedule" ADD COLUMN "defaultHangout" TEXT;

-- CreateTable
CREATE TABLE "Hangout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "checkInId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "date" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT,
    "locationAddr" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "platform" TEXT,
    "meetingLink" TEXT,
    "noteToFriend" TEXT,
    "calInviteSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hangout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangoutReminder" (
    "id" TEXT NOT NULL,
    "hangoutId" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangoutReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangoutInstance" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "instanceNum" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT,
    "locationAddr" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "platform" TEXT,
    "meetingLink" TEXT,
    "hangoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangoutInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hangout_checkInId_key" ON "Hangout"("checkInId");

-- CreateIndex
CREATE UNIQUE INDEX "HangoutInstance_hangoutId_key" ON "HangoutInstance"("hangoutId");

-- CreateIndex
CREATE UNIQUE INDEX "HangoutInstance_scheduleId_instanceNum_key" ON "HangoutInstance"("scheduleId", "instanceNum");

-- AddForeignKey
ALTER TABLE "Hangout" ADD CONSTRAINT "Hangout_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hangout" ADD CONSTRAINT "Hangout_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutReminder" ADD CONSTRAINT "HangoutReminder_hangoutId_fkey" FOREIGN KEY ("hangoutId") REFERENCES "Hangout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutInstance" ADD CONSTRAINT "HangoutInstance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CheckInSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutInstance" ADD CONSTRAINT "HangoutInstance_hangoutId_fkey" FOREIGN KEY ("hangoutId") REFERENCES "Hangout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
