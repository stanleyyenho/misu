"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { toast } from "sonner";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function NotificationBell() {
  const [status, setStatus] = useState<NotificationPermission | "unsupported" | "loading">(
    "loading"
  );

  useEffect(() => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
    } else {
      setStatus(Notification.permission);
    }
  }, []);

  async function subscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // iOS not in standalone mode
      if (isIos() && !isInStandaloneMode()) {
        toast.info("Add Misu to your home screen first, then enable notifications from there.");
        return;
      }
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    const permission = await Notification.requestPermission();
    setStatus(permission);

    if (permission !== "granted") {
      if (permission === "denied") {
        toast.error("Notifications blocked. Enable them in iOS Settings → Safari.");
      }
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidRes = await fetch("/api/notifications/vapid-public-key");
      const { publicKey } = await vapidRes.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
            auth: arrayBufferToBase64(sub.getKey("auth")!),
          },
        }),
      });

      toast.success("Notifications enabled!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to enable notifications");
    }
  }

  if (status === "loading" || status === "granted") return null;
  if (status === "unsupported") return null;

  return (
    <ActionButton
      variant={status === "denied" ? "ghost" : "outline"}
      size="sm"
      onClick={subscribe}
    >
      {status === "denied" ? "Notifications blocked" : "Enable notifications"}
    </ActionButton>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
