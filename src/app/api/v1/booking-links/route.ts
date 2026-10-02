import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookingIntents, eventTypes, integrations, users } from "@/db/schema";
import { generateBookingHandoffToken, hashApiKey, updateIntegrationLastUsed } from "@/lib/integrations";

function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return json({ error: "Request body is too large" }, 413);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match || match[1].length > 256) {
    return json({ error: "Provide a valid Heycal API key in the Authorization header" }, 401);
  }

  const apiKeyHash = await hashApiKey(match[1]);
  const integration = await db.query.integrations.findFirst({
    where: and(eq(integrations.apiKeyHash, apiKeyHash)),
  });
  if (!integration?.apiKeyHash) return json({ error: "Invalid API key" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  if (!body || typeof body !== "object") return json({ error: "Request body must be an object" }, 400);
  const fields = body as Record<string, unknown>;
  const eventSlug = typeof fields.eventSlug === "string" ? fields.eventSlug.trim() : "";
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const email = typeof fields.email === "string" ? fields.email.trim() : "";

  if (!eventSlug || eventSlug.length > 120) return json({ error: "eventSlug is required" }, 400);
  if (!name || name.length > 120) return json({ error: "name is required and must be 120 characters or fewer" }, 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Provide a valid email address" }, 400);
  }

  const [eventType, owner] = await Promise.all([
    db.query.eventTypes.findFirst({
      where: and(
        eq(eventTypes.userId, integration.userId),
        eq(eventTypes.slug, eventSlug),
        eq(eventTypes.isActive, true),
        eq(eventTypes.isDeleted, false),
      ),
    }),
    db.query.users.findFirst({
      where: eq(users.id, integration.userId),
    }),
  ]);

  if (!eventType) return json({ error: "Active event not found for this API key owner" }, 404);
  if (!owner?.username) return json({ error: "Event owner profile is missing a public username" }, 409);

  const handoffToken = generateBookingHandoffToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db.insert(bookingIntents).values({
    tokenHash: await hashApiKey(handoffToken),
    userId: integration.userId,
    eventTypeId: eventType.id,
    guestName: name,
    guestEmail: email,
    expiresAt,
  });
  await updateIntegrationLastUsed(integration.userId, new Date());

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const origin = configuredOrigin?.startsWith("https://") && !configuredOrigin.includes("localhost")
    ? configuredOrigin
    : "https://cal.heyclift.xyz";
  const bookingUrl = new URL(
    `/${encodeURIComponent(owner.username)}/${encodeURIComponent(eventType.slug)}`,
    origin,
  );
  bookingUrl.searchParams.set("handoff", handoffToken);

  return json({ url: bookingUrl.toString(), eventSlug: eventType.slug, expiresAt: expiresAt.toISOString() });
}