-- Add scheduleType discriminator so a contact can have both a check-in schedule
-- and a hangout schedule simultaneously. Idempotent so a partial run can be re-applied.

-- Step 1: add the column with a safe default
ALTER TABLE "CheckInSchedule" ADD COLUMN IF NOT EXISTS "scheduleType" TEXT NOT NULL DEFAULT 'check-in';

-- Step 2: back-fill existing hangout schedules (cadenceMode != 'prompt')
UPDATE "CheckInSchedule" SET "scheduleType" = 'hangout' WHERE "cadenceMode" != 'prompt' AND "scheduleType" = 'check-in';

-- Step 3: drop the old single-contact unique index
DROP INDEX IF EXISTS "CheckInSchedule_contactId_key";

-- Step 4: add compound unique — one check-in schedule + one hangout schedule per contact
CREATE UNIQUE INDEX IF NOT EXISTS "CheckInSchedule_contactId_scheduleType_key"
  ON "CheckInSchedule"("contactId", "scheduleType");
