"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEventType, deleteEventType } from "@/actions/event-types";
import { Trash2 } from "lucide-react";
import { parseEventQuestions } from "@/lib/event-questions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  isActive: z.boolean(),
  locationType: z.enum(["google_meet", "in_person", "phone", "custom", "none"]),
  locationDetails: z.string().optional(),
  questions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventType {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  slug: string;
  isActive: boolean;
  locationType: "google_meet" | "in_person" | "phone" | "custom" | "none";
  locationDetails: string | null;
  customQuestions: string;
}

export function EditEventTypeForm({ eventType }: { eventType: EventType }) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: eventType.name,
      description: eventType.description || "",
      duration: eventType.duration,
      slug: eventType.slug,
      isActive: eventType.isActive,
      locationType: eventType.locationType,
      locationDetails: eventType.locationDetails || "",
      questions: parseEventQuestions(eventType.customQuestions).join("\n"),
    },
  });
  const locationType = useWatch({ control: form.control, name: "locationType" });

  async function onSubmit(values: FormValues) {
    try {
      await updateEventType(eventType.id, values);
      toast.success("Event type updated!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  }

  async function onDelete() {
    try {
      await deleteEventType(eventType.id);
      toast.success("Event type deleted");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete event type");
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-[#f8f9fa]">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Toggle if this event type is visible to others.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="30 Minute Meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">URL Slug</FormLabel>
                <FormControl>
                  <Input placeholder="30-min" {...field} />
                </FormControl>
                <FormDescription className="text-xs text-[#5f6368]">
                  This will be used in your booking URL: calendra.com/username/slug
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">Description</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of the meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">Location</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                    <SelectItem value="in_person">In person</SelectItem>
                    <SelectItem value="phone">Phone call</SelectItem>
                    <SelectItem value="custom">Custom location</SelectItem>
                    <SelectItem value="none">No location</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-[#5f6368]">
                  Google Meet links are created when you connect Google Calendar.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {locationType !== "google_meet" && locationType !== "none" && (
            <FormField
              control={form.control}
              name="locationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1f1f1f]">
                    {locationType === "in_person" ? "Address" : locationType === "phone" ? "Phone details" : "Location details"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Add directions or joining details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="questions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">Questions for invitees</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder={"What would you like to discuss?\nAnything I should prepare?"}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-[#5f6368]">
                  Add one question per line. Invitees answer these after choosing a time.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#1a73e8] hover:bg-[#1557b0]">
                Save Changes
              </Button>
            </div>

            <Dialog>
              <DialogTrigger render={
                <Button type="button" variant="ghost" className="rounded-full text-[#d93025] hover:bg-red-50 hover:text-[#d93025]" />
              }>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Event Type
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete Event Type</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this event type? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-3 sm:justify-end">
                  <DialogTrigger render={<Button variant="outline" className="rounded-full" />}>
                    Cancel
                  </DialogTrigger>
                  <Button variant="destructive" className="rounded-full" onClick={onDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </div>
  );
}
