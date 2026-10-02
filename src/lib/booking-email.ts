interface BookingConfirmationEmailData {
  eventName: string;
  eventDuration: number;
  guestName: string;
  guestEmail: string;
  organizerEmail: string | null;
  startTime: Date;
  endTime: Date;
  meetingUrl: string | null;
  locationDetails: string | null;
  guestNotes?: string;
  guestAnswers: { question: string; answer: string }[];
}

function formatUtc(date: Date): string {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
}

async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });

    if (!response.ok) {
      console.error("Booking confirmation email provider rejected a message", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Booking confirmation email delivery failed", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}

export async function sendBookingConfirmationEmails(data: BookingConfirmationEmailData) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Booking confirmation emails are disabled; set RESEND_API_KEY and RESEND_FROM_EMAIL");
    return { guestConfirmationSent: false, organizerNotificationSent: false };
  }

  const sharedDetails = [
    `Event: ${data.eventName} (${data.eventDuration} minutes)`,
    `Start: ${formatUtc(data.startTime)}`,
    `End: ${formatUtc(data.endTime)}`,
    data.meetingUrl ? `Google Meet: ${data.meetingUrl}` : null,
    data.locationDetails ? `Location: ${data.locationDetails}` : null,
  ].filter((line): line is string => Boolean(line));

  const guestText = [
    `Hi ${data.guestName},`,
    "",
    "Your booking is confirmed.",
    "",
    ...sharedDetails,
    "",
    "The time above is in UTC.",
    "We look forward to meeting with you.",
  ].join("\n");

  const organizerText = [
    "A new booking has been confirmed.",
    "",
    `Guest: ${data.guestName}`,
    `Email: ${data.guestEmail}`,
    ...sharedDetails,
    data.guestNotes ? `Guest notes: ${data.guestNotes}` : null,
    ...data.guestAnswers.map(({ question, answer }) => `${question}: ${answer}`),
    "",
    "The time above is in UTC.",
  ].filter((line): line is string => line !== null).join("\n");

  const [guestConfirmationSent, organizerNotificationSent] = await Promise.all([
    sendEmail(data.guestEmail, `Booking confirmed: ${data.eventName}`, guestText),
    data.organizerEmail
      ? sendEmail(data.organizerEmail, `New booking: ${data.eventName}`, organizerText)
      : Promise.resolve(false),
  ]);

  return { guestConfirmationSent, organizerNotificationSent };
}