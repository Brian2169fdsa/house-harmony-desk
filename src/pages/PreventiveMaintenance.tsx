import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { format, parseISO, addDays, isAfter, isBefore, differenceInDays } from "date-fns";
import { toast } from "sonner";

export default function PreventiveMaintenance() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    house_id: "",
    task_name: "",
    description: "",
    frequency_days: "90",
    next_due: format(new Date(), "yyyy-MM-dd"),
    estimated_cost: "",
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("id, name").eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["preventive_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preventive_schedules")
        .select("*, houses(name), vendors(name)")
        .order("next_due");
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date();
  const overdue   = schedules.filter((s: any) => isBefore(parseISO(s.next_due), today));
  const dueSoon   = schedules.filter((s: any) => {
    const d = parseISO(s.next_due);
    return !isBefore(d, today) && isBefore(d, addDays(today, 30));
  });
  const upcoming  = schedules.filter((s: any) => isAfter(parseISO(s.next_due), addDays(today, 30)));

  const addSchedule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("preventive_schedules").insert({
        house_id:       form.house_id || null,
        task_name:      form.task_name,
        description:    form.description || null,
        frequency_days: parseInt(form.frequency_days, 10),
        next_due:       form.next_due,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preventive_schedules"] });
      setDialogOpen(false);
      setForm({ house_id: "", task_name: "", description: "", frequency_days: "90", next_due: format(new Date(), "yyyy-MM-dd"), estimated_cost: "" });
      toast.success("Preventive task scheduled");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markComplete = useMutation({
    mutationFn: async (schedule: any) => {
      const nextDue = format(addDays(new Date(), schedule.frequency_days), "yyyy-MM-dd");
      const { error } = await supabase
        .from("preventive_schedules")
        .update({ last_completed: format(new Date(), "yyyy-MM-dd"), next_due: nextDue })
        .eq("id", schedule.id);
      if (error) throw error;
      // Auto-create a maintenance request for the completion record
      const { error: reqErr } = await supabase.from("maintenance_requests").insert({
        title:       `[Preventive] ${schedule.task_name}`,
        description: schedule.description ?? `Completed preventive maintenance task: ${schedule.task_name}`,
        priority:    "low",
        status:      "completed",
        house_id:    schedule.house_id,
        vendor_id:   schedule.assigned_vendor_id ?? null,
      });
      if (reqErr) console.warn("Could not create maintenance request:", reqErr.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preventive_schedules"] });
      toast.success("Task marked complete — next due date updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("preventive_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preventive_schedules"] });
      toast.success("Schedule removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  function ScheduleCard({ schedule, urgency }: { schedule: any; urgency: "overdue" | "soon" | "upcoming" }) {
    const daysUntil = differenceInDays(parseISO(schedule.next_due), today);
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{schedule.task_name}</p>
            <p className="text-xs text-muted-foreground">
              {(schedule.houses as any)?.name ?? "All Houses"} · Every {schedule.frequency_days} days
            </p>
          </div>
          <Badge variant={urgency === "overdue" ? "destructive" : urgency === "soon" ? "secondary" : "outline"}>
            {urgency === "overdue"
              ? `${Math.abs(daysUntil)}d overdue`
              : urgency === "soon"
              ? `In ${daysUntil}d`
              : format(parseISO(schedule.next_due), "MMM d")}
          </Badge>
        </div>
        {schedule.description && (
          <p className="text-sm text-muted-foreground">{schedule.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {schedule.last_completed
              ? `Last: ${format(parseISO(schedule.last_completed), "MMM d, yyyy")}`
              : "Never completed"}
          </span>
          {schedule.estimated_cost && <span>Est. ${schedule.estimated_cost}</span>}
        </div>
        {(schedule.vendors as any)?.name && (
          <p className="text-xs">Vendor: {(schedule.vendors as any).name}</p>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => markComplete.mutate(schedule)}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />Mark Done
          </Button>
          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(schedule.id)}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Preventive Maintenance</h1>
          <p className="text-muted-foreground">Recurring task schedules across all properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Preventive Task</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Task Name *</Label>
                <Input value={form.task_name} onChange={(e) => setForm({ ...form, task_name: e.target.value })} placeholder="HVAC Filter Replacement" />
              </div>
              <div className="space-y-1">
                <Label>House</Label>
                <Select value={form.house_id} onValueChange={(v) => setForm({ ...form, house_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All houses / General" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Houses</SelectItem>
                    {houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Frequency (days) *</Label>
                  <Select value={form.frequency_days} onValueChange={(v) => setForm({ ...form, frequency_days: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Monthly (30)</SelectItem>
                      <SelectItem value="60">Every 2 months (60)</SelectItem>
                      <SelectItem value="90">Quarterly (90)</SelectItem>
                      <SelectItem value="180">Semi-annual (180)</SelectItem>
                      <SelectItem value="365">Annual (365)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Next Due *</Label>
                  <Input type="date" value={form.next_due} onChange={(e) => setForm({ ...form, next_due: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Estimated Cost ($)</Label>
                <Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button disabled={!form.task_name || !form.next_due || addSchedule.isPending} onClick={() => addSchedule.mutate()}>
                  {addSchedule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
              <p className="text-sm text-muted-foreground">Overdue Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{dueSoon.length}</p>
              <p className="text-sm text-muted-foreground">Due Within 30 Days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-muted-foreground">Scheduled Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />Overdue ({overdue.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {overdue.map((s: any) => <ScheduleCard key={s.id} schedule={s} urgency="overdue" />)}
              </div>
            </div>
          )}
          {dueSoon.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-yellow-700 mb-3">Due Within 30 Days ({dueSoon.length})</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {dueSoon.map((s: any) => <ScheduleCard key={s.id} schedule={s} urgency="soon" />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {upcoming.map((s: any) => <ScheduleCard key={s.id} schedule={s} urgency="upcoming" />)}
              </div>
            </div>
          )}
          {schedules.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No preventive tasks scheduled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add tasks like HVAC filters, pest control, and annual inspections.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
