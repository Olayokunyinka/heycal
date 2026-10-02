import { db } from "@/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { Trash2, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Sync user if needed
  const existingUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  const username = existingUser?.username || user.emailAddresses[0].emailAddress.split("@")[0];

  const deletedEvents = await db.query.eventTypes.findMany({
    where: (et, { eq, and }) => and(eq(et.userId, userId), eq(et.isDeleted, true)),
  });

  return (
    <div className="p-4 md:p-8 reveal-fade">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-normal text-[#1f1f1f]">Trash</h1>
      </div>

      <div className="bg-[#efe7ff] rounded-xl p-4 mb-8 flex items-start gap-3 border border-[#decfff] reveal-up">
        <Info className="h-5 w-5 text-[#6426d9] mt-0.5" />
        <div className="text-sm text-[#3c4043]">
          <p className="font-medium text-[#6426d9]">Items in trash will be deleted forever after 30 days.</p>
          <p className="mt-1">Events here won&apos;t be visible to your guests until they are restored.</p>
        </div>
      </div>

      {deletedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-dashed border-gray-300 rounded-[24px] reveal-up" style={{ animationDelay: '0.1s' }}>
          <div className="h-20 w-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-6">
            <Trash2 className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-normal text-[#1f1f1f] mb-2">Trash is empty</h2>
          <p className="text-[#5f6368] max-w-xs">When you delete event types, they&apos;ll appear here for a limited time.</p>
        </div>
      ) : (
        <div className="space-y-6 reveal-up" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deletedEvents.map((event) => (
              <EventCard key={event.id} event={event} username={username} isTrashView={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
