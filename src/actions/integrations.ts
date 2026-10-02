"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import {
  generateApiKey,
  getWebhookSigningSecret,
  hashApiKey,
  validateWebhookUrl,
} from "@/lib/integrations";

async function requireIntegrationOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: (record, { eq }) => eq(record.id, userId),
  });
  if (!user) throw new Error("User profile is not ready; reload the dashboard and retry");

  return userId;
}

export async function getIntegrationSettings() {
  const userId = await requireIntegrationOwner();
  const integration = await db.query.integrations.findFirst({
    where: (record, { eq }) => eq(record.userId, userId),
  });

  return {
    apiKeyPrefix: integration?.apiKeyPrefix ?? null,
    apiKeyLastUsedAt: integration?.apiKeyLastUsedAt?.toISOString() ?? null,
    webhookUrl: integration?.webhookUrl ?? "",
    webhookSigningSecret: await getWebhookSigningSecret(userId),
  };
}

export async function rotateIntegrationApiKey() {
  const userId = await requireIntegrationOwner();
  const apiKey = generateApiKey();
  const now = new Date();

  await db.insert(integrations).values({
    userId,
    apiKeyHash: await hashApiKey(apiKey),
    apiKeyPrefix: `${apiKey.slice(0, 18)}...`,
    webhookUrl: null,
    apiKeyLastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: integrations.userId,
    set: {
      apiKeyHash: await hashApiKey(apiKey),
      apiKeyPrefix: `${apiKey.slice(0, 18)}...`,
      apiKeyLastUsedAt: null,
      updatedAt: now,
    },
  });

  return { apiKey };
}

export async function saveIntegrationWebhookUrl(value: string) {
  const userId = await requireIntegrationOwner();
  const webhookUrl = value.trim() ? validateWebhookUrl(value) : null;
  const now = new Date();

  await db.insert(integrations).values({
    userId,
    webhookUrl,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: integrations.userId,
    set: { webhookUrl, updatedAt: now },
  });

  return { success: true };
}