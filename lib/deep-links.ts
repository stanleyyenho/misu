export type MessagingPlatform = "sms" | "imessage" | "whatsapp" | "instagram" | "messenger";

interface DeepLinkResult {
  url: string;
  prefillSupported: boolean;
  clipboardFallback: boolean;
}

export function buildDeepLink(
  platform: MessagingPlatform,
  phone: string | null,
  instagramHandle: string | null,
  message: string
): DeepLinkResult {
  const encoded = encodeURIComponent(message);

  switch (platform) {
    case "sms":
    case "imessage": {
      if (!phone) return { url: "", prefillSupported: false, clipboardFallback: true };
      // sms: URI with body pre-fill works on both iOS and Android
      return {
        url: `sms:${phone}&body=${encoded}`,
        prefillSupported: true,
        clipboardFallback: false,
      };
    }

    case "whatsapp": {
      if (!phone) return { url: "", prefillSupported: false, clipboardFallback: true };
      // Remove non-digit chars from phone for wa.me
      const digits = phone.replace(/\D/g, "");
      return {
        url: `https://wa.me/${digits}?text=${encoded}`,
        prefillSupported: true,
        clipboardFallback: false,
      };
    }

    case "instagram": {
      // Deep link opens the DM thread only — no pre-fill support
      const handle = instagramHandle?.replace(/^@/, "");
      return {
        url: handle ? `instagram://user?username=${handle}` : "instagram://",
        prefillSupported: false,
        clipboardFallback: true,
      };
    }

    case "messenger": {
      // Messenger deep link opens the app — no pre-fill support
      return {
        url: "fb-messenger://",
        prefillSupported: false,
        clipboardFallback: true,
      };
    }

    default:
      return { url: "", prefillSupported: false, clipboardFallback: true };
  }
}

export const PLATFORM_LABELS: Record<string, string> = {
  sms: "SMS",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

export const PLATFORM_OPEN_LABELS: Record<string, string> = {
  sms: "Open Messages",
  imessage: "Open iMessage",
  whatsapp: "Open WhatsApp",
  instagram: "Open Instagram",
  messenger: "Open Messenger",
};
