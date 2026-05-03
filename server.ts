import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Dynamically import after Next.js is ready
  const { sendDueCheckInNotifications } = await import("./lib/notify");

  // Run every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[cron] Checking for due check-ins...");
    try {
      const sent = await sendDueCheckInNotifications();
      console.log(`[cron] Sent ${sent} notification(s)`);
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
