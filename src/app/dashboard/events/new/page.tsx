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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEventType } from "@/actions/event-types";
import { Plus, X } from "lucide-react";
import { ConnectGoogleButton } from "@/components/connect-google-button";

const draftStorageKey = "heycal:new-event-type-draft";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  locationType: z.enum(["google_meet", "in_person", "phone", "custom", "none"]),
  locationDetails: z.string().optional(),
  websiteReturnUrl: z.string().trim().max(2048).optional(),
  questions: z.array(z.object({
    text: z.string().max(300, "Keep each question under 300 characters"),
  })).max(10, "Add no more than 10 questions"),
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
      websiteReturnUrl: "",
      questions: [{ text: "" }],
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
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createEventType({
        ...values,
        questions: values.questions.map(({ text }) => text),
      });
      sessionStorage.removeItem(draftStorageKey);
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
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => {
                sessionStorage.removeItem(draftStorageKey);
                router.back();
              }}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#6426d9] hover:bg-[#4b1cac]">
                Create Event Type
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
