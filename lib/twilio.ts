import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
  return twilio(sid, token);
}

export async function sendSms(to: string, body: string) {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (messagingServiceSid) {
    // A2P 10DLC compliant: send via Messaging Service
    return getClient().messages.create({ to, messagingServiceSid, body });
  }
  // Fallback for local dev without a Messaging Service
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID is required");
  return getClient().messages.create({ to, from, body });
}
