"use server";

import { db } from "@/db";
import { bookingIntents, bookings } from "@/db/schema";
import { nanoid } from "nanoid";
import { getGoogleCalendarClient } from "@/lib/google-calendar";
import { addMinutes } from "date-fns";
import { and, eq, gt, isNull } from "drizzle-orm";
import { parseEventQuestions } from "@/lib/event-questions";
import { hashApiKey, sendBookingCreatedWebhook } from "@/lib/integrations";
import { sendBookingConfirmationEmails } from "@/lib/booking-email";

type BookingActionResult =
  | { success: true; meetingUrl: string | null; invitationSent: boolean; guestConfirmationSent: boolean }
  | { success: false; message: string };

export async function createBookingAction(data: {
  eventTypeId: string;
  hostId: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
  guestAnswers: string[];
  startTime: string;
  bookingIntentToken?: string | null;
}): Promise<BookingActionResult> {
  const startTime = new Date(data.startTime);
  if (!Number.isFinite(startTime.getTime())) {
    return { success: false, message: "Choose a valid booking time" };
  }
  
  // Fetch event type for duration
  const eventType = await db.query.eventTypes.findFirst({
    where: (et, { eq }) => eq(et.id, data.eventTypeId),
  });

  if (!eventType || eventType.userId !== data.hostId || !eventType.isActive || eventType.isDeleted) {
    return { success: false, message: "This event is no longer available" };
  }

  const questions = parseEventQuestions(eventType.customQuestions);
  const answers = Array.isArray(data.guestAnswers) ? data.guestAnswers : [];
  if (answers.length !== questions.length || answers.some((answer) => (
    typeof answer !== "string" || !answer.trim() || answer.length > 2000
  ))) {
    return { success: false, message: "Please answer each event question" };
  }
  if (typeof data.guestName !== "string" || typeof data.guestEmail !== "string"
    || !data.guestName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) {
    return { success: false, message: "Enter a valid name and email address" };
  }

  const endTime = addMinutes(startTime, eventType.duration);
  const bookingId = nanoid();
  const guestAnswers = answers.map((answer) => answer.trim());
  const handoffTokenHash = data.bookingIntentToken
    ? await hashApiKey(data.bookingIntentToken)
    : null;

  if (handoffTokenHash) {
    const now = new Date();
    const claim = await db.update(bookingIntents)
      .set({ usedAt: now })
      .where(and(
        eq(bookingIntents.tokenHash, handoffTokenHash),
        eq(bookingIntents.userId, data.hostId),
        eq(bookingIntents.eventTypeId, data.eventTypeId),
        isNull(bookingIntents.usedAt),
        gt(bookingIntents.expiresAt, now),
      ));
    if (claim.rowsAffected !== 1) {
        return { success: false, message: "This website booking link has expired or has already been used. Please submit the contact form again." };
    }
  }

  const releaseHandoffToken = async () => {
    if (!handoffTokenHash) return;
    await db.update(bookingIntents)
      .set({ usedAt: null })
      .where(and(
        eq(bookingIntents.tokenHash, handoffTokenHash),
        eq(bookingIntents.userId, data.hostId),
      ));
  };

  // Save the booking first so non-video events can still be scheduled without Calendar access.
  try {
    await db.insert(bookings).values({
      id: bookingId,
      eventTypeId: data.eventTypeId,
      userId: data.hostId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestNotes: data.guestNotes,
      guestAnswers: JSON.stringify(questions.map((question, index) => ({
        question,
        answer: guestAnswers[index],
      }))),
      startTime: startTime,
      endTime: endTime,
    });
  } catch (error) {
    await releaseHandoffToken();
    const dbError = error && typeof error === "object"
      ? error as { name?: string; message?: string; code?: string; extendedCode?: number }
      : undefined;
    console.error("Booking insert failed", JSON.stringify({
      name: dbError?.name ?? "UnknownError",
      code: dbError?.code,
      extendedCode: dbError?.extendedCode,
      message: dbError?.message ?? String(error),
    }));
    return { success: false, message: "We couldn't save this booking. Please try again or contact the event organizer." };
  }

  let calendar = null;
  try {
    calendar = await getGoogleCalendarClient(data.hostId);
  } catch (error) {
    if (eventType.locationType === "google_meet") {
      await db.delete(bookings).where(eq(bookings.id, bookingId));
      await releaseHandoffToken();
      return { success: false, message: "The host's Google Calendar connection needs attention before this event can be booked. Please contact the organizer." };
    }
    console.error("Failed to connect to Google Calendar", error);
  }

  if (eventType.locationType === "google_meet" && !calendar) {
    await db.delete(bookings).where(eq(bookings.id, bookingId));
    await releaseHandoffToken();
    return { success: false, message: "The host needs to connect Google Calendar before this event can be booked. Please contact the organizer." };
  }

  let meetingUrl: string | null = null;
  let invitationSent = false;
  if (calendar) {
    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: eventType.locationType === "google_meet" ? 1 : 0,
        sendUpdates: "all", // This sends an email invitation to the guest
        requestBody: {
          summary: `${eventType.name}: ${data.guestName}`,
          description: [
            "Meeting scheduled via Heycal.",
            `Guest: ${data.guestName} (${data.guestEmail})`,
            `Notes: ${data.guestNotes || "None"}`,
            ...questions.map((question, index) => `${question}\n${guestAnswers[index]}`),
          ].join("\n\n"),
          ...(eventType.locationType !== "google_meet" && eventType.locationDetails
            ? { location: eventType.locationDetails }
            : {}),
          ...(eventType.locationType === "google_meet"
            ? {
                conferenceData: {
                  createRequest: {
                    requestId: nanoid(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                  },
                },
              }
            : {}),
          start: { 
            dateTime: startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: { 
            dateTime: endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          attendees: [
            { email: data.guestEmail, displayName: data.guestName }
          ],
          reminders: {
            useDefault: true,
          },
        },
      });

      if (response.data.id) {
        meetingUrl = response.data.hangoutLink ?? response.data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ?? null;
        if (eventType.locationType === "google_meet" && !meetingUrl) {
          await db.delete(bookings).where(eq(bookings.id, bookingId));
          await releaseHandoffToken();
          return { success: false, message: "Google Calendar could not create a Meet link. Please contact the organizer." };
        }
        await db.update(bookings).set({
          googleEventId: response.data.id,
          meetingUrl,
        }).where(eq(bookings.id, bookingId));
        invitationSent = true;
      }
    } catch (error) {
      console.error("Failed to add to Google Calendar", error);
      if (eventType.locationType === "google_meet") {
        await db.delete(bookings).where(eq(bookings.id, bookingId));
        await releaseHandoffToken();
        return { success: false, message: "Google Calendar couldn't create a Meet link. Please contact the organizer." };
      }
    }
  }

  try {
    await sendBookingCreatedWebhook({
      userId: data.hostId,
      booking: {
        id: bookingId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestNotes: data.guestNotes,
        guestAnswers: questions.map((question, index) => ({ question, answer: guestAnswers[index] })),
        startTime,
        endTime,
        meetingUrl,
      },
      event: {
        id: eventType.id,
        name: eventType.name,
        slug: eventType.slug,
        duration: eventType.duration,
      },
    });
  } catch (error) {
    console.error("Booking webhook dispatch failed", error);
  }

  let guestConfirmationSent = false;
  try {
    const organizer = await db.query.users.findFirst({
      where: (user, { eq }) => eq(user.id, data.hostId),
    });
    if (organizer) {
      const emailResult = await sendBookingConfirmationEmails({
        eventName: eventType.name,
        eventDuration: eventType.duration,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        organizerEmail: organizer.email,
        startTime,
        endTime,
        meetingUrl,
        locationDetails: eventType.locationDetails,
        guestNotes: data.guestNotes,
        guestAnswers: questions.map((question, index) => ({ question, answer: guestAnswers[index] })),
      });
      guestConfirmationSent = emailResult.guestConfirmationSent;
    }
  } catch (error) {
    console.error("Booking confirmation email dispatch failed", error instanceof Error ? error.message : "unknown error");
  }

  return { success: true, meetingUrl, invitationSent, guestConfirmationSent };
}
