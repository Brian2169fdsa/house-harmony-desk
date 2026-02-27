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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, AlertTriangle, CheckCircle2, Loader2, Calendar, Download } from "lucide-react";
import { format, addDays, startOfWeek, parseISO, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHIFT_COLORS = ["bg-blue-100 border-blue-300", "bg-green-100 border-green-300", "bg-purple-100 border-purple-300", "bg-orange-100 border-orange-300"];

export default function StaffScheduling() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart]       = useState(startOfWeek(new Date()));
  const [shiftOpen, setShiftOpen]       = useState(false);
  const [ptoOpen, setPtoOpen]           = useState(false);
  const [clockedIn, setClockedIn]       = useState<Record<string, string>>({}); // staffId -> entry id

  const [shiftForm, setShiftForm] = useState({
    staff_id: "", house_id: "", shift_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "08:00", end_time: "16:00", role: "", notes: "",
  });
  const [ptoForm, setPtoForm] = useState({
    staff_id: "", start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"), pto_type: "vacation", notes: "",
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("user_id, full_name, role, status")
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd   = weekDates[6];

  const { data: schedules = [] } = useQuery({
    queryKey: ["staff_schedules", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_schedules")
        .select("*")
        .gte("shift_date", format(weekStart, "yyyy-MM-dd"))
        .lte("shift_date", format(weekEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time_entries_recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .is("clock_out", null)
        .order("clock_in", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ptoRequests = [] } = useQuery({
    queryKey: ["pto_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pto_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // All completed time entries for payroll summary
  const { data: completedEntries = [] } = useQuery({
    queryKey: ["time_entries_completed", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .not("clock_out", "is", null)
        .gte("clock_in", format(weekStart, "yyyy-MM-dd"))
        .lte("clock_in", format(addDays(weekEnd, 1), "yyyy-MM-dd"));
      if (error) throw error;
      return data ?? [];
    },
  });

  const addShift = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_schedules").insert({
        staff_id:   shiftForm.staff_id,
        house_id:   shiftForm.house_id,
        shift_date: shiftForm.shift_date,
        start_time: shiftForm.start_time,
        end_time:   shiftForm.end_time,
        role:       shiftForm.role || null,
        notes:      shiftForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_schedules"] });
      setShiftOpen(false);
      toast.success("Shift added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const clockIn = useMutation({
    mutationFn: async ({ staffId, houseId }: { staffId: string; houseId: string }) => {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({ staff_id: staffId, house_id: houseId || null, clock_in: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id, vars) => {
      queryClient.invalidateQueries({ queryKey: ["time_entries_recent"] });
      setClockedIn((prev) => ({ ...prev, [vars.staffId]: id }));
      toast.success("Clocked in");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const clockOut = useMutation({
    mutationFn: async ({ entryId, staffId }: { entryId: string; staffId: string }) => {
      const entry = timeEntries.find((e: any) => e.id === entryId);
      const clockInTime  = entry ? parseISO(entry.clock_in) : new Date();
      const totalMinutes = differenceInMinutes(new Date(), clockInTime);
      const totalHours   = Math.max(0, (totalMinutes - (entry?.break_minutes ?? 0)) / 60);
      const { error } = await supabase.from("time_entries").update({
        clock_out:   new Date().toISOString(),
        total_hours: parseFloat(totalHours.toFixed(2)),
      }).eq("id", entryId);
      if (error) throw error;
      return staffId;
    },
    onSuccess: (staffId) => {
      queryClient.invalidateQueries({ queryKey: ["time_entries_recent"] });
      setClockedIn((prev) => { const n = { ...prev }; delete n[staffId]; return n; });
      toast.success("Clocked out");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const submitPTO = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pto_requests").insert({
        staff_id:   ptoForm.staff_id,
        start_date: ptoForm.start_date,
        end_date:   ptoForm.end_date,
        pto_type:   ptoForm.pto_type,
        notes:      ptoForm.notes || null,
        status:     "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pto_requests"] });
      setPtoOpen(false);
      toast.success("PTO request submitted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approvePTO = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("pto_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pto_requests"] });
      toast.success("PTO request updated");
    },
  });

  const exportCSV = () => {
    const rows = [
      ["Staff ID", "House", "Date", "Start", "End", "Role"],
      ...schedules.map((s: any) => [
        s.staff_id,
        houses.find((h: any) => h.id === s.house_id)?.name ?? s.house_id,
        s.shift_date, s.start_time, s.end_time, s.role ?? "",
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `shifts-week-${format(weekStart, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPayrollCSV = () => {
    const staffHours: Record<string, { name: string; regular: number; overtime: number }> = {};
    for (const entry of completedEntries) {
      const staff = staffProfiles.find((s: any) => s.user_id === entry.staff_id);
      const name = staff?.full_name ?? entry.staff_id;
      if (!staffHours[entry.staff_id]) staffHours[entry.staff_id] = { name, regular: 0, overtime: 0 };
      staffHours[entry.staff_id].regular += Number(entry.total_hours ?? 0);
    }
    // Calculate overtime (over 40h)
    for (const key of Object.keys(staffHours)) {
      const entry = staffHours[key];
      if (entry.regular > 40) {
        entry.overtime = entry.regular - 40;
        entry.regular = 40;
      }
    }
    const rows = [
      ["Employee Name", "Regular Hours", "Overtime Hours", "Total Hours"],
      ...Object.values(staffHours).map((s) => [
        s.name, s.regular.toFixed(2), s.overtime.toFixed(2), (s.regular + s.overtime).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${format(weekStart, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Payroll summary data
  const payrollSummary = staffProfiles.map((staff: any) => {
    const entries = completedEntries.filter((e: any) => e.staff_id === staff.user_id);
    const totalHrs = entries.reduce((s: number, e: any) => s + Number(e.total_hours ?? 0), 0);
    const regularHrs = Math.min(totalHrs, 40);
    const overtimeHrs = Math.max(0, totalHrs - 40);
    const shiftCount = schedules.filter((s: any) => s.staff_id === staff.user_id).length;
    return { id: staff.user_id, name: staff.full_name, role: staff.role, totalHrs, regularHrs, overtimeHrs, shiftCount, entryCount: entries.length };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Scheduling</h1>
          <p className="text-muted-foreground">Shifts, time tracking, and PTO management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={ptoOpen} onOpenChange={setPtoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Request PTO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>PTO Request</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Staff Member *</Label>
                  <Select value={ptoForm.staff_id} onValueChange={(v) => setPtoForm({ ...ptoForm, staff_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>
                      {staffProfiles.map((s: any) => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Start Date *</Label>
                    <Input type="date" value={ptoForm.start_date} onChange={(e) => setPtoForm({ ...ptoForm, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date *</Label>
                    <Input type="date" value={ptoForm.end_date} onChange={(e) => setPtoForm({ ...ptoForm, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={ptoForm.pto_type} onValueChange={(v) => setPtoForm({ ...ptoForm, pto_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["vacation","sick","personal","bereavement"].map((t) => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={ptoForm.notes} onChange={(e) => setPtoForm({ ...ptoForm, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPtoOpen(false)}>Cancel</Button>
                  <Button disabled={!ptoForm.staff_id || submitPTO.isPending} onClick={() => submitPTO.mutate()}>
                    {submitPTO.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Submit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule Shift</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Staff Member *</Label>
                  <Select value={shiftForm.staff_id} onValueChange={(v) => setShiftForm({ ...shiftForm, staff_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>
                      {staffProfiles.map((s: any) => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.full_name} — {s.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>House *</Label>
                  <Select value={shiftForm.house_id} onValueChange={(v) => setShiftForm({ ...shiftForm, house_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                    <SelectContent>
                      {houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Date *</Label>
                    <Input type="date" value={shiftForm.shift_date} onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Start</Label>
                    <Input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>End</Label>
                    <Input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Input value={shiftForm.role} onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })} placeholder="House Manager, Overnight Monitor..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShiftOpen(false)}>Cancel</Button>
                  <Button disabled={!shiftForm.staff_id || !shiftForm.house_id || addShift.isPending} onClick={() => addShift.mutate()}>
                    {addShift.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add Shift
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="timeclock">Time Clock</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
          <TabsTrigger value="pto">PTO Requests</TabsTrigger>
        </TabsList>

        {/* Weekly Calendar Grid */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Prev</Button>
            <span className="font-medium">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next →</Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 w-36">Staff</th>
                    {weekDates.map((d) => (
                      <th key={d.toISOString()} className="text-center p-3 min-w-[120px]">
                        <div>{DAYS[d.getDay()]}</div>
                        <div className="text-xs text-muted-foreground">{format(d, "MMM d")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No active staff profiles found.
                      </td>
                    </tr>
                  ) : (
                    staffProfiles.map((staff: any, si: number) => (
                      <tr key={staff.user_id} className="border-b hover:bg-muted/20">
                        <td className="p-3 font-medium text-xs">{staff.full_name}</td>
                        {weekDates.map((d) => {
                          const dateStr  = format(d, "yyyy-MM-dd");
                          const dayShifts = schedules.filter(
                            (s: any) => s.staff_id === staff.user_id && s.shift_date === dateStr
                          );
                          const hasShifts = dayShifts.length > 0;
                          return (
                            <td key={dateStr} className="p-2 align-top">
                              {dayShifts.map((shift: any, i: number) => (
                                <div key={shift.id} className={`rounded border p-1.5 mb-1 text-xs ${SHIFT_COLORS[si % SHIFT_COLORS.length]}`}>
                                  <p className="font-medium">{shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}</p>
                                  <p className="text-muted-foreground truncate">
                                    {houses.find((h: any) => h.id === shift.house_id)?.name ?? "—"}
                                  </p>
                                </div>
                              ))}
                              {!hasShifts && (
                                <div className="h-8 rounded border border-dashed border-muted flex items-center justify-center text-muted-foreground opacity-40">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Clock */}
        <TabsContent value="timeclock" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {staffProfiles.map((staff: any) => {
              const activeEntry = timeEntries.find((e: any) => e.staff_id === staff.user_id);
              const entryId     = clockedIn[staff.user_id] ?? activeEntry?.id;
              const isClockedIn = !!entryId;
              return (
                <Card key={staff.user_id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{staff.full_name}</p>
                      <p className="text-xs text-muted-foreground">{staff.role}</p>
                      {isClockedIn && activeEntry && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Clocked in at {format(parseISO(activeEntry.clock_in), "h:mm a")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isClockedIn ? (
                        <Button size="sm" variant="outline" onClick={() => clockIn.mutate({ staffId: staff.user_id, houseId: houses[0]?.id ?? "" })}>
                          <Clock className="h-4 w-4 mr-1" />Clock In
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => clockOut.mutate({ entryId, staffId: staff.user_id })}>
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />Clock Out
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {staffProfiles.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">No staff profiles found.</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Payroll Summary */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
            <Button variant="outline" size="sm" onClick={exportPayrollCSV}>
              <Download className="h-4 w-4 mr-2" />Export Payroll CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Employee</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-right p-3">Shifts</th>
                    <th className="text-right p-3">Clock Entries</th>
                    <th className="text-right p-3">Regular Hrs</th>
                    <th className="text-right p-3">OT Hrs</th>
                    <th className="text-right p-3">Total Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollSummary.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-muted-foreground">{s.role}</td>
                      <td className="p-3 text-right">{s.shiftCount}</td>
                      <td className="p-3 text-right">{s.entryCount}</td>
                      <td className="p-3 text-right">{s.regularHrs.toFixed(1)}</td>
                      <td className="p-3 text-right">
                        {s.overtimeHrs > 0 ? (
                          <span className="text-amber-600 font-medium">{s.overtimeHrs.toFixed(1)}</span>
                        ) : "0.0"}
                      </td>
                      <td className="p-3 text-right font-medium">{s.totalHrs.toFixed(1)}</td>
                    </tr>
                  ))}
                  {payrollSummary.length > 0 && (
                    <tr className="bg-muted/30 font-medium">
                      <td className="p-3" colSpan={4}>Totals</td>
                      <td className="p-3 text-right">{payrollSummary.reduce((s, e) => s + e.regularHrs, 0).toFixed(1)}</td>
                      <td className="p-3 text-right text-amber-600">{payrollSummary.reduce((s, e) => s + e.overtimeHrs, 0).toFixed(1)}</td>
                      <td className="p-3 text-right">{payrollSummary.reduce((s, e) => s + e.totalHrs, 0).toFixed(1)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PTO Requests */}
        <TabsContent value="pto" className="mt-4">
          <Card>
            <CardHeader><CardTitle>PTO Requests</CardTitle></CardHeader>
            <CardContent>
              {ptoRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No PTO requests yet.</p>
              ) : (
                <div className="divide-y">
                  {ptoRequests.map((req: any) => {
                    const staff = staffProfiles.find((s: any) => s.user_id === req.staff_id);
                    return (
                      <div key={req.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{staff?.full_name ?? req.staff_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {req.start_date} → {req.end_date} · {req.pto_type}
                          </p>
                          {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={req.status === "approved" ? "default" : req.status === "denied" ? "destructive" : "secondary"}>
                            {req.status}
                          </Badge>
                          {req.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => approvePTO.mutate({ id: req.id, status: "approved" })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => approvePTO.mutate({ id: req.id, status: "denied" })}>
                                Deny
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
