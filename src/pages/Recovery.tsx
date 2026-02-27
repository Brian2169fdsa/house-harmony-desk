import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Heart, Plus, Briefcase, Scale, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/contexts/UserRoleContext";

export default function Recovery() {
  const queryClient = useQueryClient();
  const { isManager } = useUserRole();

  const [meetingOpen, setMeetingOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [employOpen, setEmployOpen] = useState(false);

  const [meetingForm, setMeetingForm] = useState({
    residentId: "", meetingType: "aa", meetingDate: new Date().toISOString().split("T")[0],
    meetingName: "", verified: false, notes: "",
  });
  const [courtForm, setCourtForm] = useState({
    residentId: "", requirementType: "", frequency: "", officerName: "",
    officerPhone: "", officerEmail: "", nextCheckInDate: "", notes: "",
  });
  const [employForm, setEmployForm] = useState({
    residentId: "", employer: "", position: "", startDate: "",
    hourlyRate: "", verified: false, notes: "",
  });

  const { data: residents } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: meetings } = useQuery({
    queryKey: ["meeting_attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_attendance")
        .select("*, residents(name)")
        .order("meeting_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: courtReqs } = useQuery({
    queryKey: ["court_requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_requirements")
        .select("*, residents(name)")
        .eq("active", true)
        .order("next_check_in_date");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: employment } = useQuery({
    queryKey: ["employment_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employment_records")
        .select("*, residents(name)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: phaseRules } = useQuery({
    queryKey: ["program_phase_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_phase_rules")
        .select("*")
        .order("phase_number");
      if (error) throw error;
      return data || [];
    },
  });

  const logMeeting = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("meeting_attendance").insert({
        resident_id: meetingForm.residentId,
        meeting_type: meetingForm.meetingType,
        meeting_date: meetingForm.meetingDate,
        meeting_name: meetingForm.meetingName || null,
        verified: meetingForm.verified,
        notes: meetingForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting_attendance"] });
      toast({ title: "Meeting logged" });
      setMeetingOpen(false);
      setMeetingForm({ residentId: "", meetingType: "aa", meetingDate: new Date().toISOString().split("T")[0], meetingName: "", verified: false, notes: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to log meeting", variant: "destructive" });
    },
  });

  const addCourtReq = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("court_requirements").insert({
        resident_id: courtForm.residentId,
        requirement_type: courtForm.requirementType,
        frequency: courtForm.frequency || null,
        officer_name: courtForm.officerName || null,
        officer_phone: courtForm.officerPhone || null,
        officer_email: courtForm.officerEmail || null,
        next_check_in_date: courtForm.nextCheckInDate || null,
        notes: courtForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court_requirements"] });
      toast({ title: "Court requirement added" });
      setCourtOpen(false);
      setCourtForm({ residentId: "", requirementType: "", frequency: "", officerName: "", officerPhone: "", officerEmail: "", nextCheckInDate: "", notes: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to add requirement", variant: "destructive" });
    },
  });

  const addEmployment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employment_records").insert({
        resident_id: employForm.residentId,
        employer: employForm.employer,
        position: employForm.position || null,
        start_date: employForm.startDate || null,
        hourly_rate: employForm.hourlyRate ? parseFloat(employForm.hourlyRate) : null,
        verified: employForm.verified,
        notes: employForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment_records"] });
      toast({ title: "Employment record added" });
      setEmployOpen(false);
      setEmployForm({ residentId: "", employer: "", position: "", startDate: "", hourlyRate: "", verified: false, notes: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to add record", variant: "destructive" });
    },
  });

  const verifyMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meeting_attendance")
        .update({ verified: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting_attendance"] });
      toast({ title: "Meeting verified" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to verify meeting", variant: "destructive" });
    },
  });

  const ResidentSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select resident" />
      </SelectTrigger>
      <SelectContent>
        {residents?.map((r) => (
          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-pink-500" />
          Recovery Program
        </h1>
        <p className="text-muted-foreground">Track meetings, court requirements, employment, and program phases</p>
      </div>

      <Tabs defaultValue="meetings">
        <TabsList>
          <TabsTrigger value="meetings">
            <BookOpen className="mr-2 h-4 w-4" />
            Meeting Attendance
          </TabsTrigger>
          <TabsTrigger value="court">
            <Scale className="mr-2 h-4 w-4" />
            Court Requirements
          </TabsTrigger>
          <TabsTrigger value="employment">
            <Briefcase className="mr-2 h-4 w-4" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="phases">
            Program Phases
          </TabsTrigger>
        </TabsList>

        {/* ─── Meeting Attendance ─── */}
        <TabsContent value="meetings" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Log Meeting</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Log Meeting Attendance</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Resident *</Label><ResidentSelect value={meetingForm.residentId} onChange={(v) => setMeetingForm({ ...meetingForm, residentId: v })} /></div>
                  <div>
                    <Label>Meeting Type</Label>
                    <Select value={meetingForm.meetingType} onValueChange={(v) => setMeetingForm({ ...meetingForm, meetingType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aa">AA</SelectItem>
                        <SelectItem value="na">NA</SelectItem>
                        <SelectItem value="smart_recovery">SMART Recovery</SelectItem>
                        <SelectItem value="celebrate_recovery">Celebrate Recovery</SelectItem>
                        <SelectItem value="church">Church</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date</Label><Input type="date" value={meetingForm.meetingDate} onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })} /></div>
                  <div><Label>Meeting Name/Location</Label><Input placeholder="e.g. Monday Night AA – Central Group" value={meetingForm.meetingName} onChange={(e) => setMeetingForm({ ...meetingForm, meetingName: e.target.value })} /></div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="verified" checked={meetingForm.verified} onCheckedChange={(c) => setMeetingForm({ ...meetingForm, verified: !!c })} />
                    <Label htmlFor="verified">Verified (signature/slip collected)</Label>
                  </div>
                  <div><Label>Notes</Label><Textarea value={meetingForm.notes} onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })} /></div>
                  <Button className="w-full" onClick={() => logMeeting.mutate()} disabled={!meetingForm.residentId || logMeeting.isPending}>
                    {logMeeting.isPending ? "Saving…" : "Log Meeting"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings && meetings.length > 0 ? meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{(m as any).residents?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{m.meeting_type.toUpperCase()}</Badge></TableCell>
                      <TableCell>{m.meeting_date}</TableCell>
                      <TableCell className="text-sm">{m.meeting_name ?? "—"}</TableCell>
                      <TableCell>
                        {m.verified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => verifyMeeting.mutate(m.id)}>
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No meetings logged yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Court Requirements ─── */}
        <TabsContent value="court" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={courtOpen} onOpenChange={setCourtOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Requirement</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Add Court Requirement</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Resident *</Label><ResidentSelect value={courtForm.residentId} onChange={(v) => setCourtForm({ ...courtForm, residentId: v })} /></div>
                  <div><Label>Requirement Type *</Label><Input placeholder="e.g. Probation check-in, Community service" value={courtForm.requirementType} onChange={(e) => setCourtForm({ ...courtForm, requirementType: e.target.value })} /></div>
                  <div><Label>Frequency</Label><Input placeholder="e.g. Weekly, Monthly" value={courtForm.frequency} onChange={(e) => setCourtForm({ ...courtForm, frequency: e.target.value })} /></div>
                  <div><Label>Officer Name</Label><Input placeholder="PO or case worker" value={courtForm.officerName} onChange={(e) => setCourtForm({ ...courtForm, officerName: e.target.value })} /></div>
                  <div><Label>Officer Phone</Label><Input type="tel" value={courtForm.officerPhone} onChange={(e) => setCourtForm({ ...courtForm, officerPhone: e.target.value })} /></div>
                  <div><Label>Next Check-in Date</Label><Input type="date" value={courtForm.nextCheckInDate} onChange={(e) => setCourtForm({ ...courtForm, nextCheckInDate: e.target.value })} /></div>
                  <div><Label>Notes</Label><Textarea value={courtForm.notes} onChange={(e) => setCourtForm({ ...courtForm, notes: e.target.value })} /></div>
                  <Button className="w-full" onClick={() => addCourtReq.mutate()} disabled={!courtForm.residentId || !courtForm.requirementType || addCourtReq.isPending}>
                    {addCourtReq.isPending ? "Saving…" : "Add Requirement"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Next Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courtReqs && courtReqs.length > 0 ? courtReqs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{(c as any).residents?.name ?? "—"}</TableCell>
                      <TableCell>{c.requirement_type}</TableCell>
                      <TableCell className="text-sm">{c.officer_name ? `${c.officer_name}${c.officer_phone ? ` · ${c.officer_phone}` : ""}` : "—"}</TableCell>
                      <TableCell className={c.next_check_in_date && new Date(c.next_check_in_date) < new Date() ? "text-destructive font-medium" : ""}>
                        {c.next_check_in_date ?? "—"}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No court requirements</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Employment ─── */}
        <TabsContent value="employment" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={employOpen} onOpenChange={setEmployOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Employment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Add Employment Record</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Resident *</Label><ResidentSelect value={employForm.residentId} onChange={(v) => setEmployForm({ ...employForm, residentId: v })} /></div>
                  <div><Label>Employer *</Label><Input placeholder="Company name" value={employForm.employer} onChange={(e) => setEmployForm({ ...employForm, employer: e.target.value })} /></div>
                  <div><Label>Position</Label><Input placeholder="Job title" value={employForm.position} onChange={(e) => setEmployForm({ ...employForm, position: e.target.value })} /></div>
                  <div><Label>Start Date</Label><Input type="date" value={employForm.startDate} onChange={(e) => setEmployForm({ ...employForm, startDate: e.target.value })} /></div>
                  <div><Label>Hourly Rate ($)</Label><Input type="number" step="0.01" value={employForm.hourlyRate} onChange={(e) => setEmployForm({ ...employForm, hourlyRate: e.target.value })} /></div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="emp-verified" checked={employForm.verified} onCheckedChange={(c) => setEmployForm({ ...employForm, verified: !!c })} />
                    <Label htmlFor="emp-verified">Employment verified (paystub/letter received)</Label>
                  </div>
                  <div><Label>Notes</Label><Textarea value={employForm.notes} onChange={(e) => setEmployForm({ ...employForm, notes: e.target.value })} /></div>
                  <Button className="w-full" onClick={() => addEmployment.mutate()} disabled={!employForm.residentId || !employForm.employer || addEmployment.isPending}>
                    {addEmployment.isPending ? "Saving…" : "Add Record"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employment && employment.length > 0 ? employment.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{(e as any).residents?.name ?? "—"}</TableCell>
                      <TableCell>{e.employer}</TableCell>
                      <TableCell>{e.position ?? "—"}</TableCell>
                      <TableCell>{e.start_date ?? "—"}</TableCell>
                      <TableCell>{e.hourly_rate ? `$${e.hourly_rate}/hr` : "—"}</TableCell>
                      <TableCell>{e.verified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <span className="text-muted-foreground text-xs">Unverified</span>}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No employment records</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Program Phases ─── */}
        <TabsContent value="phases" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {phaseRules?.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Phase {phase.phase_number} — {phase.phase_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {phase.description && (
                    <p className="text-muted-foreground">{phase.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Min Duration:</span>{" "}
                      {phase.min_days_required} days
                    </div>
                    <div>
                      <span className="font-medium">Meetings/week:</span>{" "}
                      {phase.required_meetings_per_week}
                    </div>
                    <div>
                      <span className="font-medium">Tests/week:</span>{" "}
                      {phase.required_tests_per_week}
                    </div>
                    <div>
                      <span className="font-medium">Curfew:</span>{" "}
                      {phase.curfew_time
                        ? phase.curfew_time.substring(0, 5)
                        : "None"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!phaseRules || phaseRules.length === 0) && (
              <p className="text-muted-foreground col-span-2 py-8 text-center">
                No phase rules configured
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
