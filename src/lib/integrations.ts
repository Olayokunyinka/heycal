import { eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations } from "@/db/schema";

const encoder = new TextEncoder();

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function hashApiKey(apiKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateApiKey(): string {
  return `heycal_live_${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`;
}

export function generateBookingHandoffToken(): string {
  return `heycal_link_${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`;
}

export function validateWebhookUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid webhook URL");
  }

  const hostname = url.hostname.toLowerCase();
  const isPrivateHostname = hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    || hostname.startsWith("[");

  if (url.protocol !== "https:" || url.username || url.password || isPrivateHostname) {
    throw new Error("Webhook URLs must be public HTTPS URLs without embedded credentials");
  }

  return url.toString();
}

export async function getWebhookSigningSecret(userId: string): Promise<string | null> {
  const masterSecret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!masterSecret || masterSecret.length < 32) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`heycal-webhook-v1:${userId}`));
  return `whsec_${toBase64Url(new Uint8Array(signature))}`;
}

export async function sendBookingCreatedWebhook({
  userId,
  booking,
  event,
}: {
  userId: string;
  booking: {
    id: string;
    guestName: string;
    guestEmail: string;
    guestNotes?: string;
    guestAnswers: { question: string; answer: string }[];
    startTime: Date;
    endTime: Date;
    meetingUrl: string | null;
  };
  event: {
    id: string;
    name: string;
    slug: string;
    duration: number;
  };
}): Promise<void> {
  const integration = await db.query.integrations.findFirst({
    where: (record, { eq }) => eq(record.userId, userId),
  });
  if (!integration?.webhookUrl) return;

  const signingSecret = await getWebhookSigningSecret(userId);
  if (!signingSecret) {
    console.error("Booking webhook is configured but WEBHOOK_SIGNING_SECRET is missing or too short");
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({
    id: `evt_${booking.id}`,
    type: "booking.created",
    createdAt: new Date().toISOString(),
    data: {
      bookingId: booking.id,
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        duration: event.duration,
      },
      guest: {
        name: booking.guestName,
        email: booking.guestEmail,
        notes: booking.guestNotes || null,
        answers: booking.guestAnswers,
      },
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      meetingUrl: booking.meetingUrl,
    },
  });
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(`${timestamp}.${body}`));
  const signatureHex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");

  try {
    const response = await fetch(integration.webhookUrl, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      headers: {
        "content-type": "application/json",
        "x-heycal-event": "booking.created",
        "x-heycal-timestamp": timestamp,
        "x-heycal-signature": `v1=${signatureHex}`,
      },
      body,
    });

    if (!response.ok) {
      console.error("Booking webhook returned a non-success status", response.status);
    }
  } catch (error) {
    console.error("Booking webhook delivery failed", error);
  }
}

export async function updateIntegrationLastUsed(userId: string, lastUsedAt: Date): Promise<void> {
  await db.update(integrations).set({ apiKeyLastUsedAt: lastUsedAt }).where(eq(integrations.userId, userId));
}