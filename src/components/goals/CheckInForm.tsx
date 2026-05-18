"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Calculator } from "lucide-react";

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
  uom: string;
  target: number;
  onSuccess?: () => void;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
}

export function CheckInForm({ goalId, uom, target, onSuccess, defaultValues }: CheckInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actualAchievement, setActualAchievement] = useState<number>(0);

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

  // --- BRD Requirement: Progress Calculation Formulas (Section 2.2) ---
  useEffect(() => {
    let computedProgress = 0;
    const uomLower = uom.toLowerCase();
    
    if (uomLower.includes("percentage") || uomLower.includes("currency") || uomLower.includes("count")) {
      // "Higher is better" - BRD Formula: Achievement ÷ Target
      computedProgress = target > 0 ? (actualAchievement / target) * 100 : 0;
    } else if (uomLower.includes("time") || uomLower.includes("days")) {
       // "Lower is better" - BRD Formula: Target ÷ Achievement
       computedProgress = actualAchievement > 0 ? (target / actualAchievement) * 100 : 0;
    } else if (uomLower.includes("zero")) {
       // Zero = Success - BRD Logic: If 0 → 100%, else 0%
       computedProgress = actualAchievement === 0 ? 100 : 0;
    } else {
       // Default fallback
       computedProgress = target > 0 ? (actualAchievement / target) * 100 : 0;
    }

    const cappedProgress = Math.min(Math.max(Math.round(computedProgress), 0), 100);
    form.setValue("progress", cappedProgress);
    
    // Auto-status suggestion
    if (cappedProgress === 100) {
      form.setValue("status", CheckInStatus.COMPLETED);
    } else if (cappedProgress < 40) {
      form.setValue("status", CheckInStatus.DELAYED);
    } else if (cappedProgress < 75) {
      form.setValue("status", CheckInStatus.AT_RISK);
    } else {
      form.setValue("status", CheckInStatus.ON_TRACK);
    }
  }, [actualAchievement, target, uom, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await submitCheckIn(values);
      if (result.success) {
        toast.success("Check-in saved successfully.");
        onSuccess?.();
      } else {
        toast.error(result.error || "Unable to save check-in. Please review your inputs and try again.");
      }
    } catch {
      toast.error("Unable to save check-in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Goal Metric</p>
           <div className="flex justify-between items-baseline">
              <p className="text-sm font-bold text-slate-700">{uom}</p>
              <p className="text-xs font-medium text-slate-500">Target: <span className="text-slate-900 font-bold">{target}</span></p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quarter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quarter</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value.toString()}
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
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Actual Achievement
              <Calculator className="h-3 w-3 text-blue-500" />
            </FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter raw value"
                onChange={(e) => setActualAchievement(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>Computed from UoM formula</FormDescription>
          </FormItem>

          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Computed Progress (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" {...field} readOnly className="bg-slate-50 font-bold text-blue-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
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
