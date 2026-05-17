"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Users, Loader2, Share2, Target, Scale, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { createSharedGoal } from "@/actions/goals";
import { Checkbox } from "@/components/ui/checkbox";

const GoalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thrustArea: z.string().min(1, "Thrust Area is required"),
  uom: z.string().min(1, "Unit of Measure is required"),
  target: z.coerce.number().min(1, "Target must be at least 1"),
  weightage: z.coerce.number().min(10, "Minimum weightage is 10%").max(100, "Maximum weightage is 100%"),
});

const THRUST_AREAS = [
  "Strategic Growth",
  "Operational Excellence",
  "Customer Satisfaction",
  "Innovation & Technology",
  "People & Culture",
  "Sustainability"
];

const UOMS = ["Percentage (%)", "Currency (USD)", "Count (Units)", "Time (Days)", "Score (1-10)"];

interface CreateSharedGoalModalProps {
  team: { id: string; name: string | null; email: string | null }[];
}

export function CreateSharedGoalModal({ team }: CreateSharedGoalModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const form = useForm<z.infer<typeof GoalSchema>>({
    resolver: zodResolver(GoalSchema),
    defaultValues: {
      title: "",
      description: "",
      thrustArea: "",
      uom: "",
      target: 0,
      weightage: 10,
    },
  });

  const onSubmit = async (values: z.infer<typeof GoalSchema>) => {
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee to assign this goal.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSharedGoal(values, selectedEmployees);
      if (result.success) {
        toast.success("Shared goal created and assigned successfully");
        setIsOpen(false);
        form.reset();
        setSelectedEmployees([]);
        window.location.reload(); // Refresh to show new goal
      } else {
        toast.error("Failed to create shared goal");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-12 px-6 shadow-xl shadow-indigo-500/20 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="h-5 w-5 mr-2" />
          Create Shared Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-10 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          <DialogTitle className="text-3xl font-black tracking-tight relative z-10 flex items-center gap-3">
            <Share2 className="h-8 w-8 text-indigo-400" />
            New Strategic Shared Objective
          </DialogTitle>
          <DialogDescription className="text-slate-400 mt-2 font-medium relative z-10">
            Create a master goal template and assign it to multiple team members simultaneously.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
              {/* Form Fields */}
              <div className="md:col-span-3 p-10 space-y-8 border-r border-slate-50">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Objective Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Corporate Sustainability Targets" {...field} className="h-14 rounded-2xl border-slate-200 font-bold" />
                        </FormControl>
                        <FormMessage className="font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Strategic Context</FormLabel>
                        <FormControl>
                          <Input placeholder="Organizational impact and alignment details..." {...field} className="h-14 rounded-2xl border-slate-200 font-medium" />
                        </FormControl>
                        <FormMessage className="font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thrustArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Strategic Area</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold">
                              <SelectValue placeholder="Select area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            {THRUST_AREAS.map(area => (
                              <SelectItem key={area} value={area} className="rounded-xl font-bold py-3">{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="uom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Measurement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold">
                              <SelectValue placeholder="Select UoM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            {UOMS.map(uom => (
                              <SelectItem key={uom} value={uom} className="rounded-xl font-bold py-3">{uom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Numeric Target</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} className="h-14 rounded-2xl border-slate-200 font-black" />
                        </FormControl>
                        <FormMessage className="font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Weightage %</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} className="h-14 rounded-2xl border-slate-200 font-black" />
                        </FormControl>
                        <FormMessage className="font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Employee Selection */}
              <div className="md:col-span-2 bg-slate-50/50 p-10 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                   <Users className="h-4 w-4 text-indigo-600" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Assign Recipients</h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  {team.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-xs font-bold text-slate-400 italic">No direct reports found</p>
                    </div>
                  ) : (
                    team.map((emp) => (
                      <div 
                        key={emp.id} 
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedEmployees.includes(emp.id) 
                          ? "bg-white border-indigo-200 shadow-sm" 
                          : "bg-transparent border-slate-100 hover:border-slate-200"
                        }`}
                        onClick={() => toggleEmployee(emp.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedEmployees.includes(emp.id) ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                          }`}>
                            {emp.name?.[0] || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                          </div>
                        </div>
                        <Checkbox 
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={() => toggleEmployee(emp.id)}
                          className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                   <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                      <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-indigo-900 leading-relaxed">
                        This objective will be added to the portfolio of {selectedEmployees.length} employees as a locked shared goal.
                      </p>
                   </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl h-12 px-8 font-bold text-slate-400">
                Discard
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white h-12 px-10 shadow-xl font-bold transition-all hover:scale-[1.05]">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Share2 className="h-5 w-5 mr-2" />}
                Deploy Shared Objective
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
