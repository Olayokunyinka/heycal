import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Users, Video, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingsList } from "./bookings-list";
import { EventCard } from "@/components/event-card";
import { parseGuestAnswers } from "@/lib/event-questions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: searchQuery } = await searchParams;
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Sync user
  let existingUser = null;
  try {
    existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });
  } catch (err) {
    console.error("Database query failed:", err);
    // If query fails, we can't proceed safely
    throw new Error("Could not connect to database. Please check your configuration.");
  }

  let defaultUsername = "";
  if (!existingUser && user) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
        throw new Error("User email not found in Clerk profile.");
    }

    defaultUsername = email.split("@")[0] + "_" + Date.now();
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Guest User";

    try {
      await db.insert(users).values({
        id: userId,
        email: email,
        username: defaultUsername,
        name: fullName,
        imageUrl: user.imageUrl || null,
      });
      
      // Fetch again after successful insert
      existingUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });
    } catch (err) {
      console.error("User sync insert failed:", err);
      // Try one more time to fetch (maybe it was already inserted by a parallel request)
      existingUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });
      
      if (!existingUser) {
          throw new Error("Failed to synchronize user data with the database.");
      }
    }
  }

  const username = existingUser?.username || defaultUsername;

  let userEventTypes = await db.query.eventTypes.findMany({
    where: (et, { eq, and }) => and(eq(et.userId, userId), eq(et.isDeleted, false)),
  });

  let allBookings = await db.query.bookings.findMany({
    where: (b, { eq }) => eq(b.userId, userId),
    orderBy: (b, { desc }) => [desc(b.startTime)],
  });

  // Filter based on search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    userEventTypes = userEventTypes.filter(
      (et) =>
        et.name.toLowerCase().includes(query) ||
        (et.description && et.description.toLowerCase().includes(query)),
    );
    allBookings = allBookings.filter(
      (b) =>
        b.guestName.toLowerCase().includes(query) ||
        b.guestEmail.toLowerCase().includes(query) ||
        (b.guestNotes && b.guestNotes.toLowerCase().includes(query)),
    );
  }

  const upcomingBookings = allBookings
    .filter(b => new Date(b.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const priorityBooking = upcomingBookings[0];

  return (
    <div className="p-4 md:p-8 reveal-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-normal text-[#1f1f1f]">
          Welcome to Heycal
        </h1>
      </div>

      <div className="space-y-12">
        {/* Priority / Suggested Section */}
        {priorityBooking && (
          <section className="reveal-up" style={{ animationDelay: '0.1s' }}>
             <div className="flex items-center gap-2 mb-6">
              <h2 className="text-base font-medium text-[#444746]">
                Priority
              </h2>
            </div>
            <div className="google-card p-6 bg-[#f0f4f9] border-transparent max-w-2xl flex items-center justify-between group cursor-pointer transition-all hover:shadow-md hover:bg-[#dce9fd]">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-[#0b57d0] shadow-sm transition-colors group-hover:bg-[#e2e7ff]">
                  <Video size={28} />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#0b57d0] mb-1">Next meeting with {priorityBooking.guestName}</div>
                  <h3 className="text-xl font-medium text-[#1f1f1f]">
                    {format(new Date(priorityBooking.startTime), "h:mm a")} • {getEventName(priorityBooking.eventTypeId, userEventTypes)}
                  </h3>
                </div>
              </div>
              <Button variant="ghost" className="rounded-full h-10 w-10 p-0 text-[#0b57d0] opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} />
              </Button>
            </div>
          </section>
        )}

        {/* Event Types Section */}
        <section className="reveal-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-medium text-[#444746]">
              Suggested Event Types
            </h2>
          </div>
          {userEventTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-dashed border-gray-300 rounded-[24px]">
              <div className="h-20 w-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-6">
                <Video className="h-10 w-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-normal text-[#1f1f1f] mb-2">No event types yet</h2>
              <p className="text-[#5f6368] max-w-sm mb-8">Create your first meeting type to start accepting bookings from your guests.</p>
              <Button asChild className="rounded-full bg-[#1a73e8] px-8 h-11">
                <Link href="/dashboard/events/new">
                  Create your first event
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userEventTypes.map((event) => (
                <EventCard key={event.id} event={event} username={username} />
              ))}
            </div>
          )}
        </section>

        {/* Bookings Section */}
        <section className="reveal-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-medium text-[#1f1f1f]">
              Attendees & Bookings
            </h2>
          </div>

          {allBookings.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-dashed border-gray-300 rounded-[24px]">
              <div className="h-20 w-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-normal text-[#1f1f1f] mb-2">No bookings found</h2>
              <p className="text-[#5f6368] max-w-sm">Share your event links to start seeing scheduled meetings here.</p>
            </div>
          ) : (
            <div className="google-card overflow-hidden">
              <BookingsList
                initialBookings={allBookings.map((booking) => ({
                  ...booking,
                  guestAnswers: parseGuestAnswers(booking.guestAnswers),
                }))}
                eventTypes={userEventTypes.map((e) => ({
                  id: e.id,
                  name: e.name,
                }))}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function getEventName(id: string, types: { id: string; name: string }[]) {
    return types.find(t => t.id === id)?.name || "Meeting";
}
