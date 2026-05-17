"use client";

import { useState } from "react";
import { CheckInStatus } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitCheckIn } from "@/actions/check-ins";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  goalId: z.string(),
  quarter: z.coerce.number().min(1).max(4),
  year: z.coerce.number(),
  progress: z.coerce.number().min(0).max(100),
  accomplishments: z.string().min(10, "Please provide more details"),
  challenges: z.string().optional(),
  nextSteps: z.string().optional(),
  status: z.nativeEnum(CheckInStatus),
});

interface CheckInFormProps {
  goalId: string;
  goalTitle: string;
  onSuccess?: () => void;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
}

export function CheckInForm({ goalId, goalTitle, onSuccess, defaultValues }: CheckInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalId,
      quarter: defaultValues?.quarter || 1,
      year: defaultValues?.year || new Date().getFullYear(),
      progress: defaultValues?.progress || 0,
      accomplishments: defaultValues?.accomplishments || "",
      challenges: defaultValues?.challenges || "",
      nextSteps: defaultValues?.nextSteps || "",
      status: defaultValues?.status || CheckInStatus.ON_TRACK,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await submitCheckIn(values);
      if (result.success) {
        toast.success("Check-in submitted successfully");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to submit check-in");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quarter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quarter</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Q1</SelectItem>
                    <SelectItem value="2">Q2</SelectItem>
                    <SelectItem value="3">Q3</SelectItem>
                    <SelectItem value="4">Q4</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" {...field} />
                </FormControl>
                <FormDescription>Current completion percentage</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CheckInStatus.ON_TRACK}>On Track</SelectItem>
                    <SelectItem value={CheckInStatus.AT_RISK}>At Risk</SelectItem>
                    <SelectItem value={CheckInStatus.DELAYED}>Delayed</SelectItem>
                    <SelectItem value={CheckInStatus.COMPLETED}>Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accomplishments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strategic Accomplishments</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detail key milestones achieved and value delivered during this period..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="challenges"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operational Blockers</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Identify critical dependencies or obstacles hindering progress..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextSteps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Quarter Roadmap</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Outline high-priority initiatives and tactical plans for the upcoming cycle..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Check-In
        </Button>
      </form>
    </Form>
  );
}
