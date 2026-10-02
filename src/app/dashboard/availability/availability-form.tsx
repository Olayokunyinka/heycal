"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateAvailability } from "@/actions/availability";
import { toast } from "sonner";
import { Save } from "lucide-react";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

interface AvailabilityRowProps {
  day: (typeof DAYS)[number];
  initialData?: {
    startTime: string;
    endTime: string;
    isActive: boolean;
  };
}

function AvailabilityRow({ day, initialData }: AvailabilityRowProps) {
  const [isActive, setIsActive] = useState(initialData?.isActive ?? (day !== "saturday" && day !== "sunday"));
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "17:00");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateAvailability({
        day,
        startTime,
        endTime,
        isActive,
      });
      toast.success(`${day.charAt(0).toUpperCase() + day.slice(1)} schedule updated`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update availability");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-[#f8f9fa] transition-colors group">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <div className="min-w-[100px]">
          <span className="text-sm font-medium text-[#1f1f1f] capitalize">{day}</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        {isActive ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-[130px] h-9 text-sm rounded-lg bg-white"
            />
            <span className="text-gray-400 text-sm">-</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-[130px] h-9 text-sm rounded-lg bg-white"
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave}
              disabled={isLoading}
              className="ml-2 rounded-full h-9 w-9 p-0 text-[#6426d9] hover:bg-[#efe7ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Save size={18} />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-[#5f6368] italic">Unavailable</span>
        )}
      </div>
    </div>
  );
}

interface Availability {
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export function AvailabilityForm({ initialData }: { initialData: Availability[] }) {
  return (
    <div className="flex flex-col">
      {DAYS.map((day) => {
        const data = initialData.find((d) => d.day === day);
        return <AvailabilityRow key={day} day={day} initialData={data} />;
      })}
    </div>
  );
}
