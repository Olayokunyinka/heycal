import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BookingsList } from "../bookings-list";
import { Users } from "lucide-react";
import { parseGuestAnswers } from "@/lib/event-questions";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userEventTypes = await db.query.eventTypes.findMany({
    where: (et, { eq }) => eq(et.userId, userId),
  });

  const allBookings = await db.query.bookings.findMany({
    where: (b, { eq }) => eq(b.userId, userId),
    orderBy: (b, { desc }) => [desc(b.startTime)],
  });

  return (
    <div className="p-4 md:p-8 reveal-fade">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-[#1f1f1f]">My Bookings</h1>
      </div>

      {allBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-dashed border-gray-300 rounded-[24px] reveal-up">
          <div className="h-20 w-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-normal text-[#1f1f1f] mb-2">No bookings found</h2>
          <p className="text-[#5f6368] max-w-sm">Scheduled meetings with your guests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6 reveal-up">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-medium text-[#444746]">Upcoming & Past Meetings</h2>
          </div>
          <div className="google-card overflow-hidden">
            <BookingsList 
              initialBookings={allBookings.map((booking) => ({
                ...booking,
                guestAnswers: parseGuestAnswers(booking.guestAnswers),
              }))}
              eventTypes={userEventTypes.map(e => ({ id: e.id, name: e.name }))} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
