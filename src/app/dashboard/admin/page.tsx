import { count, desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { CalendarCheck2, CalendarDays, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings, eventTypes, users } from "@/db/schema";
import { isAdminUser } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!await isAdminUser()) notFound();

  const [userCount, eventCount, bookingCount, recentUsers, recentBookings] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(eventTypes).where(eq(eventTypes.isDeleted, false)),
    db.select({ value: count() }).from(bookings),
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(8),
    db.select({
      id: bookings.id,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      startTime: bookings.startTime,
      createdAt: bookings.createdAt,
      eventName: eventTypes.name,
    }).from(bookings)
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .orderBy(desc(bookings.createdAt))
      .limit(8),
  ]);

  const stats = [
    { label: "Accounts", value: userCount[0]?.value ?? 0, icon: Users },
    { label: "Event types", value: eventCount[0]?.value ?? 0, icon: CalendarDays },
    { label: "Bookings", value: bookingCount[0]?.value ?? 0, icon: CalendarCheck2 },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5dff0] pb-5">
        <div>
          <p className="text-sm font-medium text-[#6426d9]">Heycal platform</p>
          <h1 className="mt-1 text-2xl font-medium text-[#1f1f1f]">Admin overview</h1>
        </div>
        <p className="text-sm text-[#5f6368]">Read-only monitoring</p>
      </header>

      <section aria-label="Platform totals" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-[#e5dff0] bg-white p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#f3edff] text-[#6426d9]">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="text-sm text-[#5f6368]">{label}</p>
              <p className="text-2xl font-semibold tabular-nums text-[#1f1f1f]">{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f1f1f]">Recent signups</h2>
            <span className="text-xs text-[#5f6368]">Latest 8</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#e5dff0]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#f8f5ff] text-xs uppercase text-[#5f6368]">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f5] bg-white">
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1f1f1f]">{user.name || "Unnamed user"}</p>
                      <p className="text-xs text-[#5f6368]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#444746]">{user.username || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5f6368]">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr><td className="px-4 py-8 text-center text-[#5f6368]" colSpan={3}>No accounts yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f1f1f]">Recent bookings</h2>
            <span className="text-xs text-[#5f6368]">Latest 8</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#e5dff0]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#f8f5ff] text-xs uppercase text-[#5f6368]">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f5] bg-white">
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1f1f1f]">{booking.guestName}</p>
                      <p className="text-xs text-[#5f6368]">{booking.guestEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-[#444746]">{booking.eventName || "Deleted event"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5f6368]">
                      {format(new Date(booking.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr><td className="px-4 py-8 text-center text-[#5f6368]" colSpan={3}>No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}