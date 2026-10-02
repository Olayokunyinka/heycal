"use server";

import { getBusySlots } from "@/lib/google-calendar";
import { getAvailableSlots } from "@/lib/availability";
import { startOfDay, endOfDay } from "date-fns";

export async function getAvailableSlotsAction(hostId: string, dateStr: string | Date, duration: number) {
  const date = typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T00:00:00.000Z`)
    : new Date(dateStr);
  const start = startOfDay(date);
  const end = endOfDay(date);
  
  console.log(`Fetching availability for ${hostId} on ${date.toDateString()}`);
  
  const busySlots = await getBusySlots(hostId, start, end);
  console.log(`Busy slots found: ${busySlots.length}`);
  
  const availableSlots = await getAvailableSlots(hostId, date, duration, busySlots);
  console.log(`Available slots calculated: ${availableSlots.length}`);
  
  return availableSlots.map(s => s.toISOString());
}
