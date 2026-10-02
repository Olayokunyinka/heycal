"use server";

import { db } from "@/db";
import { eventTypes } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { serializeEventQuestions } from "@/lib/event-questions";

type EventLocationType = "google_meet" | "in_person" | "phone" | "custom" | "none";

const eventLocationTypes: EventLocationType[] = ["google_meet", "in_person", "phone", "custom", "none"];

function validateLocationType(locationType: string): asserts locationType is EventLocationType {
  if (!eventLocationTypes.includes(locationType as EventLocationType)) {
    throw new Error("Choose a valid event location");
  }
}

function normalizeWebsiteReturnUrl(value?: string): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid website return URL");
  }

  const isLocalDevelopmentUrl = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !isLocalDevelopmentUrl) || url.username || url.password) {
    throw new Error("Return URLs must use HTTPS");
  }

  return url.toString();
}

export async function createEventType(values: {
  name: string;
  description?: string;
  duration: number;
  slug: string;
  locationType: EventLocationType;
  locationDetails?: string;
  questions: string[];
  websiteReturnUrl?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  validateLocationType(values.locationType);

  await db.insert(eventTypes).values({
    id: nanoid(),
    userId,
    name: values.name,
    description: values.description,
    duration: values.duration,
    slug: values.slug,
    locationType: values.locationType,
    locationDetails: values.locationDetails?.trim() || null,
    websiteReturnUrl: normalizeWebsiteReturnUrl(values.websiteReturnUrl),
    customQuestions: serializeEventQuestions(values.questions),
  });

  revalidatePath("/dashboard");
}

export async function updateEventType(id: string, values: {
  name: string;
  description?: string;
  duration: number;
  slug: string;
  isActive: boolean;
  locationType: EventLocationType;
  locationDetails?: string;
  questions: string[];
  websiteReturnUrl?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  validateLocationType(values.locationType);

  await db.update(eventTypes)
    .set({
      name: values.name,
      description: values.description,
      duration: values.duration,
      slug: values.slug,
      isActive: values.isActive,
      locationType: values.locationType,
      locationDetails: values.locationDetails?.trim() || null,
      websiteReturnUrl: normalizeWebsiteReturnUrl(values.websiteReturnUrl),
      customQuestions: serializeEventQuestions(values.questions),
    })
    .where(and(eq(eventTypes.id, id), eq(eventTypes.userId, userId)));

  revalidatePath("/dashboard");
}

export async function deleteEventType(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Soft delete
  await db.update(eventTypes)
    .set({ isDeleted: true })
    .where(and(eq(eventTypes.id, id), eq(eventTypes.userId, userId)));

  revalidatePath("/dashboard");
}

export async function toggleStarEventType(id: string, isStarred: boolean) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db.update(eventTypes)
    .set({ isStarred })
    .where(and(eq(eventTypes.id, id), eq(eventTypes.userId, userId)));

  revalidatePath("/dashboard");
}

export async function restoreEventType(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db.update(eventTypes)
    .set({ isDeleted: false })
    .where(and(eq(eventTypes.id, id), eq(eventTypes.userId, userId)));

  revalidatePath("/dashboard");
}

export async function permanentlyDeleteEventType(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db.delete(eventTypes)
    .where(and(eq(eventTypes.id, id), eq(eventTypes.userId, userId)));

  revalidatePath("/dashboard");
}
