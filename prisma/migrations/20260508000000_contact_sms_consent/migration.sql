-- AlterTable: add SMS consent timestamp to Contact
ALTER TABLE "Contact" ADD COLUMN "smsConsentAt" TIMESTAMP(3);
