"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, startOfDay } from "date-fns";
import { getAvailableSlotsAction } from "@/actions/availability-fetch";
import { createBookingAction } from "@/actions/bookings";
import { Loader2, ChevronLeft, Video } from "lucide-react";

interface EventType {
  id: string;
  name: string;
  duration: number;
  description: string | null;
  slug: string;
  locationType: "google_meet" | "in_person" | "phone" | "custom" | "none";
  locationDetails: string | null;
  questions: string[];
}

export function BookingForm({ eventType, hostId }: { eventType: EventType; hostId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Success

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [guestAnswers, setGuestAnswers] = useState<string[]>([]);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const slots = await getAvailableSlotsAction(hostId, date.toISOString(), eventType.duration);
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Fetch slots error:", error);
      toast.error("Failed to fetch available slots");
    } finally {
      setIsLoading(false);
    }
  }, [hostId, eventType.duration]);

  useEffect(() => {
    if (selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setIsLoading(true);
    try {
      const result = await createBookingAction({
        eventTypeId: eventType.id,
        hostId,
        guestName,
        guestEmail,
        guestNotes,
        guestAnswers,
        startTime: selectedSlot,
      });
      setMeetingUrl(result.meetingUrl);
      setStep(3);
      toast.success("Meeting booked successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to book meeting");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center h-full">
        <div className="h-20 w-20 rounded-full bg-[#e6f4ea] flex items-center justify-center text-[#1e8e3e] mb-6">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-normal text-[#1f1f1f] mb-4">You&apos;re all set!</h2>
        <p className="text-[#5f6368] mb-4 max-w-sm">
          Your {eventType.name} has been scheduled.
        </p>
        {meetingUrl && (
          <a
            className="mb-8 inline-flex items-center gap-2 font-medium text-[#1a73e8] underline underline-offset-4"
            href={meetingUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Video className="h-4 w-4" /> Join Google Meet
          </a>
        )}
        <Button className="rounded-full px-8" onClick={() => window.location.reload()}>Book another</Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      {step === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 text-center lg:text-left">Select a Date</h3>
            <div className="flex justify-center lg:justify-start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-2xl border border-gray-100 shadow-sm p-4"
                disabled={(date) => date < startOfDay(new Date())}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6">
              {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Select a date"}
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? "default" : "outline"}
                    className="w-full h-12 rounded-lg text-sm font-medium border-gray-200"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep(2);
                    }}
                  >
                    {format(new Date(slot), "h:mm a")}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#f8f9fa] rounded-2xl border border-dashed border-gray-200">
                <p className="text-[#5f6368] text-sm">No available slots for this day.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-md">
          <Button variant="ghost" size="sm" className="mb-6 rounded-full text-[#5f6368]" onClick={() => setStep(1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to calendar
          </Button>
          <h3 className="text-xl font-normal text-[#1f1f1f] mb-8">Enter your details</h3>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleBooking();
            }}
          >
            {selectedSlot && (
              <p className="text-sm text-[#5f6368]">
                {format(new Date(selectedSlot), "EEEE, MMMM do 'at' h:mm a")}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-[#1f1f1f]">Name</Label>
              <Input
                id="name"
                name="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="What should we call you?"
                className="h-12 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1f1f1f]">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Where should we send the invite?"
                className="h-12 rounded-lg"
                required
              />
            </div>
            {eventType.questions.map((question, index) => (
              <div className="space-y-2" key={`${index}-${question}`}>
                <Label htmlFor={`question-${index}`} className="text-sm font-medium text-[#1f1f1f}">{question}</Label>
                <textarea
                  id={`question-${index}`}
                  name={`question-${index}`}
                  className="w-full min-h-[88px] rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all"
                  value={guestAnswers[index] ?? ""}
                  onChange={(event) => {
                    setGuestAnswers((answers) => {
                      const nextAnswers = [...answers];
                      nextAnswers[index] = event.target.value;
                      return nextAnswers;
                    });
                  }}
                  required
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-[#1f1f1f]">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                className="w-full min-h-[120px] rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all placeholder:text-[#5f6368]"
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                placeholder="Anything else you'd like to share?"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-full mt-4 bg-[#1a73e8] hover:bg-[#1557b0]"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Schedule event
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
