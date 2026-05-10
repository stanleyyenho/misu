-- AlterTable
ALTER TABLE "Hangout"
  ADD COLUMN "locationPromptSentAt" TIMESTAMP(3),
  ADD COLUMN "locationTbdAt" TIMESTAMP(3),
  ADD COLUMN "lastTbdReminderAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Hangout_locationTbdAt_locationName_idx" ON "Hangout"("locationTbdAt", "locationName");
