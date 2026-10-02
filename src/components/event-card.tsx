"use client";

import { Video, Clock, Star, MoreVertical, Trash2, Undo2 } from "lucide-react";
import { Button } from "./ui/button";
import { CopyLinkButton } from "./copy-link-button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleStarEventType, deleteEventType, restoreEventType, permanentlyDeleteEventType } from "@/actions/event-types";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    slug: string;
    isStarred: boolean;
    isDeleted: boolean;
  };
  username: string;
  isTrashView?: boolean;
}

export function EventCard({ event, username, isTrashView = false }: EventCardProps) {
  const handleToggleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await toggleStarEventType(event.id, !event.isStarred);
      toast.success(event.isStarred ? "Removed from Starred" : "Added to Starred");
    } catch (error) {
      toast.error("Failed to update star status");
    }
  };

  const handleMoveToTrash = async () => {
    try {
      await deleteEventType(event.id);
      toast.success("Moved to Trash");
    } catch (error) {
      toast.error("Failed to move to trash");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreEventType(event.id);
      toast.success("Event restored");
    } catch (error) {
      toast.error("Failed to restore event");
    }
  };

  const handlePermanentDelete = async () => {
    try {
      await permanentlyDeleteEventType(event.id);
      toast.success("Event permanently deleted");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="google-card p-6 flex flex-col h-full bg-white border border-transparent group relative transition-all duration-300 hover:border-gray-200">
      <div className="flex justify-between items-start mb-6">
        <div className="h-12 w-12 rounded-full bg-[#f3edff] flex items-center justify-center text-[#5120b8] transition-colors group-hover:bg-[#e4d8ff]">
          <Video size={24} />
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          {!isTrashView && (
            <button 
              onClick={handleToggleStar}
              aria-label={event.isStarred ? "Remove from Starred" : "Add to Starred"}
              className={cn(
                "p-2 rounded-full transition-colors",
                event.isStarred ? "text-[#fbbc04]" : "text-[#444746] hover:bg-[#1f1f1f0a]"
              )}
            >
              <Star size={20} fill={event.isStarred ? "currentColor" : "none"} />
            </button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button 
                aria-label="More actions"
                className="p-2 rounded-full text-[#444746] hover:bg-[#1f1f1f0a] transition-colors" 
              />
            }>
              <MoreVertical size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isTrashView ? (
                <>
                  <DropdownMenuItem onClick={handleRestore} className="cursor-pointer">
                    <Undo2 className="mr-2 h-4 w-4" /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePermanentDelete} className="cursor-pointer text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete forever
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem 
                    render={<Link href={`/dashboard/events/${event.id}`} className="cursor-pointer" />}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMoveToTrash} className="cursor-pointer text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <h3 className="text-xl font-medium text-[#1f1f1f] mb-1">{event.name}</h3>
      <p className="text-sm text-[#5f6368] line-clamp-1 mb-4">{event.description || "No description provided."}</p>
      
      <div className="flex items-center text-sm text-[#5f6368] mb-8">
        <Clock className="mr-2 h-4 w-4" />
        {event.duration} minutes
      </div>
      
      <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
        {!isTrashView ? (
          <>
            <Button variant="ghost" size="sm" className="px-6 rounded-full text-[#6426d9] hover:bg-[#f8f9fa] font-medium" asChild>
              <Link href={`/dashboard/events/${event.id}`}>Edit</Link>
            </Button>
            <CopyLinkButton url={`/${username}/${event.slug}`} />
          </>
        ) : (
          <Button variant="outline" size="sm" className="w-full rounded-full" onClick={handleRestore}>
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}
