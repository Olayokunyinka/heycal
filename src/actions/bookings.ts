"use server";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { nanoid } from "nanoid";
import { getGoogleCalendarClient } from "@/lib/google-calendar";
import { addMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { parseEventQuestions } from "@/lib/event-questions";

export async function createBookingAction(data: {
  eventTypeId: string;
  hostId: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
  guestAnswers: string[];
  startTime: string;
}) {
  const startTime = new Date(data.startTime);
  
  // Fetch event type for duration
  const eventType = await db.query.eventTypes.findFirst({
    where: (et, { eq }) => eq(et.id, data.eventTypeId),
  });

  if (!eventType || eventType.userId !== data.hostId || !eventType.isActive || eventType.isDeleted) {
    throw new Error("This event is no longer available");
  }

  const questions = parseEventQuestions(eventType.customQuestions);
  const answers = Array.isArray(data.guestAnswers) ? data.guestAnswers : [];
  if (answers.length !== questions.length || answers.some((answer) => (
    typeof answer !== "string" || !answer.trim() || answer.length > 2000
  ))) {
    throw new Error("Please answer each event question");
  }
  if (!data.guestName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) {
    throw new Error("Enter a valid name and email address");
  }

  const endTime = addMinutes(startTime, eventType.duration);
  const bookingId = nanoid();
  const guestAnswers = answers.map((answer) => answer.trim());

  // Save the booking first so non-video events can still be scheduled without Calendar access.
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

  let calendar = null;
  try {
    calendar = await getGoogleCalendarClient(data.hostId);
  } catch (error) {
    if (eventType.locationType === "google_meet") {
      await db.delete(bookings).where(eq(bookings.id, bookingId));
      throw new Error("The host must reconnect Google Calendar with Calendar events access to create a Meet link");
    }
    console.error("Failed to connect to Google Calendar", error);
  }

  if (eventType.locationType === "google_meet" && !calendar) {
    await db.delete(bookings).where(eq(bookings.id, bookingId));
    throw new Error("The host must connect Google Calendar before this event can be booked");
  }

  let meetingUrl: string | null = null;
  if (calendar) {
    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: eventType.locationType === "google_meet" ? 1 : 0,
        sendUpdates: "all", // This sends an email invitation to the guest
        requestBody: {
          summary: `${eventType.name}: ${data.guestName}`,
          description: [
            "Meeting scheduled via Calendra.",
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
          throw new Error("Google Calendar did not return a Meet link");
        }
        await db.update(bookings).set({
          googleEventId: response.data.id,
          meetingUrl,
        }).where(eq(bookings.id, bookingId));
      }
    } catch (error) {
      console.error("Failed to add to Google Calendar", error);
      if (eventType.locationType === "google_meet") {
        await db.delete(bookings).where(eq(bookings.id, bookingId));
        throw new Error("Google Calendar could not create a Meet link. Reconnect Google Calendar and try again");
      }
    }
  }

  return { success: true, meetingUrl };
}
