import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";
import {
  format,
  differenceInDays,
  addDays,
  isBefore,
  isAfter,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Heart,
  Plus,
  Briefcase,
  Scale,
  BookOpen,
  CheckCircle2,
  Award,
  Clock,
  Users,
  Calendar,
  Star,
  TrendingUp,
  AlertTriangle,
  Search,
  ArrowUpCircle,
  Shield,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const MEETING_TYPE_OPTIONS = [
  { value: "aa", label: "AA" },
  { value: "na", label: "NA" },
  { value: "smart_recovery", label: "SMART Recovery" },
  { value: "celebrate_recovery", label: "Celebrate Recovery" },
  { value: "church", label: "Church" },
  { value: "other", label: "Other" },
] as const;

const MEETING_TYPE_LABELS: Record<string, string> = {
  aa: "AA",
  na: "NA",
  smart_recovery: "SMART Recovery",
  celebrate_recovery: "Celebrate Recovery",
  church: "Church",
  other: "Other",
};

const PHASE_BADGE_CLASSES: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-amber-100 text-amber-800 border-amber-200",
  3: "bg-green-100 text-green-800 border-green-200",
};

const PHASE_ACCENT_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-amber-500",
  3: "bg-green-500",
};

const SOBRIETY_MILESTONES = [30, 60, 90, 180, 365] as const;

function getHighestMilestone(daysSober: number): number | null {
  let highest: number | null = null;
  for (const m of SOBRIETY_MILESTONES) {
    if (daysSober >= m) highest = m;
  }
  return highest;
}

function milestoneLabel(days: number): string {
  if (days >= 365) return `${Math.floor(days / 365)} Year`;
  return `${days} Days`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reusable resident selector
   ═══════════════════════════════════════════════════════════════════════════ */

function ResidentSelect({
  residents,
  value,
  onChange,
}: {
  residents: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
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
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Recovery() {
  const queryClient = useQueryClient();
  const { isManager } = useUserRole();

  /* ─── Dialog state ─── */
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [employOpen, setEmployOpen] = useState(false);
  const [phaseAdvanceOpen, setPhaseAdvanceOpen] = useState(false);
  const [phaseAdvanceResidentId, setPhaseAdvanceResidentId] = useState("");

  /* ─── Filter state ─── */
  const [meetingSearch, setMeetingSearch] = useState("");
  const [meetingTypeFilter, setMeetingTypeFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState<"active" | "past">("active");

  /* ─── Form state ─── */
  const [meetingForm, setMeetingForm] = useState({
    residentId: "",
    meetingType: "aa",
    meetingDate: format(new Date(), "yyyy-MM-dd"),
    meetingName: "",
    verified: false,
    notes: "",
  });

  const [courtForm, setCourtForm] = useState({
    residentId: "",
    requirementType: "",
    frequency: "",
    officerName: "",
    officerPhone: "",
    officerEmail: "",
    nextCheckInDate: "",
    notes: "",
  });

  const [employForm, setEmployForm] = useState({
    residentId: "",
    employer: "",
    position: "",
    startDate: "",
    hourlyRate: "",
    verified: false,
    notes: "",
  });

  /* ═══════════════════════════════════════════════════════════════════════
     Queries
     ═══════════════════════════════════════════════════════════════════════ */

  const { data: residents, isLoading: residentsLoading } = useQuery({
    queryKey: ["recovery-residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, status, program_phase, sobriety_date, move_in_date")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["recovery-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_attendance")
        .select("*, residents(name)")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: courtReqs, isLoading: courtLoading } = useQuery({
    queryKey: ["recovery-court"],
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

  const { data: employment, isLoading: employmentLoading } = useQuery({
    queryKey: ["recovery-employment"],
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
    queryKey: ["recovery-phase-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_phase_rules")
        .select("*")
        .order("phase_number");
      if (error) throw error;
      return data || [];
    },
  });

  /* ═══════════════════════════════════════════════════════════════════════
     Computed / Memoized values
     ═══════════════════════════════════════════════════════════════════════ */

  const today = useMemo(() => new Date(), []);

  const activeResidents = useMemo(
    () =>
      (residents || []).filter(
        (r) => r.status === "active" || r.status === "Active"
      ),
    [residents]
  );

  const weekStart = useMemo(
    () => startOfWeek(today, { weekStartsOn: 0 }),
    [today]
  );
  const weekEnd = useMemo(
    () => endOfWeek(today, { weekStartsOn: 0 }),
    [today]
  );

  const meetingsThisWeek = useMemo(() => {
    if (!meetings) return [];
    return meetings.filter((m) => {
      const d = new Date(m.meeting_date);
      return !isBefore(d, weekStart) && !isAfter(d, weekEnd);
    });
  }, [meetings, weekStart, weekEnd]);

  const meetingsByTypeThisWeek = useMemo(() => {
    const counts: Record<string, number> = {};
    meetingsThisWeek.forEach((m) => {
      counts[m.meeting_type] = (counts[m.meeting_type] || 0) + 1;
    });
    return counts;
  }, [meetingsThisWeek]);

  const residentMeetingsThisWeek = useMemo(() => {
    const map: Record<string, number> = {};
    meetingsThisWeek.forEach((m) => {
      map[m.resident_id] = (map[m.resident_id] || 0) + 1;
    });
    return map;
  }, [meetingsThisWeek]);

  const residentActiveEmployment = useMemo(() => {
    const map: Record<string, { employer: string; position: string | null }> =
      {};
    (employment || []).forEach((e) => {
      if (!e.end_date) {
        map[e.resident_id] = { employer: e.employer, position: e.position };
      }
    });
    return map;
  }, [employment]);

  const residentNextCourtDate = useMemo(() => {
    const map: Record<string, string> = {};
    (courtReqs || []).forEach((c) => {
      if (c.next_check_in_date) {
        if (
          !map[c.resident_id] ||
          c.next_check_in_date < map[c.resident_id]
        ) {
          map[c.resident_id] = c.next_check_in_date;
        }
      }
    });
    return map;
  }, [courtReqs]);

  const phaseRulesMap = useMemo(() => {
    const map: Record<number, (typeof phaseRules extends (infer T)[] | undefined ? T : never)> = {};
    (phaseRules || []).forEach((p) => {
      map[p.phase_number] = p;
    });
    return map;
  }, [phaseRules]);

  const residentCountByPhase = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    activeResidents.forEach((r) => {
      const phase = Number(r.program_phase) || 0;
      if (phase >= 1 && phase <= 3) {
        counts[phase] = (counts[phase] || 0) + 1;
      }
    });
    return counts;
  }, [activeResidents]);

  const averageSobrietyDays = useMemo(() => {
    const withSobriety = activeResidents.filter((r) => r.sobriety_date);
    if (withSobriety.length === 0) return 0;
    const total = withSobriety.reduce((sum, r) => {
      return sum + differenceInDays(today, new Date(r.sobriety_date!));
    }, 0);
    return Math.round(total / withSobriety.length);
  }, [activeResidents, today]);

  const employmentRate = useMemo(() => {
    if (activeResidents.length === 0) return 0;
    const employed = activeResidents.filter(
      (r) => residentActiveEmployment[r.id]
    );
    return Math.round((employed.length / activeResidents.length) * 100);
  }, [activeResidents, residentActiveEmployment]);

  // Filtered meetings for the Meetings tab
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];
    return meetings.filter((m) => {
      const resName = ((m as any).residents?.name || "").toLowerCase();
      const matchSearch =
        !meetingSearch ||
        resName.includes(meetingSearch.toLowerCase()) ||
        (m.meeting_name || "").toLowerCase().includes(meetingSearch.toLowerCase());
      const matchType =
        meetingTypeFilter === "all" || m.meeting_type === meetingTypeFilter;
      return matchSearch && matchType;
    });
  }, [meetings, meetingSearch, meetingTypeFilter]);

  // Filtered employment for the Employment tab
  const filteredEmployment = useMemo(() => {
    if (!employment) return [];
    return employmentFilter === "active"
      ? employment.filter((e) => !e.end_date)
      : employment.filter((e) => !!e.end_date);
  }, [employment, employmentFilter]);

  /* ═══════════════════════════════════════════════════════════════════════
     Mutations
     ═══════════════════════════════════════════════════════════════════════ */

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
      queryClient.invalidateQueries({ queryKey: ["recovery-meetings"] });
      toast.success("Meeting logged successfully");
      setMeetingOpen(false);
      setMeetingForm({
        residentId: "",
        meetingType: "aa",
        meetingDate: format(new Date(), "yyyy-MM-dd"),
        meetingName: "",
        verified: false,
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log meeting");
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
      queryClient.invalidateQueries({ queryKey: ["recovery-meetings"] });
      toast.success("Meeting verified");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify meeting");
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
      queryClient.invalidateQueries({ queryKey: ["recovery-court"] });
      toast.success("Court requirement added");
      setCourtOpen(false);
      setCourtForm({
        residentId: "",
        requirementType: "",
        frequency: "",
        officerName: "",
        officerPhone: "",
        officerEmail: "",
        nextCheckInDate: "",
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add requirement");
    },
  });

  const markCourtComplete = useMutation({
    mutationFn: async ({
      id,
      frequency,
    }: {
      id: string;
      frequency: string | null;
    }) => {
      let nextDate: string | null = null;
      if (frequency) {
        const now = new Date();
        const freq = frequency.toLowerCase();
        if (freq.includes("week") && !freq.includes("bi")) {
          nextDate = format(addDays(now, 7), "yyyy-MM-dd");
        } else if (freq.includes("bi-week") || freq.includes("biweek")) {
          nextDate = format(addDays(now, 14), "yyyy-MM-dd");
        } else if (freq.includes("month")) {
          nextDate = format(addDays(now, 30), "yyyy-MM-dd");
        } else if (freq.includes("quarter")) {
          nextDate = format(addDays(now, 90), "yyyy-MM-dd");
        } else {
          nextDate = format(addDays(now, 30), "yyyy-MM-dd");
        }
      }
      const { error } = await supabase
        .from("court_requirements")
        .update({ next_check_in_date: nextDate })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-court"] });
      toast.success("Check-in marked complete, next date updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update check-in");
    },
  });

  const addEmployment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employment_records").insert({
        resident_id: employForm.residentId,
        employer: employForm.employer,
        position: employForm.position || null,
        start_date: employForm.startDate || null,
        hourly_rate: employForm.hourlyRate
          ? parseFloat(employForm.hourlyRate)
          : null,
        verified: employForm.verified,
        notes: employForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-employment"] });
      toast.success("Employment record added");
      setEmployOpen(false);
      setEmployForm({
        residentId: "",
        employer: "",
        position: "",
        startDate: "",
        hourlyRate: "",
        verified: false,
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add employment record");
    },
  });

  const endEmployment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employment_records")
        .update({ end_date: format(today, "yyyy-MM-dd") })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-employment"] });
      toast.success("Employment ended");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to end employment");
    },
  });

  const advancePhase = useMutation({
    mutationFn: async (residentId: string) => {
      const resident = activeResidents.find((r) => r.id === residentId);
      if (!resident) throw new Error("Resident not found");
      const currentPhase = Number(resident.program_phase) || 1;
      const newPhase = currentPhase + 1;
      if (newPhase > 3) throw new Error("Already at maximum phase");
      const { error } = await supabase
        .from("residents")
        .update({ program_phase: newPhase })
        .eq("id", residentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-residents"] });
      toast.success("Resident advanced to next phase");
      setPhaseAdvanceOpen(false);
      setPhaseAdvanceResidentId("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to advance phase");
    },
  });

  /* ─── Helpers ─── */

  const isEligibleForAdvancement = (resident: any): boolean => {
    const phase = Number(resident.program_phase) || 0;
    if (phase <= 0 || phase >= 3) return false;
    const rule = phaseRulesMap[phase];
    if (!rule) return false;
    if (!resident.move_in_date) return false;
    const daysInProgram = differenceInDays(today, new Date(resident.move_in_date));
    return daysInProgram >= (rule.min_days_required || 0);
  };

  /* ─── Loading ─── */

  if (residentsLoading || meetingsLoading || courtLoading || employmentLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-pink-500" />
          Recovery Program
        </h1>
        <p className="text-muted-foreground">
          Track meetings, court requirements, employment, and program phases
        </p>
      </div>

      {/* ─── TOP STATS (always visible above tabs) ─── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Residents</p>
                <p className="text-2xl font-bold">{activeResidents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Sobriety</p>
                <p className="text-2xl font-bold">{averageSobrietyDays} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meetings This Week</p>
                <p className="text-2xl font-bold">{meetingsThisWeek.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <Scale className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Court Requirements</p>
                <p className="text-2xl font-bold">{courtReqs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employment Rate</p>
                <p className="text-2xl font-bold">{employmentRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── TABS ─── */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">
            <Heart className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <BookOpen className="mr-2 h-4 w-4" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="court">
            <Scale className="mr-2 h-4 w-4" />
            Court
          </TabsTrigger>
          <TabsTrigger value="employment">
            <Briefcase className="mr-2 h-4 w-4" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="phases">
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Phases
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════
            TAB 1: DASHBOARD
        ═══════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-4">
          {activeResidents.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active residents found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeResidents.map((resident) => {
                const sobrietyDays = resident.sobriety_date
                  ? differenceInDays(today, new Date(resident.sobriety_date))
                  : null;
                const milestone =
                  sobrietyDays !== null && sobrietyDays >= 0
                    ? getHighestMilestone(sobrietyDays)
                    : null;
                const phase = Number(resident.program_phase) || 1;
                const rule = phaseRulesMap[phase];
                const requiredMeetings = rule?.required_meetings_per_week || 0;
                const actualMeetings =
                  residentMeetingsThisWeek[resident.id] || 0;
                const meetingPercent =
                  requiredMeetings > 0
                    ? Math.min(
                        100,
                        Math.round((actualMeetings / requiredMeetings) * 100)
                      )
                    : 100;
                const emp = residentActiveEmployment[resident.id];
                const nextCourt = residentNextCourtDate[resident.id];
                const eligible = isEligibleForAdvancement(resident);

                return (
                  <Card key={resident.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {resident.name}
                          </CardTitle>
                          {sobrietyDays !== null && sobrietyDays >= 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {sobrietyDays} days sober
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {milestone && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-300"
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {milestoneLabel(milestone)}
                            </Badge>
                          )}
                          <Badge
                            className={
                              PHASE_BADGE_CLASSES[phase] || "bg-gray-100"
                            }
                          >
                            Phase {phase}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {/* Meetings Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            Meetings this week
                          </span>
                          <span className="font-medium">
                            {actualMeetings} / {requiredMeetings}
                          </span>
                        </div>
                        <Progress value={meetingPercent} className="h-2" />
                      </div>

                      {/* Court Check-in */}
                      {nextCourt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Next court:
                          </span>
                          <span
                            className={
                              isBefore(new Date(nextCourt), today)
                                ? "text-destructive font-medium"
                                : differenceInDays(
                                    new Date(nextCourt),
                                    today
                                  ) <= 7
                                ? "text-amber-600 font-medium"
                                : ""
                            }
                          >
                            {format(new Date(nextCourt), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}

                      {/* Employment Status */}
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {emp ? (
                          <span className="text-green-600">
                            Employed at {emp.employer}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Seeking Employment
                          </span>
                        )}
                      </div>

                      {/* Phase Advancement */}
                      {eligible && phase < 3 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setPhaseAdvanceResidentId(resident.id);
                            setPhaseAdvanceOpen(true);
                          }}
                        >
                          <ArrowUpCircle className="mr-2 h-4 w-4" />
                          Eligible for Phase {phase + 1}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Phase Advance Confirmation Dialog */}
          <Dialog open={phaseAdvanceOpen} onOpenChange={setPhaseAdvanceOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Advance Program Phase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to advance{" "}
                  <span className="font-medium text-foreground">
                    {
                      activeResidents.find(
                        (r) => r.id === phaseAdvanceResidentId
                      )?.name
                    }
                  </span>{" "}
                  to the next phase?
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setPhaseAdvanceOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => advancePhase.mutate(phaseAdvanceResidentId)}
                    disabled={advancePhase.isPending}
                  >
                    {advancePhase.isPending
                      ? "Advancing..."
                      : "Confirm Advancement"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════
            TAB 2: MEETINGS
        ═══════════════════════════════════════════ */}
        <TabsContent value="meetings" className="space-y-4">
          {/* Weekly summary cards */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold">
                  {meetingsThisWeek.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total This Week
                </p>
              </CardContent>
            </Card>
            {MEETING_TYPE_OPTIONS.map((mt) => (
              <Card key={mt.value}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold">
                    {meetingsByTypeThisWeek[mt.value] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{mt.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search, Filter, Add */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by resident or meeting..."
                  value={meetingSearch}
                  onChange={(e) => setMeetingSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={meetingTypeFilter}
                onValueChange={setMeetingTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {MEETING_TYPE_OPTIONS.map((mt) => (
                    <SelectItem key={mt.value} value={mt.value}>
                      {mt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Meeting Attendance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Resident *</Label>
                    <ResidentSelect
                      residents={activeResidents}
                      value={meetingForm.residentId}
                      onChange={(v) =>
                        setMeetingForm({ ...meetingForm, residentId: v })
                      }
                    />
                  </div>
                  <div>
                    <Label>Meeting Type</Label>
                    <Select
                      value={meetingForm.meetingType}
                      onValueChange={(v) =>
                        setMeetingForm({ ...meetingForm, meetingType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEETING_TYPE_OPTIONS.map((mt) => (
                          <SelectItem key={mt.value} value={mt.value}>
                            {mt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={meetingForm.meetingDate}
                      onChange={(e) =>
                        setMeetingForm({
                          ...meetingForm,
                          meetingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Meeting Name / Location</Label>
                    <Input
                      placeholder="e.g. Monday Night AA - Central Group"
                      value={meetingForm.meetingName}
                      onChange={(e) =>
                        setMeetingForm({
                          ...meetingForm,
                          meetingName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="meeting-verified"
                      checked={meetingForm.verified}
                      onCheckedChange={(c) =>
                        setMeetingForm({ ...meetingForm, verified: !!c })
                      }
                    />
                    <Label htmlFor="meeting-verified">
                      Verified (signature/slip collected)
                    </Label>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={meetingForm.notes}
                      onChange={(e) =>
                        setMeetingForm({ ...meetingForm, notes: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => logMeeting.mutate()}
                    disabled={
                      !meetingForm.residentId || logMeeting.isPending
                    }
                  >
                    {logMeeting.isPending ? "Saving..." : "Log Meeting"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Meetings Table */}
          {meetingsLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading...
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Meeting</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.length > 0 ? (
                      filteredMeetings.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {(m as any).residents?.name ?? "--"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {MEETING_TYPE_LABELS[m.meeting_type] ||
                                m.meeting_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(m.meeting_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {m.meeting_name ?? "--"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {m.notes ?? "--"}
                          </TableCell>
                          <TableCell>
                            {m.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : isManager ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => verifyMeeting.mutate(m.id)}
                                disabled={verifyMeeting.isPending}
                              >
                                Verify
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No meetings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════
            TAB 3: COURT
        ═══════════════════════════════════════════ */}
        <TabsContent value="court" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={courtOpen} onOpenChange={setCourtOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Requirement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Court Requirement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Resident *</Label>
                    <ResidentSelect
                      residents={activeResidents}
                      value={courtForm.residentId}
                      onChange={(v) =>
                        setCourtForm({ ...courtForm, residentId: v })
                      }
                    />
                  </div>
                  <div>
                    <Label>Requirement Type *</Label>
                    <Input
                      placeholder="e.g. Probation check-in, Community service"
                      value={courtForm.requirementType}
                      onChange={(e) =>
                        setCourtForm({
                          ...courtForm,
                          requirementType: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={courtForm.frequency}
                      onValueChange={(v) =>
                        setCourtForm({ ...courtForm, frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Officer Name</Label>
                    <Input
                      placeholder="PO or case worker"
                      value={courtForm.officerName}
                      onChange={(e) =>
                        setCourtForm({
                          ...courtForm,
                          officerName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Officer Phone</Label>
                      <Input
                        type="tel"
                        value={courtForm.officerPhone}
                        onChange={(e) =>
                          setCourtForm({
                            ...courtForm,
                            officerPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Officer Email</Label>
                      <Input
                        type="email"
                        value={courtForm.officerEmail}
                        onChange={(e) =>
                          setCourtForm({
                            ...courtForm,
                            officerEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Next Check-in Date</Label>
                    <Input
                      type="date"
                      value={courtForm.nextCheckInDate}
                      onChange={(e) =>
                        setCourtForm({
                          ...courtForm,
                          nextCheckInDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={courtForm.notes}
                      onChange={(e) =>
                        setCourtForm({ ...courtForm, notes: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addCourtReq.mutate()}
                    disabled={
                      !courtForm.residentId ||
                      !courtForm.requirementType ||
                      addCourtReq.isPending
                    }
                  >
                    {addCourtReq.isPending ? "Saving..." : "Add Requirement"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {courtLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading...
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Next Check-in</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courtReqs && courtReqs.length > 0 ? (
                      courtReqs.map((c) => {
                        const isOverdue =
                          c.next_check_in_date &&
                          isBefore(new Date(c.next_check_in_date), today);
                        const isUpcoming =
                          c.next_check_in_date &&
                          !isOverdue &&
                          differenceInDays(
                            new Date(c.next_check_in_date),
                            today
                          ) <= 7;

                        return (
                          <TableRow
                            key={c.id}
                            className={
                              isOverdue
                                ? "bg-red-50"
                                : isUpcoming
                                ? "bg-yellow-50"
                                : ""
                            }
                          >
                            <TableCell className="font-medium">
                              {(c as any).residents?.name ?? "--"}
                            </TableCell>
                            <TableCell>{c.requirement_type}</TableCell>
                            <TableCell className="text-sm">
                              {c.frequency ?? "--"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {c.officer_name ? (
                                <div>
                                  <p>{c.officer_name}</p>
                                  {c.officer_phone && (
                                    <p className="text-muted-foreground text-xs">
                                      {c.officer_phone}
                                    </p>
                                  )}
                                  {c.officer_email && (
                                    <p className="text-muted-foreground text-xs">
                                      {c.officer_email}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                "--"
                              )}
                            </TableCell>
                            <TableCell>
                              {c.next_check_in_date ? (
                                <span
                                  className={
                                    isOverdue
                                      ? "text-destructive font-semibold"
                                      : isUpcoming
                                      ? "text-amber-600 font-medium"
                                      : ""
                                  }
                                >
                                  {format(
                                    new Date(c.next_check_in_date),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              ) : (
                                "--"
                              )}
                            </TableCell>
                            <TableCell>
                              {isOverdue ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              ) : isUpcoming ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Upcoming
                                </Badge>
                              ) : (
                                <Badge variant="outline">On Track</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  markCourtComplete.mutate({
                                    id: c.id,
                                    frequency: c.frequency,
                                  })
                                }
                                disabled={markCourtComplete.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
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
                          No active court requirements
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════
            TAB 4: EMPLOYMENT
        ═══════════════════════════════════════════ */}
        <TabsContent value="employment" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={
                  employmentFilter === "active" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setEmploymentFilter("active")}
              >
                Active Employment
              </Button>
              <Button
                variant={employmentFilter === "past" ? "default" : "outline"}
                size="sm"
                onClick={() => setEmploymentFilter("past")}
              >
                Past Employment
              </Button>
            </div>

            <Dialog open={employOpen} onOpenChange={setEmployOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Employment Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Resident *</Label>
                    <ResidentSelect
                      residents={activeResidents}
                      value={employForm.residentId}
                      onChange={(v) =>
                        setEmployForm({ ...employForm, residentId: v })
                      }
                    />
                  </div>
                  <div>
                    <Label>Employer *</Label>
                    <Input
                      placeholder="Company name"
                      value={employForm.employer}
                      onChange={(e) =>
                        setEmployForm({
                          ...employForm,
                          employer: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Input
                      placeholder="Job title"
                      value={employForm.position}
                      onChange={(e) =>
                        setEmployForm({
                          ...employForm,
                          position: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={employForm.startDate}
                        onChange={(e) =>
                          setEmployForm({
                            ...employForm,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={employForm.hourlyRate}
                        onChange={(e) =>
                          setEmployForm({
                            ...employForm,
                            hourlyRate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="emp-verified"
                      checked={employForm.verified}
                      onCheckedChange={(c) =>
                        setEmployForm({ ...employForm, verified: !!c })
                      }
                    />
                    <Label htmlFor="emp-verified">
                      Employment verified (paystub/letter received)
                    </Label>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={employForm.notes}
                      onChange={(e) =>
                        setEmployForm({
                          ...employForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addEmployment.mutate()}
                    disabled={
                      !employForm.residentId ||
                      !employForm.employer ||
                      addEmployment.isPending
                    }
                  >
                    {addEmployment.isPending ? "Saving..." : "Add Record"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {employmentLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading...
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Start Date</TableHead>
                      {employmentFilter === "past" && (
                        <TableHead>End Date</TableHead>
                      )}
                      <TableHead>Rate</TableHead>
                      <TableHead>Verified</TableHead>
                      {employmentFilter === "active" && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployment.length > 0 ? (
                      filteredEmployment.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">
                            {(e as any).residents?.name ?? "--"}
                          </TableCell>
                          <TableCell>{e.employer}</TableCell>
                          <TableCell>{e.position ?? "--"}</TableCell>
                          <TableCell>
                            {e.start_date
                              ? format(new Date(e.start_date), "MMM d, yyyy")
                              : "--"}
                          </TableCell>
                          {employmentFilter === "past" && (
                            <TableCell>
                              {e.end_date
                                ? format(
                                    new Date(e.end_date),
                                    "MMM d, yyyy"
                                  )
                                : "--"}
                            </TableCell>
                          )}
                          <TableCell>
                            {e.hourly_rate ? `$${e.hourly_rate}/hr` : "--"}
                          </TableCell>
                          <TableCell>
                            {e.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Unverified
                              </span>
                            )}
                          </TableCell>
                          {employmentFilter === "active" && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => endEmployment.mutate(e.id)}
                                disabled={endEmployment.isPending}
                              >
                                End Employment
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={
                            employmentFilter === "active" ? 8 : 8
                          }
                          className="text-center text-muted-foreground py-8"
                        >
                          {employmentFilter === "active"
                            ? "No active employment records"
                            : "No past employment records"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════
            TAB 5: PHASES
        ═══════════════════════════════════════════ */}
        <TabsContent value="phases" className="space-y-6">
          {/* Phase Rule Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {phaseRules && phaseRules.length > 0 ? (
              phaseRules.map((phase) => (
                <Card key={phase.id} className="relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      PHASE_ACCENT_COLORS[phase.phase_number] || "bg-gray-400"
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Phase {phase.phase_number}
                      </CardTitle>
                      <Badge
                        className={
                          PHASE_BADGE_CLASSES[phase.phase_number] ||
                          "bg-gray-100"
                        }
                      >
                        {residentCountByPhase[phase.phase_number] || 0}{" "}
                        residents
                      </Badge>
                    </div>
                    <CardDescription className="font-medium">
                      {phase.phase_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {phase.description && (
                      <p className="text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-muted-foreground text-xs">
                          Min Duration
                        </p>
                        <p className="font-medium">
                          {phase.min_days_required} days
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-muted-foreground text-xs">
                          Meetings/Week
                        </p>
                        <p className="font-medium">
                          {phase.required_meetings_per_week}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-muted-foreground text-xs">
                          Tests/Week
                        </p>
                        <p className="font-medium">
                          {phase.required_tests_per_week}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-muted-foreground text-xs">
                          Curfew
                        </p>
                        <p className="font-medium">
                          {phase.curfew_time
                            ? phase.curfew_time.substring(0, 5)
                            : "None"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Employment:{" "}
                        <span className="font-medium">
                          {phase.employment_required
                            ? "Required"
                            : "Not required"}
                        </span>
                      </span>
                    </div>
                    {phase.privileges && (
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs mb-1">
                          Privileges
                        </p>
                        <p>{phase.privileges}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">
                  No phase rules configured
                </p>
              </div>
            )}
          </div>

          {/* Residents by Phase table */}
          {phaseRules && phaseRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Residents by Phase
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Current Phase</TableHead>
                      <TableHead>Days in Program</TableHead>
                      <TableHead>Sobriety</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeResidents.length > 0 ? (
                      activeResidents.map((r) => {
                        const phase = Number(r.program_phase) || 1;
                        const daysInProgram = r.move_in_date
                          ? differenceInDays(
                              today,
                              new Date(r.move_in_date)
                            )
                          : 0;
                        const sobrietyDays = r.sobriety_date
                          ? differenceInDays(
                              today,
                              new Date(r.sobriety_date)
                            )
                          : null;
                        const eligible = isEligibleForAdvancement(r);

                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  PHASE_BADGE_CLASSES[phase] ||
                                  "bg-gray-100"
                                }
                              >
                                Phase {phase}
                              </Badge>
                            </TableCell>
                            <TableCell>{daysInProgram} days</TableCell>
                            <TableCell>
                              {sobrietyDays !== null && sobrietyDays >= 0 ? (
                                <span>
                                  {sobrietyDays} days
                                  {getHighestMilestone(sobrietyDays) && (
                                    <Star className="inline h-3 w-3 ml-1 text-yellow-500" />
                                  )}
                                </span>
                              ) : (
                                "--"
                              )}
                            </TableCell>
                            <TableCell>
                              {eligible && phase < 3 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                  onClick={() => {
                                    setPhaseAdvanceResidentId(r.id);
                                    setPhaseAdvanceOpen(true);
                                  }}
                                >
                                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                                  Advance
                                </Button>
                              ) : phase >= 3 ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-300"
                                >
                                  Graduated
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  In progress
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No active residents
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
