"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Target,
  Scale,
  ChevronRight,
  Loader2,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getGoals, upsertGoal, deleteGoal, submitGoals } from "@/actions/goals";
import { cn } from "@/lib/utils";
import { GoalStatus } from "@prisma/client";

const GoalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  thrustArea: z.string().min(1, "Thrust area is required"),
  uom: z.string().min(1, "Unit of measurement is required"),
  target: z.coerce.number().min(1),
  weightage: z.coerce.number().min(1).max(100),
});

type GoalFormValues = z.infer<typeof GoalSchema>;

interface GoalData {
  id: string;
  title: string;
  description: string | null;
  thrustArea: string;
  uom: string;
  target: number;
  weightage: number;
  status: GoalStatus;
  managerComment: string | null;
  isShared: boolean;
  sharedGoalId: string | null;
}

const THRUST_AREAS = [
  "Strategic Growth",
  "Operational Excellence",
  "Customer Satisfaction",
  "Innovation & Technology",
  "People & Culture",
  "Sustainability"
];

const UOMS = ["Percentage (%)", "Currency (USD)", "Count (Units)", "Time (Days)", "Score (1-10)"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalData | null>(null);

  const form = useForm<GoalFormValues>({
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

  useEffect(() => {
    let isMounted = true;
    const fetchGoals = async () => {
        try {
          const data = await getGoals();
          if (isMounted) setGoals(data as unknown as GoalData[]);
        } catch {
          toast.error("Failed to load goals. Please try again.");
        } finally {
          if (isMounted) setIsLoading(false);
        }
    };
    fetchGoals();
    return () => { isMounted = false; };
  }, []);

  const totalWeightage = useMemo(() => goals.reduce((sum, g) => sum + g.weightage, 0), [goals]);
  const isAllSubmitted = goals.length > 0 && goals.every(g => g.status !== "DRAFT" && g.status !== "REJECTED");
  const canSubmit = goals.length > 0 && totalWeightage === 100 && !isAllSubmitted;

  const onSubmit = async (values: GoalFormValues) => {
    try {
      const result = await upsertGoal(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(values.id ? "Goal updated successfully" : "New goal created");
      setIsDialogOpen(false);
      form.reset();
      setIsLoading(true);
      const data = await getGoals();
      setGoals(data as unknown as GoalData[]);
      setIsLoading(false);
    } catch {
      toast.error("An unexpected error occurred while saving.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal? This action cannot be undone.")) return;
    try {
      const result = await deleteGoal(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Goal removed");
      setIsLoading(true);
      const data = await getGoals();
      setGoals(data as unknown as GoalData[]);
      setIsLoading(false);
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const handleSubmitAll = async () => {
    setIsSubmitLoading(true);
    try {
      const result = await submitGoals();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("All goals submitted for manager review");
        setIsLoading(true);
        const data = await getGoals();
        setGoals(data as unknown as GoalData[]);
        setIsLoading(false);
      }
    } catch {
      toast.error("Submission failed. Please check your connection.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingGoal(null);
    form.reset({
      title: "",
      description: "",
      thrustArea: "",
      uom: "",
      target: 0,
      weightage: 10,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (goal: GoalData) => {
    if (goal.status === "APPROVED" || goal.status === "LOCKED" || goal.status === "PENDING_APPROVAL") {
      toast.error("This goal is locked and cannot be edited.");
      return;
    }
    setEditingGoal(goal);
    form.reset({
      id: goal.id,
      title: goal.title,
      description: goal.description || "",
      thrustArea: goal.thrustArea,
      uom: goal.uom,
      target: goal.target,
      weightage: goal.weightage,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Performance Goals</h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-lg">
            Define and align your strategic targets for the current performance cycle.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={openCreateDialog}
            disabled={goals.length >= 8 || isAllSubmitted || isLoading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 h-12 px-6 shadow-xl shadow-blue-500/20 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Goal Entry
          </Button>
          <Button 
            onClick={handleSubmitAll}
            disabled={!canSubmit || isSubmitLoading || isLoading}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white h-12 px-6 shadow-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Area */}
        <Card className="lg:col-span-2 border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden border border-slate-100">
          <CardHeader className="border-b border-slate-50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Portfolio of Goals</CardTitle>
                <CardDescription className="mt-1">Active strategic objectives and their current allocation.</CardDescription>
              </div>
              <Badge variant={goals.length >= 8 ? "destructive" : "secondary"} className="rounded-xl px-4 py-1 text-xs font-bold uppercase tracking-widest">
                {goals.length} of 8 Slots
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-6 animate-pulse">
                    <div className="h-12 w-12 bg-slate-100 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-slate-100 rounded" />
                      <div className="h-3 w-1/2 bg-slate-50 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                  </div>
                ))}
                <div className="text-center text-sm text-slate-400 pt-4">Synchronizing with secure vault...</div>
              </div>
            ) : goals.length === 0 ? (
              <div className="p-24 text-center flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 scale-150" />
                   <div className="relative h-20 w-20 bg-white border border-slate-100 shadow-xl rounded-3xl flex items-center justify-center">
                     <Target className="h-10 w-10 text-blue-600" />
                   </div>
                </div>
                <div className="space-y-2 max-w-sm">
                  <p className="text-slate-900 text-xl font-bold italic">No goals found</p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your goal portfolio is currently empty. Define your first strategic target to begin the performance cycle.
                  </p>
                </div>
                <Button variant="outline" onClick={openCreateDialog} className="rounded-xl border-slate-200 hover:bg-slate-50 h-11 px-8 font-bold">
                  Create First Entry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-50">
                      <TableHead className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Objective</TableHead>
                      <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Area</TableHead>
                      <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Target</TableHead>
                      <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Weight</TableHead>
                      <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.map((goal) => (
                      <TableRow key={goal.id} className="group border-slate-50 hover:bg-slate-50/50 transition-all duration-300">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                              goal.status === "DRAFT" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                            )}>
                              <BarChart3 className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 leading-none group-hover:text-blue-600 transition-colors">{goal.title}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  goal.status === "DRAFT" ? "warning" : 
                                  goal.status === "PENDING_APPROVAL" ? "info" : 
                                  goal.status === "APPROVED" || goal.status === "LOCKED" ? "success" : "destructive"
                                } className="text-[9px] h-4 font-black uppercase tracking-widest px-1.5 rounded-sm">
                                  {goal.status.replace('_', ' ')}
                                </Badge>
                                {goal.sharedGoalId && (
                                  <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-200 text-[9px] h-4 font-black uppercase tracking-widest px-1.5 rounded-sm">
                                    Shared
                                  </Badge>
                                )}
                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{goal.description || "No strategic context"}</span>
                              </div>
                              {goal.managerComment && (
                                <p className="text-[10px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  Manager: {goal.managerComment}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100/50 px-2 py-1 rounded-lg">
                            {goal.thrustArea}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold text-slate-700">
                          {goal.target} <span className="text-[10px] font-sans font-bold text-slate-400 ml-0.5">{goal.uom.split(' ')[0]}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <span className="font-black text-slate-900 text-sm">{goal.weightage}%</span>
                            <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full" style={{ width: `${goal.weightage}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          {((goal.status === "DRAFT" || goal.status === "REJECTED") && !goal.sharedGoalId) && (
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openEditDialog(goal)}
                                className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(goal.id)}
                                className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {(goal.status !== "DRAFT" && goal.status !== "REJECTED") || goal.sharedGoalId ? (
                            <ChevronRight className="h-4 w-4 text-slate-200 ml-auto" />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-8">
          {/* Allocation Card */}
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none" />
            
            <CardHeader className="relative z-10 p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                   <Scale className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Weightage Audit</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-8">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white tracking-tighter">{totalWeightage}</span>
                <span className="text-2xl font-bold text-slate-500">/ 100%</span>
              </div>
              
              <div className="space-y-4">
                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-white/5">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(37,99,235,0.5)]",
                      totalWeightage === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                    )}
                    style={{ width: `${Math.min(totalWeightage, 100)}%` }}
                  />
                </div>

                <div className={cn(
                  "p-5 rounded-[1.5rem] border transition-all duration-500",
                  totalWeightage === 100 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-blue-600/10 border-blue-600/20 text-blue-400"
                )}>
                  <div className="flex items-start gap-3">
                    {totalWeightage === 100 ? (
                      <CheckCircle2 className="h-6 w-6 shrink-0" />
                    ) : (
                      <AlertCircle className="h-6 w-6 shrink-0" />
                    )}
                    <p className="text-sm font-bold leading-relaxed">
                      {totalWeightage === 100 
                        ? "Perfect allocation! Your objectives are balanced and ready for submission." 
                        : `Resource gap: ${100 - totalWeightage}% weightage remaining for allocation.`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines Card */}
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.02)] rounded-3xl bg-white overflow-hidden border border-slate-100">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Enterprise Framework</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <ul className="space-y-4">
                {[
                  { label: "Goal Capacity", value: "Maximum 8 strategic items", icon: Target },
                  { label: "Minimum Impact", value: "10% weightage per goal", icon: Scale },
                  { label: "Full Alignment", value: "Aggregate must reach 100%", icon: CheckCircle2 },
                  { label: "Immutable State", value: "Locked after submission", icon: AlertCircle },
                ].map((rule, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <rule.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rule.label}</p>
                      <p className="text-xs font-bold text-slate-700">{rule.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Goal Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            <DialogTitle className="text-3xl font-black tracking-tight relative z-10">
              {editingGoal ? "Edit Strategic Goal" : "New Strategic Entry"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2 font-medium relative z-10">
              Define measurable parameters for your performance objective.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-10 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Objective Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Optimize Cloud Infrastructure Costs" {...field} className="h-14 rounded-2xl border-slate-200 focus:ring-blue-600 focus:border-blue-600 font-bold" />
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
                      <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Context & Impact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Explain the high-level business value..." {...field} className="h-14 rounded-2xl border-slate-200 font-medium" />
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
                            <SelectItem key={area} value={area} className="rounded-xl focus:bg-blue-50 focus:text-blue-600 font-bold py-3">{area}</SelectItem>
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
                      <FormLabel className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Measurement (UoM)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold">
                            <SelectValue placeholder="Select UoM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          {UOMS.map(uom => (
                            <SelectItem key={uom} value={uom} className="rounded-xl focus:bg-blue-50 focus:text-blue-600 font-bold py-3">{uom}</SelectItem>
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
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          className="h-14 rounded-2xl border-slate-200 font-black" 
                        />
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
                        <Input 
                          type="number" 
                          min="10" 
                          max="100" 
                          {...field} 
                          className="h-14 rounded-2xl border-slate-200 font-black" 
                        />
                      </FormControl>
                      <FormMessage className="font-bold text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-8 border-t border-slate-50 gap-4 flex items-center">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-8 font-bold text-slate-400 hover:text-slate-900">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 h-12 px-10 shadow-xl shadow-blue-500/20 font-bold ml-auto transition-all hover:scale-[1.05]">
                  {editingGoal ? "Apply Updates" : "Save Objective"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
