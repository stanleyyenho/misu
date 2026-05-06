import webpush from "web-push";
import { prisma } from "./prisma";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Initialize once at module load — calling setVapidDetails on every send is wasteful
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@misu.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendToSubscriptions(
  subscriptions: Array<{ endpoint: string; keys: string }>,
  payload: PushPayload
): Promise<void> {
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const keys = JSON.parse(sub.keys) as { p256dh: string; auth: string };
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys }, JSON.stringify(payload));
      } catch (err: unknown) {
        // 410 Gone = subscription expired, clean it up
        if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 410) {
          await prisma.notificationSubscription.delete({ where: { endpoint: sub.endpoint } });
        }
      }
    })
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const subscriptions = await prisma.notificationSubscription.findMany({ where: { userId } });
  await sendToSubscriptions(subscriptions, payload);
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const subscriptions = await prisma.notificationSubscription.findMany();
  await sendToSubscriptions(subscriptions, payload);
}
