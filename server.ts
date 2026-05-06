import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  cron.schedule("0 8 * * *", async () => {
    console.log("[cron] Triggering daily notifications...");
    try {
      const secret = process.env.CRON_SECRET;
      if (!secret) {
        console.warn("[cron] CRON_SECRET not set, skipping");
        return;
      }
      const res = await fetch(`http://localhost:${port}/api/cron/notify?secret=${secret}`);
      const data = await res.json();
      console.log("[cron] Done:", data);
    } catch (err) {
      console.error("[cron] Error:", err);
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
