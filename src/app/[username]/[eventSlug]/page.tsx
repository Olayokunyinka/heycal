import { db } from "@/db";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Video } from "lucide-react";
import { parseEventQuestions } from "@/lib/event-questions";

export const dynamic = "force-dynamic";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>;
}) {
  const { username, eventSlug } = await params;

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
  });

  if (!user) {
    return notFound();
  }

  const eventType = await db.query.eventTypes.findFirst({
    where: (et, { eq, and }) => and(eq(et.userId, user.id), eq(et.slug, eventSlug), eq(et.isActive, true)),
  });

  if (!eventType) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="google-card max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 overflow-hidden bg-white">
        <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-gray-100">
          <Avatar className="h-16 w-16 mb-6 border border-gray-100">
            <AvatarImage src={user.imageUrl || ""} />
            <AvatarFallback className="bg-[#e8f0fe] text-[#1a73e8]">{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-sm font-medium text-[#5f6368] mb-1">{user.name}</h2>
          <h1 className="text-2xl font-normal text-[#1f1f1f] mb-6">{eventType.name}</h1>
          <div className="flex items-center text-sm text-[#5f6368] mb-6">
            <Clock className="mr-3 h-5 w-5 text-[#1a73e8]" />
            {eventType.duration} minutes
          </div>
          {eventType.locationType !== "none" && (
            <div className="flex items-start text-sm text-[#5f6368] mb-6">
              {eventType.locationType === "google_meet" ? (
                <Video className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-[#1a73e8]" />
              ) : (
                <MapPin className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-[#1a73e8]" />
              )}
              <div>
                <p className="font-medium text-[#1f1f1f]">
                  {{
                    google_meet: "Google Meet",
                    in_person: "In person",
                    phone: "Phone call",
                    custom: "Custom location",
                  }[eventType.locationType]}
                </p>
                {eventType.locationDetails && <p>{eventType.locationDetails}</p>}
              </div>
            </div>
          )}
          <p className="text-sm text-[#5f6368] leading-relaxed">
            {eventType.description || "Welcome to my scheduling page. Please select a time that works for you."}
          </p>
        </div>
        <div className="md:col-span-2 p-8 md:p-10">
          <BookingForm
            eventType={{
              ...eventType,
              questions: parseEventQuestions(eventType.customQuestions),
            }}
            hostId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
