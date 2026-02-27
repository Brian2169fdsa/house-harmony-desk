import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import {
  FlaskConical,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
  DollarSign,
  Users,
  TrendingUp,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  addDays,
  isBefore,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subDays,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resident {
  id: string;
  name: string;
  status: string;
  program_phase: number | null;
  sobriety_date: string | null;
}

interface DrugTest {
  id: string;
  resident_id: string;
  test_date: string;
  test_type: string;
  result: string;
  administered_by: string | null;
  notes: string | null;
  created_at: string;
  chain_of_custody: boolean | null;
  lab_name: string | null;
  cost: number | null;
  residents: { name: string } | null;
}

interface DrugTestSchedule {
  id: string;
  resident_id: string;
  frequency: string;
  last_test_date: string | null;
  next_test_date: string | null;
  active: boolean;
  test_type: string | null;
  phase_based: boolean | null;
  residents: { name: string } | null;
}

interface RecordTestForm {
  residentId: string;
  testDate: string;
  testType: string;
  result: string;
  chainOfCustody: boolean;
  labName: string;
  cost: string;
  notes: string;
}

interface ScheduleForm {
  residentId: string;
  frequency: string;
  testType: string;
  phaseBased: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESULT_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  pass: "default",
  fail: "destructive",
  dilute: "secondary",
  refused: "destructive",
  pending: "outline",
};

const RESULT_LABEL: Record<string, string> = {
  pass: "Pass",
  fail: "Fail",
  dilute: "Dilute",
  refused: "Refused",
  pending: "Pending",
};

const TEST_TYPE_LABEL: Record<string, string> = {
  urine: "Urine",
  saliva: "Saliva",
  hair: "Hair",
  screening: "Screening",
  random: "Random",
  for_cause: "For Cause",
};

const FREQUENCY_LABEL: Record<string, string> = {
  "3x_week": "3x / week",
  "2x_week": "2x / week",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

const FREQUENCY_DAYS: Record<string, number> = {
  "3x_week": 2,
  "2x_week": 3,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

const PHASE_FREQUENCY: Record<number, string> = {
  1: "3x_week",
  2: "2x_week",
  3: "weekly",
};

const EMPTY_TEST_FORM: RecordTestForm = {
  residentId: "",
  testDate: new Date().toISOString().split("T")[0],
  testType: "urine",
  result: "pass",
  chainOfCustody: false,
  labName: "",
  cost: "",
  notes: "",
};

const EMPTY_SCHEDULE_FORM: ScheduleForm = {
  residentId: "",
  frequency: "weekly",
  testType: "urine",
  phaseBased: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateNextTestDate(frequency: string, fromDate: string): string {
  const days = FREQUENCY_DAYS[frequency] ?? 7;
  return format(addDays(new Date(fromDate), days), "yyyy-MM-dd");
}

function getStatusIndicator(nextTestDate: string | null): {
  color: string;
  label: string;
} {
  if (!nextTestDate) return { color: "bg-gray-400", label: "No schedule" };
  const next = new Date(nextTestDate);
  const now = new Date();
  if (isBefore(next, now)) return { color: "bg-red-500", label: "Overdue" };
  if (differenceInDays(next, now) <= 3) return { color: "bg-yellow-500", label: "Due soon" };
  return { color: "bg-green-500", label: "Current" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DrugTests() {
  const queryClient = useQueryClient();

  // Dialog state
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Forms
  const [testForm, setTestForm] = useState<RecordTestForm>({ ...EMPTY_TEST_FORM });
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({ ...EMPTY_SCHEDULE_FORM });

  // Search / filters
  const [historySearch, setHistorySearch] = useState("");

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  const { data: residents = [], isLoading: residentsLoading } = useQuery<Resident[]>({
    queryKey: ["residents-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, status, program_phase, sobriety_date")
        .eq("status", "Active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery<DrugTest[]>({
    queryKey: ["drug_tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drug_tests")
        .select("*, residents(name)")
        .order("test_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as DrugTest[]) ?? [];
    },
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<DrugTestSchedule[]>({
    queryKey: ["drug_test_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drug_test_schedules")
        .select("*, residents(name)")
        .eq("active", true)
        .order("next_test_date");
      if (error) throw error;
      return (data as DrugTestSchedule[]) ?? [];
    },
  });

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const testsThisMonth = useMemo(
    () =>
      tests.filter((t) =>
        isWithinInterval(new Date(t.test_date), { start: monthStart, end: monthEnd })
      ),
    [tests, monthStart, monthEnd]
  );

  const totalTestsThisMonth = testsThisMonth.length;

  const passRate = useMemo(() => {
    const completed = testsThisMonth.filter(
      (t) => t.result === "pass" || t.result === "fail"
    );
    if (completed.length === 0) return null;
    const passes = completed.filter((t) => t.result === "pass").length;
    return Math.round((passes / completed.length) * 100);
  }, [testsThisMonth]);

  const overdueCount = useMemo(
    () =>
      schedules.filter(
        (s) => s.next_test_date && isBefore(new Date(s.next_test_date), now)
      ).length,
    [schedules, now]
  );

  const costThisMonth = useMemo(
    () => testsThisMonth.reduce((sum, t) => sum + (t.cost ?? 0), 0),
    [testsThisMonth]
  );

  // Resident status list helpers
  const residentStatusList = useMemo(() => {
    return residents.map((r) => {
      const residentTests = tests.filter((t) => t.resident_id === r.id);
      const lastTest = residentTests.length > 0 ? residentTests[0] : null;
      const schedule = schedules.find((s) => s.resident_id === r.id);
      const status = getStatusIndicator(schedule?.next_test_date ?? null);
      return { resident: r, lastTest, schedule, status };
    });
  }, [residents, tests, schedules]);

  // Filtered history
  const filteredTests = useMemo(() => {
    if (!historySearch.trim()) return tests;
    const q = historySearch.toLowerCase();
    return tests.filter((t) => t.residents?.name?.toLowerCase().includes(q));
  }, [tests, historySearch]);

  // Statistics breakdowns
  const testsByType = useMemo(() => {
    const map: Record<string, number> = {};
    testsThisMonth.forEach((t) => {
      map[t.test_type] = (map[t.test_type] || 0) + 1;
    });
    return map;
  }, [testsThisMonth]);

  const passRateByMonth = useMemo(() => {
    const months: { label: string; rate: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ms = startOfMonth(d);
      const me = endOfMonth(d);
      const monthTests = tests.filter((t) =>
        isWithinInterval(new Date(t.test_date), { start: ms, end: me })
      );
      const completed = monthTests.filter(
        (t) => t.result === "pass" || t.result === "fail"
      );
      const passes = completed.filter((t) => t.result === "pass").length;
      months.push({
        label: format(d, "MMM yyyy"),
        rate: completed.length > 0 ? Math.round((passes / completed.length) * 100) : 0,
        count: monthTests.length,
      });
    }
    return months;
  }, [tests, now]);

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  const recordTestMutation = useMutation({
    mutationFn: async (form: RecordTestForm) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: inserted, error } = await supabase
        .from("drug_tests")
        .insert({
          resident_id: form.residentId,
          test_date: form.testDate,
          test_type: form.testType,
          result: form.result,
          notes: form.notes || null,
          administered_by: user?.id ?? null,
          chain_of_custody: form.chainOfCustody,
          lab_name: form.labName || null,
          cost: form.cost ? parseFloat(form.cost) : null,
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-create incident on fail / refused
      if (form.result === "fail" || form.result === "refused") {
        const resident = residents.find((r) => r.id === form.residentId);
        await supabase.from("incidents").insert({
          type: "Drug Test",
          resident_id: form.residentId,
          description: `Drug test ${form.result} - ${TEST_TYPE_LABEL[form.testType] ?? form.testType} test on ${format(new Date(form.testDate), "MMM d, yyyy")}${resident ? ` for ${resident.name}` : ""}`,
          severity: "high",
          status: "open",
          reported_by: user?.id ?? null,
        });
      }

      // Auto-update schedule last / next dates
      const schedule = schedules.find((s) => s.resident_id === form.residentId);
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
      toast.success("Test recorded successfully");
      setRecordDialogOpen(false);
      setTestForm({ ...EMPTY_TEST_FORM });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record test");
    },
  });

  const upsertScheduleMutation = useMutation({
    mutationFn: async (form: ScheduleForm) => {
      let freq = form.frequency;
      if (form.phaseBased) {
        const resident = residents.find((r) => r.id === form.residentId);
        const phase = resident?.program_phase ?? 1;
        freq = PHASE_FREQUENCY[phase] ?? "weekly";
      }

      const { error } = await supabase.from("drug_test_schedules").upsert(
        {
          resident_id: form.residentId,
          frequency: freq,
          test_type: form.testType,
          phase_based: form.phaseBased,
          active: true,
          next_test_date: calculateNextTestDate(freq, new Date().toISOString().split("T")[0]),
        },
        { onConflict: "resident_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drug_test_schedules"] });
      toast.success("Schedule saved successfully");
      setScheduleDialogOpen(false);
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save schedule");
    },
  });

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  function openRecordDialogForResident(residentId: string) {
    setTestForm({ ...EMPTY_TEST_FORM, residentId });
    setRecordDialogOpen(true);
  }

  function handleRecordTest() {
    if (!testForm.residentId) {
      toast.error("Please select a resident");
      return;
    }
    recordTestMutation.mutate(testForm);
  }

  function handleSaveSchedule() {
    if (!scheduleForm.residentId) {
      toast.error("Please select a resident");
      return;
    }
    upsertScheduleMutation.mutate(scheduleForm);
  }

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  const isLoading = residentsLoading || testsLoading || schedulesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <FlaskConical className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading drug testing data...</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8" />
            Drug Testing
          </h1>
          <p className="text-muted-foreground">
            Comprehensive drug testing tracker and schedule management
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Set Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Set Testing Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Resident</Label>
                  <Select
                    value={scheduleForm.residentId}
                    onValueChange={(v) =>
                      setScheduleForm({ ...scheduleForm, residentId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resident" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                          {r.program_phase ? ` (Phase ${r.program_phase})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Phase-Based Frequency</Label>
                    <p className="text-xs text-muted-foreground">
                      Auto-set frequency based on program phase
                    </p>
                  </div>
                  <Switch
                    checked={scheduleForm.phaseBased}
                    onCheckedChange={(checked) =>
                      setScheduleForm({ ...scheduleForm, phaseBased: checked })
                    }
                  />
                </div>

                {scheduleForm.phaseBased && (
                  <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                    <p className="font-medium">Phase-based schedule:</p>
                    <p>Phase 1: 3x per week</p>
                    <p>Phase 2: 2x per week</p>
                    <p>Phase 3: Weekly</p>
                  </div>
                )}

                {!scheduleForm.phaseBased && (
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={scheduleForm.frequency}
                      onValueChange={(v) =>
                        setScheduleForm({ ...scheduleForm, frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3x_week">3x per week</SelectItem>
                        <SelectItem value="2x_week">2x per week</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select
                    value={scheduleForm.testType}
                    onValueChange={(v) =>
                      setScheduleForm({ ...scheduleForm, testType: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urine">Urine</SelectItem>
                      <SelectItem value="saliva">Saliva</SelectItem>
                      <SelectItem value="hair">Hair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveSchedule}
                  disabled={!scheduleForm.residentId || upsertScheduleMutation.isPending}
                >
                  {upsertScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Drug Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Resident *</Label>
                  <Select
                    value={testForm.residentId}
                    onValueChange={(v) => setTestForm({ ...testForm, residentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resident" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Date</Label>
                  <Input
                    type="date"
                    value={testForm.testDate}
                    onChange={(e) =>
                      setTestForm({ ...testForm, testDate: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Type</Label>
                    <Select
                      value={testForm.testType}
                      onValueChange={(v) =>
                        setTestForm({ ...testForm, testType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urine">Urine</SelectItem>
                        <SelectItem value="saliva">Saliva</SelectItem>
                        <SelectItem value="hair">Hair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Result</Label>
                    <Select
                      value={testForm.result}
                      onValueChange={(v) =>
                        setTestForm({ ...testForm, result: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="dilute">Dilute</SelectItem>
                        <SelectItem value="refused">Refused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="chain-of-custody"
                    checked={testForm.chainOfCustody}
                    onCheckedChange={(checked) =>
                      setTestForm({
                        ...testForm,
                        chainOfCustody: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="chain-of-custody" className="text-sm font-normal">
                    Chain of Custody documented
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lab Name</Label>
                    <Input
                      value={testForm.labName}
                      onChange={(e) =>
                        setTestForm({ ...testForm, labName: e.target.value })
                      }
                      placeholder="Lab name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={testForm.cost}
                      onChange={(e) =>
                        setTestForm({ ...testForm, cost: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={testForm.notes}
                    onChange={(e) =>
                      setTestForm({ ...testForm, notes: e.target.value })
                    }
                    placeholder="Optional notes..."
                    rows={3}
                  />
                </div>

                {(testForm.result === "fail" || testForm.result === "refused") && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    An incident will be automatically created for this result.
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleRecordTest}
                  disabled={!testForm.residentId || recordTestMutation.isPending}
                >
                  {recordTestMutation.isPending ? "Saving..." : "Record Test"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Statistics Dashboard */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tests This Month
            </CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTestsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(monthStart, "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pass Rate
            </CardTitle>
            {passRate !== null && passRate >= 80 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                passRate === null
                  ? "text-muted-foreground"
                  : passRate >= 80
                    ? "text-green-600"
                    : "text-red-600"
              }`}
            >
              {passRate !== null ? `${passRate}%` : "N/A"}
            </div>
            {passRate !== null && (
              <Progress
                value={passRate}
                className="mt-2 h-1.5"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tests
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : ""}`}
            >
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueCount > 0 ? "Require immediate attention" : "All tests on schedule"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Testing Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(monthStart, "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Tabs */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue="residents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="residents" className="gap-1.5">
            <Users className="h-4 w-4" />
            Residents
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* =============================================================== */}
        {/* TAB: Residents */}
        {/* =============================================================== */}
        <TabsContent value="residents" className="space-y-4">
          {residentStatusList.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active residents found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {residentStatusList.map(({ resident, lastTest, schedule, status }) => (
                <Card key={resident.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">
                          {resident.name}
                        </CardTitle>
                        {resident.program_phase && (
                          <Badge variant="outline" className="text-xs">
                            Phase {resident.program_phase}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${status.color}`}
                          title={status.label}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Test:</span>
                        <span>
                          {lastTest
                            ? format(new Date(lastTest.test_date), "MMM d, yyyy")
                            : "Never tested"}
                        </span>
                      </div>
                      {lastTest && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Result:</span>
                          <Badge variant={RESULT_VARIANTS[lastTest.result] ?? "outline"}>
                            {RESULT_LABEL[lastTest.result] ?? lastTest.result}
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next Due:</span>
                        <span
                          className={
                            status.color === "bg-red-500"
                              ? "text-red-600 font-medium"
                              : status.color === "bg-yellow-500"
                                ? "text-yellow-600 font-medium"
                                : ""
                          }
                        >
                          {schedule?.next_test_date
                            ? format(new Date(schedule.next_test_date), "MMM d, yyyy")
                            : "No schedule"}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      variant="outline"
                      onClick={() => openRecordDialogForResident(resident.id)}
                    >
                      <FlaskConical className="mr-2 h-3.5 w-3.5" />
                      Record Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =============================================================== */}
        {/* TAB: History */}
        {/* =============================================================== */}
        <TabsContent value="history" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by resident name..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Chain of Custody</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">
                          {test.residents?.name ?? "--"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(test.test_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {TEST_TYPE_LABEL[test.test_type] ?? test.test_type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={RESULT_VARIANTS[test.result] ?? "outline"}>
                            {RESULT_LABEL[test.result] ?? test.result}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {test.chain_of_custody ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {test.lab_name ?? "--"}
                        </TableCell>
                        <TableCell>
                          {test.cost != null ? `$${test.cost.toFixed(2)}` : "--"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {test.notes ?? "--"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        {historySearch
                          ? "No tests match your search"
                          : "No tests recorded yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* TAB: Schedules */}
        {/* =============================================================== */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Last Test</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Phase-Based</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.length > 0 ? (
                    schedules.map((s) => {
                      const isOverdue =
                        s.next_test_date &&
                        isBefore(new Date(s.next_test_date), now);
                      const isDueSoon =
                        s.next_test_date &&
                        !isOverdue &&
                        differenceInDays(new Date(s.next_test_date), now) <= 3;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.residents?.name ?? "--"}
                          </TableCell>
                          <TableCell>
                            {FREQUENCY_LABEL[s.frequency] ??
                              s.frequency.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="capitalize">
                            {s.test_type
                              ? TEST_TYPE_LABEL[s.test_type] ?? s.test_type
                              : "--"}
                          </TableCell>
                          <TableCell>
                            {s.last_test_date
                              ? format(new Date(s.last_test_date), "MMM d, yyyy")
                              : "Never"}
                          </TableCell>
                          <TableCell
                            className={
                              isOverdue
                                ? "text-red-600 font-medium"
                                : isDueSoon
                                  ? "text-yellow-600 font-medium"
                                  : ""
                            }
                          >
                            {s.next_test_date
                              ? format(new Date(s.next_test_date), "MMM d, yyyy")
                              : "--"}
                          </TableCell>
                          <TableCell>
                            {s.phase_based ? (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                Phase-based
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">Overdue</Badge>
                            ) : isDueSoon ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                Due Soon
                              </Badge>
                            ) : (
                              <Badge variant="default">On Track</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No schedules configured. Click "Set Schedule" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* TAB: Statistics */}
        {/* =============================================================== */}
        <TabsContent value="statistics" className="space-y-6">
          {/* Pass Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pass Rate Trend (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {passRateByMonth.length > 0 ? (
                <div className="space-y-4">
                  {passRateByMonth.map((month) => (
                    <div key={month.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.label}</span>
                        <span className="text-muted-foreground">
                          {month.count} tests |{" "}
                          <span
                            className={
                              month.rate >= 80
                                ? "text-green-600 font-medium"
                                : month.rate > 0
                                  ? "text-red-600 font-medium"
                                  : "text-muted-foreground"
                            }
                          >
                            {month.count > 0 ? `${month.rate}% pass` : "No data"}
                          </span>
                        </span>
                      </div>
                      <Progress
                        value={month.count > 0 ? month.rate : 0}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No test data available
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Tests by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  Tests by Type (This Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(testsByType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(testsByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const percentage =
                          totalTestsThisMonth > 0
                            ? Math.round((count / totalTestsThisMonth) * 100)
                            : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize">
                                {TEST_TYPE_LABEL[type] ?? type.replace(/_/g, " ")}
                              </span>
                              <span className="text-muted-foreground">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No tests this month
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cost Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Cost This Month
                    </span>
                    <span className="text-lg font-bold">
                      ${costThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Tests This Month
                    </span>
                    <span className="text-lg font-bold">{totalTestsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Average Cost per Test
                    </span>
                    <span className="text-lg font-bold">
                      {totalTestsThisMonth > 0
                        ? `$${(costThisMonth / totalTestsThisMonth).toFixed(2)}`
                        : "$0.00"}
                    </span>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium">Monthly Cost Trend</p>
                    {passRateByMonth.map((month) => {
                      const mStart = startOfMonth(
                        new Date(month.label + " 1")
                      );
                      const mEnd = endOfMonth(mStart);
                      const monthCost = tests
                        .filter((t) =>
                          isWithinInterval(new Date(t.test_date), {
                            start: mStart,
                            end: mEnd,
                          })
                        )
                        .reduce((sum, t) => sum + (t.cost ?? 0), 0);
                      return (
                        <div
                          key={month.label}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {month.label}
                          </span>
                          <span>
                            ${monthCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Overall Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{tests.length}</p>
                  <p className="text-sm text-muted-foreground">Total Tests (All Time)</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{residents.length}</p>
                  <p className="text-sm text-muted-foreground">Active Residents</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{schedules.length}</p>
                  <p className="text-sm text-muted-foreground">Active Schedules</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    ${tests
                      .reduce((sum, t) => sum + (t.cost ?? 0), 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Cost (All Time)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
