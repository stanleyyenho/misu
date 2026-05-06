-- Add indexes for frequently filtered columns to prevent full table scans at scale

CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "ContactGroup_userId_idx" ON "ContactGroup"("userId");
CREATE INDEX "CheckIn_contactId_status_idx" ON "CheckIn"("contactId", "status");
CREATE INDEX "CheckIn_status_scheduledAt_idx" ON "CheckIn"("status", "scheduledAt");
CREATE INDEX "Hangout_userId_idx" ON "Hangout"("userId");
CREATE INDEX "Hangout_userId_status_date_idx" ON "Hangout"("userId", "status", "date");
CREATE INDEX "HangoutReminder_status_sendAt_idx" ON "HangoutReminder"("status", "sendAt");
CREATE INDEX "HangoutInstance_scheduleId_hangoutId_idx" ON "HangoutInstance"("scheduleId", "hangoutId");
CREATE INDEX "NotificationSubscription_userId_idx" ON "NotificationSubscription"("userId");
