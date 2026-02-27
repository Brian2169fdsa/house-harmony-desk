import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Plus, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isToday, addDays, isBefore } from "date-fns";

const RESULT_COLORS: Record<string, string> = {
  pass: "bg-green-100 text-green-800",
  fail: "bg-red-100 text-red-800",
  dilute: "bg-orange-100 text-orange-800",
  refused: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
};

const RESULT_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  pass: "default",
  fail: "destructive",
  dilute: "secondary",
  refused: "destructive",
  pending: "outline",
};

export default function DrugTests() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form, setForm] = useState({
    residentId: "",
    testDate: new Date().toISOString().split("T")[0],
    testType: "random",
    result: "pending",
    notes: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    residentId: "",
    frequency: "weekly",
  });

  const { data: residents } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .eq("status", "Active")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tests } = useQuery({
    queryKey: ["drug_tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drug_tests")
        .select("*, residents(name)")
        .order("test_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["drug_test_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drug_test_schedules")
        .select("*, residents(name)")
        .eq("active", true)
        .order("next_test_date");
      if (error) throw error;
      return data || [];
    },
  });

  const recordTest = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase
        .from("drug_tests")
        .insert({
          resident_id: form.residentId,
          test_date: form.testDate,
          test_type: form.testType,
          result: form.result,
          notes: form.notes || null,
          administered_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-create incident on fail/refused
      if (form.result === "fail" || form.result === "refused") {
        const resident = residents?.find((r) => r.id === form.residentId);
        await supabase.from("incidents").insert({
          type: "Drug Test",
          resident_id: form.residentId,
          description: `Drug test ${form.result} — ${form.testType} test on ${form.testDate}`,
          severity: "high",
          status: "open",
          reported_by: user?.id ?? null,
        });
      }

      // Update schedule last/next test date
      const schedule = schedules?.find((s) => s.resident_id === form.residentId);
      if (schedule) {
        const nextDate = calculateNextTestDate(schedule.frequency, form.testDate);
        await supabase
          .from("drug_test_schedules")
          .update({ last_test_date: form.testDate, next_test_date: nextDate })
          .eq("id", schedule.id);
      }

      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drug_tests"] });
      queryClient.invalidateQueries({ queryKey: ["drug_test_schedules"] });
      toast({ title: "Test recorded" });
      setDialogOpen(false);
      setForm({ residentId: "", testDate: new Date().toISOString().split("T")[0], testType: "random", result: "pending", notes: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to record test", variant: "destructive" });
    },
  });

  const upsertSchedule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("drug_test_schedules")
        .upsert({
          resident_id: scheduleForm.residentId,
          frequency: scheduleForm.frequency,
          active: true,
          next_test_date: calculateNextTestDate(scheduleForm.frequency, new Date().toISOString().split("T")[0]),
        }, { onConflict: "resident_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drug_test_schedules"] });
      toast({ title: "Schedule saved" });
      setScheduleOpen(false);
      setScheduleForm({ residentId: "", frequency: "weekly" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to save schedule", variant: "destructive" });
    },
  });

  function calculateNextTestDate(frequency: string, fromDate: string): string {
    const base = new Date(fromDate);
    const daysMap: Record<string, number> = {
      daily: 1,
      twice_weekly: 3,
      three_times_weekly: 2,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    return addDays(base, daysMap[frequency] ?? 7).toISOString().split("T")[0];
  }

  const today = new Date().toISOString().split("T")[0];
  const testsToday = tests?.filter((t) => t.test_date === today).length ?? 0;
  const failedThisWeek = tests?.filter((t) => {
    const testDate = new Date(t.test_date);
    const weekAgo = addDays(new Date(), -7);
    return t.result === "fail" && testDate >= weekAgo;
  }).length ?? 0;
  const overdueSchedules = schedules?.filter((s) =>
    s.next_test_date && isBefore(new Date(s.next_test_date), new Date())
  ).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8" />
            Drug Testing
          </h1>
          <p className="text-muted-foreground">Track resident drug tests and schedules</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Set Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Set Testing Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Resident</Label>
                  <Select
                    value={scheduleForm.residentId}
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, residentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resident" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={scheduleForm.frequency}
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="three_times_weekly">3x per week</SelectItem>
                      <SelectItem value="twice_weekly">2x per week</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => upsertSchedule.mutate()}
                  disabled={!scheduleForm.residentId || upsertSchedule.isPending}
                >
                  Save Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Record Drug Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Resident *</Label>
                  <Select
                    value={form.residentId}
                    onValueChange={(v) => setForm({ ...form, residentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resident" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Test Date</Label>
                  <Input
                    type="date"
                    value={form.testDate}
                    onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Test Type</Label>
                  <Select
                    value={form.testType}
                    onValueChange={(v) => setForm({ ...form, testType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="for_cause">For Cause</SelectItem>
                      <SelectItem value="court_ordered">Court Ordered</SelectItem>
                      <SelectItem value="dot">DOT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Result</Label>
                  <Select
                    value={form.result}
                    onValueChange={(v) => setForm({ ...form, result: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="dilute">Dilute</SelectItem>
                      <SelectItem value="refused">Refused</SelectItem>
                      <SelectItem value="pending">Pending Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                {(form.result === "fail" || form.result === "refused") && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    An incident will be automatically created.
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={() => recordTest.mutate()}
                  disabled={!form.residentId || recordTest.isPending}
                >
                  {recordTest.isPending ? "Saving…" : "Record Test"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testsToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${failedThisWeek > 0 ? "text-destructive" : ""}`}>
              {failedThisWeek}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueSchedules > 0 ? "text-warning" : ""}`}>
              {overdueSchedules}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Test History</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests && tests.length > 0 ? (
                    tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">
                          {(test as any).residents?.name ?? "—"}
                        </TableCell>
                        <TableCell>{test.test_date}</TableCell>
                        <TableCell className="capitalize">{test.test_type.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant={RESULT_VARIANTS[test.result] ?? "outline"}>
                            {test.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {test.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No tests recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last Test</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules && schedules.length > 0 ? (
                    schedules.map((s) => {
                      const isOverdue =
                        s.next_test_date && isBefore(new Date(s.next_test_date), new Date());
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {(s as any).residents?.name ?? "—"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {s.frequency.replace("_", " ")}
                          </TableCell>
                          <TableCell>{s.last_test_date ?? "Never"}</TableCell>
                          <TableCell
                            className={isOverdue ? "text-destructive font-medium" : ""}
                          >
                            {s.next_test_date ?? "—"}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">Overdue</Badge>
                            ) : (
                              <Badge variant="default">On Track</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No schedules configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
