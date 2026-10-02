import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Clerk ID
  username: text("username").unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const integrations = sqliteTable("integrations", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  apiKeyHash: text("api_key_hash").unique(),
  apiKeyPrefix: text("api_key_prefix"),
  webhookUrl: text("webhook_url"),
  apiKeyLastUsedAt: integer("api_key_last_used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const eventTypes = sqliteTable("event_types", {
  id: text("id").primaryKey(), // UUID or nanoid
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  locationType: text("location_type").$type<"google_meet" | "in_person" | "phone" | "custom" | "none">().notNull().default("none"),
  locationDetails: text("location_details"),
  websiteReturnUrl: text("website_return_url"),
  customQuestions: text("custom_questions").notNull().default("[]"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  isStarred: integer("is_starred", { mode: "boolean" }).default(false).notNull(),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
  slug: text("slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bookingIntents = sqliteTable("booking_intents", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventTypeId: text("event_type_id").notNull().references(() => eventTypes.id, { onDelete: "cascade" }),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const availability = sqliteTable("availability", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: text("day").notNull(), // "monday", "tuesday", etc.
  startTime: text("start_time").notNull(), // e.g., "09:00"
  endTime: text("end_time").notNull(), // e.g., "17:00"
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  eventTypeId: text("event_type_id").notNull().references(() => eventTypes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // The host
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestNotes: text("guest_notes"),
  guestAnswers: text("guest_answers").notNull().default("[]"),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  googleEventId: text("google_event_id"),
  meetingUrl: text("meeting_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});
