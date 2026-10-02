"use client";

import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { Plus, Trash2, X } from "lucide-react";
import { ConnectGoogleButton } from "@/components/connect-google-button";
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
  websiteReturnUrl: z.string().trim().max(2048).optional(),
  questions: z.array(z.object({
    text: z.string().max(300, "Keep each question under 300 characters"),
  })).max(10, "Add no more than 10 questions"),
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
  websiteReturnUrl: string | null;
  customQuestions: string;
}

export function EditEventTypeForm({ eventType }: { eventType: EventType }) {
  const router = useRouter();
  const draftStorageKey = `heycal:edit-event-type-draft:${eventType.id}`;
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
      websiteReturnUrl: eventType.websiteReturnUrl || "",
      questions: parseEventQuestions(eventType.customQuestions).map((text) => ({ text })),
    },
  });
  const locationType = useWatch({ control: form.control, name: "locationType" });
  const questionFields = useFieldArray({ control: form.control, name: "questions" });

  useEffect(() => {
    const savedDraft = sessionStorage.getItem(draftStorageKey);
    if (!savedDraft) return;

    try {
      const draft = formSchema.safeParse(JSON.parse(savedDraft));
      if (draft.success) form.reset(draft.data);
    } catch {
      sessionStorage.removeItem(draftStorageKey);
      return;
    }

    sessionStorage.removeItem(draftStorageKey);
  }, [draftStorageKey, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateEventType(eventType.id, {
        ...values,
        questions: values.questions.map(({ text }) => text),
      });
      sessionStorage.removeItem(draftStorageKey);
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
      sessionStorage.removeItem(draftStorageKey);
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
                  Your public Heycal booking URL will use: cal.heyclift.xyz/username/slug
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
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    {...field}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
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
                  <textarea
                    className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder="Brief description of the meeting"
                    {...field}
                  />
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
                {locationType === "google_meet" && (
                  <ConnectGoogleButton
                    beforeRedirect={() => sessionStorage.setItem(draftStorageKey, JSON.stringify(form.getValues()))}
                  />
                )}
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
            name="websiteReturnUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1f1f1f]">Website return URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://yourcompany.com/thanks" {...field} />
                </FormControl>
                <FormDescription className="text-xs text-[#5f6368]">
                  After booking, guests can return to this page. Website forms can prefill `name` and `email` on the booking URL.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-3">
            <div>
              <FormLabel className="text-[#1f1f1f]">Questions for invitees</FormLabel>
              <FormDescription className="mt-1 text-xs text-[#5f6368]">
                Invitees answer these after choosing a time. Add up to 10 questions.
              </FormDescription>
            </div>
            {questionFields.fields.map((question, index) => (
              <div className="flex items-start gap-2" key={question.id}>
                <FormField
                  control={form.control}
                  name={`questions.${index}.text`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input maxLength={300} placeholder={`Question ${index + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => questionFields.remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={questionFields.fields.length >= 10}
              onClick={() => questionFields.append({ text: "" })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add question
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => {
                sessionStorage.removeItem(draftStorageKey);
                router.back();
              }}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#6426d9] hover:bg-[#4b1cac]">
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
