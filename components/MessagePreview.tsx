"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildDeepLink, PLATFORM_LABELS, PLATFORM_OPEN_LABELS } from "@/lib/deep-links";
import type { MessagingPlatform } from "@/lib/deep-links";

interface CheckIn {
  id: string;
  scheduledAt: string;
  status: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    messagingPlatform: string | null;
    notes: string | null;
    schedule: {
      tone: string;
      checkInType: string;
      approveBeforeSend: boolean;
    } | null;
  };
}

interface Props {
  checkIn: CheckIn;
  onClose: () => void;
}

export function MessagePreview({ checkIn, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [logId, setLogId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [marking, setMarking] = useState(false);

  const { contact } = checkIn;
  const platform = contact.messagingPlatform as MessagingPlatform | null;
  const tone = contact.schedule?.tone ?? "casual";
  const checkInType = contact.schedule?.checkInType ?? "generic";

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInId: checkIn.id,
          contactId: contact.id,
          tone,
          checkInType,
          platform: platform ?? "unknown",
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessage(data.message);
      setLogId(data.logId);
    } catch {
      toast.error("Failed to generate message — check your ANTHROPIC_API_KEY");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function markSent() {
    setMarking(true);
    try {
      // Update message log status
      if (logId) {
        await fetch("/api/messages/mark-sent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logId }),
        });
      }
      // Mark check-in as completed
      await fetch(`/api/checkins/${checkIn.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: `Sent via ${platform ? PLATFORM_LABELS[platform] : "unknown"}` }),
      });
      toast.success(`Marked as sent to ${contact.firstName}!`);
      onClose();
    } catch {
      toast.error("Failed to mark as sent");
    } finally {
      setMarking(false);
    }
  }

  function handleSend() {
    if (!platform || !message) return;

    const deepLink = buildDeepLink(platform, contact.phone, null, message);

    if (deepLink.clipboardFallback) {
      navigator.clipboard.writeText(message).then(() => {
        toast.success("Message copied — just paste and send");
      });
    }

    if (deepLink.url) {
      window.location.href = deepLink.url;
    }

    // Optimistically mark as sent after opening the app
    setTimeout(() => markSent(), 1500);
  }

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const deepLink = platform ? buildDeepLink(platform, contact.phone, null, message) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F2024]/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-[#1F2024] rounded-t-[16px]"
        style={{ boxShadow: "0 -4px 0 #1F2024" }}
      >
        <div className="max-w-[480px] mx-auto p-4 pb-8">
          {/* Handle */}
          <div className="w-10 h-1 bg-[#DEDEDE] rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                style={{
                  fontFamily: "var(--font-pixel-display)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                }}
              >
                {platform ? PLATFORM_LABELS[platform] : "message"} · {tone}
              </p>
              <p className="font-bold text-base mt-0.5" style={{ fontFamily: "var(--font-script)" }}>
                {name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground p-1 hover:text-foreground transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message editor */}
          {generating ? (
            <div
              className="w-full min-h-[100px] rounded-[8px] border-2 border-[#1F2024] bg-secondary animate-pulse mb-3"
              style={{ boxShadow: "2px 2px 0 #1F2024" }}
            />
          ) : (
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mb-3 text-base leading-relaxed"
              style={{ borderRadius: "8px", boxShadow: "2px 2px 0 #1F2024" }}
              placeholder="Generating message..."
            />
          )}

          {/* Clipboard fallback notice */}
          {deepLink?.clipboardFallback && platform && (
            <div
              className="mb-3 px-3 py-2 border-2 border-[#1F2024] text-sm font-semibold"
              style={{ borderRadius: "8px", backgroundColor: "var(--splash-yellow)" }}
            >
              {PLATFORM_LABELS[platform]} doesn&apos;t support message pre-fill — your message will be copied to clipboard automatically.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={generating}
              className="text-sm font-bold px-3 py-2 border-2 border-[#1F2024] transition-all"
              style={{
                borderRadius: "8px",
                backgroundColor: "transparent",
                boxShadow: "2px 2px 0 #1F2024",
              }}
            >
              {generating ? "..." : "Regenerate"}
            </button>

            {platform ? (
              <button
                onClick={handleSend}
                disabled={generating || !message}
                className="flex-1 text-sm font-bold px-4 py-2 border-2 border-[#1F2024] bg-[#1F2024] text-white transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px disabled:opacity-50"
                style={{
                  borderRadius: "8px",
                  boxShadow: "2px 2px 0 #1F2024",
                }}
              >
                {deepLink?.clipboardFallback
                  ? `Copy & ${PLATFORM_OPEN_LABELS[platform]}`
                  : PLATFORM_OPEN_LABELS[platform] ?? "Open app"}
              </button>
            ) : (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  toast.success("Message copied to clipboard");
                  setTimeout(() => markSent(), 1000);
                }}
                disabled={generating || !message || marking}
                className="flex-1"
                style={{ borderRadius: "8px" }}
              >
                Copy message
              </Button>
            )}
          </div>

          {/* Manual mark sent */}
          <button
            onClick={markSent}
            disabled={marking}
            className="w-full mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            {marking ? "Marking..." : "Already sent it? Mark as done"}
          </button>
        </div>
      </div>
    </>
  );
}
