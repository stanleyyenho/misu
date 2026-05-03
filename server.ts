import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";
import { endOfDay } from "date-fns";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Dynamically import prisma and webpush after Next.js is ready
  const { prisma } = await import("./lib/prisma");
  const { sendPushToAll } = await import("./lib/webpush");

  // Run every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[cron] Checking for due check-ins...");
    try {
      const dueToday = await prisma.checkIn.findMany({
        where: {
          status: "pending",
          scheduledAt: { lte: endOfDay(new Date()) },
        },
        include: { contact: true },
      });

      console.log(`[cron] Found ${dueToday.length} check-in(s) due today`);

      for (const checkIn of dueToday) {
        const name = [checkIn.contact.firstName, checkIn.contact.lastName]
          .filter(Boolean)
          .join(" ");
        await sendPushToAll({
          title: `Time to check in with ${name}`,
          body: "Tap to open Misu and log your catch-up",
          url: `/contacts/${checkIn.contactId}`,
        });
      }
    } catch (err) {
      console.error("[cron] Error sending notifications:", err);
    }
  });

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
