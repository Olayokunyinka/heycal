"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, User, Video, MessageSquare } from "lucide-react";

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestNotes: string | null;
  guestAnswers: { question: string; answer: string }[];
  meetingUrl: string | null;
  startTime: Date | number;
  endTime: Date | number;
  eventTypeId: string;
}

interface EventType {
  id: string;
  name: string;
}

export function BookingsList({ 
  initialBookings, 
  eventTypes 
}: { 
  initialBookings: Booking[],
  eventTypes: EventType[] 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(initialBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = initialBookings.slice(startIndex, startIndex + itemsPerPage);

  const getEventName = (id: string) => eventTypes.find(e => e.id === id)?.name || "Unknown Event";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {currentBookings.map((booking) => (
          <Dialog key={booking.id}>
            <DialogTrigger 
              nativeButton={false}
              render={
                <div className="google-card p-5 flex items-center justify-between cursor-pointer bg-white border border-transparent mb-3 transition-all duration-200 hover:border-gray-200 hover:bg-[#fdfdfd]" />
              }
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#f3edff] h-12 w-12 rounded-full flex items-center justify-center text-[#5120b8] font-medium text-lg transition-colors group-hover:bg-[#e4d8ff]">
                  {booking.guestName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-base font-medium text-[#1f1f1f] mb-1">{booking.guestName}</div>
                  <div className="flex items-center gap-2 text-sm text-[#444746]">
                    <span className="bg-[#f1f3f4] px-2 py-0.5 rounded text-xs font-medium text-[#444746]">
                      {getEventName(booking.eventTypeId)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{booking.guestEmail}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#1f1f1f]">
                  {format(new Date(booking.startTime), "MMM do, yyyy")}
                </div>
                <div className="text-xs text-[#5f6368]">
                  {format(new Date(booking.startTime), "h:mm a")}
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-normal text-[#1f1f1f]">
                  Meeting Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-[#5f6368]">
                      <Video size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-[#5f6368]">Event Type</p>
                      <p className="text-base font-medium text-[#1f1f1f]">{getEventName(booking.eventTypeId)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-[#5f6368]">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-[#5f6368]">Guest</p>
                      <p className="text-base font-medium text-[#1f1f1f]">{booking.guestName}</p>
                      <p className="text-sm text-[#5f6368]">{booking.guestEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-[#5f6368]">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-[#5f6368]">When</p>
                      <p className="text-base font-medium text-[#1f1f1f]">{format(new Date(booking.startTime), "EEEE, MMMM do, yyyy")}</p>
                      <p className="text-sm text-[#5f6368]">
                        {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  {booking.meetingUrl && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 text-[#5f6368]">
                        <Video size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-[#5f6368]">Google Meet</p>
                        <a className="text-sm font-medium text-[#6426d9] underline underline-offset-4" href={booking.meetingUrl} target="_blank" rel="noreferrer">
                          Join meeting
                        </a>
                      </div>
                    </div>
                  )}

                  {booking.guestAnswers.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 text-[#5f6368]">
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm text-[#5f6368]">Invitee answers</p>
                        {booking.guestAnswers.map(({ question, answer }) => (
                          <div key={question}>
                            <p className="text-sm font-medium text-[#1f1f1f]">{question}</p>
                            <p className="mt-1 text-sm text-[#3c4043]">{answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.guestNotes && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 text-[#5f6368]">
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#5f6368]">Guest Notes</p>
                        <div className="mt-1 p-3 bg-[#f8f9fa] rounded-xl border border-gray-100 text-sm text-[#3c4043]">
                          {booking.guestNotes}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
