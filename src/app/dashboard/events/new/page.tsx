"use client";

import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEventType } from "@/actions/event-types";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  locationType: z.enum(["google_meet", "in_person", "phone", "custom", "none"]),
  locationDetails: z.string().optional(),
  questions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 30,
      slug: "",
      locationType: "google_meet",
      locationDetails: "",
      questions: "",
    },
  });
  const locationType = useWatch({ control: form.control, name: "locationType" });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createEventType(values);
      toast.success("Event type created!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-[#1f1f1f]">Create New Event Type</h1>
        <p className="text-sm text-[#5f6368]">Configure a new type of meeting for your guests.</p>
      </div>

      <div className="google-card p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#1a73e8] hover:bg-[#1557b0]">
                Create Event Type
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
