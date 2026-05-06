-- Add scheduleType discriminator so a contact can have both a check-in schedule
-- and a hangout schedule simultaneously.

-- Step 1: add the column with a safe default
ALTER TABLE "CheckInSchedule" ADD COLUMN "scheduleType" TEXT NOT NULL DEFAULT 'check-in';

-- Step 2: back-fill existing hangout schedules (cadenceMode != 'prompt')
UPDATE "CheckInSchedule" SET "scheduleType" = 'hangout' WHERE "cadenceMode" != 'prompt';

-- Step 3: drop the old single-contact unique constraint
ALTER TABLE "CheckInSchedule" DROP CONSTRAINT "CheckInSchedule_contactId_key";

-- Step 4: add compound unique — one check-in schedule + one hangout schedule per contact
CREATE UNIQUE INDEX "CheckInSchedule_contactId_scheduleType_key"
  ON "CheckInSchedule"("contactId", "scheduleType");
