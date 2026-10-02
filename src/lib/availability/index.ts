import { db } from "@/db";
import { addMinutes, format, isAfter, isBefore, set } from "date-fns";

export async function getAvailableSlots(userId: string, date: Date, duration: number, busySlots: { start?: string | null; end?: string | null }[]) {
  const dayOfWeek = format(date, "eeee").toLowerCase() as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

  const dayAvailability = await db.query.availability.findFirst({
    where: (a, { eq, and }) => and(eq(a.userId, userId), eq(a.day, dayOfWeek)),
  });

  console.log(`Availability for ${dayOfWeek}:`, dayAvailability);

  const defaultWeekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const schedule = dayAvailability
    ? dayAvailability.isActive ? dayAvailability : null
    : defaultWeekdays.includes(dayOfWeek)
      ? { startTime: "09:00", endTime: "17:00" }
      : null;

  if (!schedule) {
    return [];
  }

  const slots: Date[] = [];
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

  let currentSlot = set(date, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
  const dayEnd = set(date, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

  while (isBefore(currentSlot, dayEnd)) {
    const slotEnd = addMinutes(currentSlot, duration);
    
    if (isAfter(slotEnd, dayEnd)) break;

    const isBusy = busySlots.some((busy) => {
      const busyStart = new Date(busy.start!).getTime();
      const busyEnd = new Date(busy.end!).getTime();
      const slotStart = currentSlot.getTime();
      const slotEndTs = slotEnd.getTime();
      
      // Overlap logic: 
      // A slot is busy if it starts before a busy period ends AND ends after a busy period starts
      return slotStart < busyEnd && slotEndTs > busyStart;
    });

    if (!isBusy) {
      slots.push(new Date(currentSlot));
    }

    currentSlot = addMinutes(currentSlot, duration);
  }

  console.log(`Generated ${slots.length} slots for ${dayOfWeek}`);
  return slots;
}
