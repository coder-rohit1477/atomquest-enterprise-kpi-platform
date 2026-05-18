"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { addManagerFeedback } from "@/actions/check-ins";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

const formSchema = z.object({
  checkInId: z.string(),
  comment: z.string().min(5, "Feedback must be at least 5 characters"),
  isConcern: z.boolean().default(false),
  requestUpdate: z.boolean().default(false),
});

interface ManagerFeedbackFormProps {
  checkInId: string;
  onSuccess?: () => void;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
}

export function ManagerFeedbackForm({ checkInId, onSuccess, defaultValues }: ManagerFeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkInId,
      comment: defaultValues?.comment || "",
      isConcern: defaultValues?.isConcern || false,
      requestUpdate: defaultValues?.requestUpdate || false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await addManagerFeedback(values);
      if (result.success) {
        toast.success("Feedback submitted successfully");
        onSuccess?.();
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manager Comments</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide feedback on progress, achievements, or areas for improvement..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-2">
          <FormField
            control={form.control}
            name="isConcern"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FormLabel>Flag Concern</FormLabel>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <FormDescription>
                    Mark this check-in as a potential risk to goal completion.
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
            name="requestUpdate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Request Update / Rework</FormLabel>
                  <FormDescription>
                    Ask the employee to provide more details or revise their check-in.
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
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Feedback
        </Button>
      </form>
    </Form>
  );
}
