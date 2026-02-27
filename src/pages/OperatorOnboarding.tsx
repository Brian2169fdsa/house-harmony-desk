import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Rocket,
  GraduationCap,
  Award,
  Building2,
  FileText,
  Shield,
  Users,
  DollarSign,
  ExternalLink,
  BookOpen,
  PlayCircle,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────

interface WizardRow {
  id: string;
  organization_name: string;
  municipality: string;
  current_step: number;
  completed_steps: number[];
  status: string;
}

interface CourseRow {
  id: string;
  title: string;
  cover_color: string;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
}

interface EnrollmentRow {
  course_id: string;
  status: string;
  progress_pct: number;
}

// ── Launch phase definitions ────────────────────────────────────

const LAUNCH_PHASES = [
  {
    phase: 1,
    title: "Business & Legal Setup",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    wizardSteps: [1, 2],
    items: [
      "Define your business model (SLH vs BHRF)",
      "Form your LLC with Arizona Corporation Commission",
      "Draft operating agreement",
      "Obtain EIN from IRS",
      "Open business checking account",
    ],
  },
  {
    phase: 2,
    title: "Property & Compliance",
    icon: Shield,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    wizardSteps: [3, 4, 5],
    items: [
      "Select and lease a property (6-bed to avoid CUP)",
      "Verify zoning with municipality in writing",
      "Obtain Certificate of Occupancy",
      "Secure CGL + professional liability insurance",
      "Draft policies, procedures & resident agreement",
    ],
  },
  {
    phase: 3,
    title: "Licensing & Team",
    icon: FileText,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    wizardSteps: [6, 7, 8],
    items: [
      "Hire house manager (Level 1 fingerprint clearance)",
      "Join Arizona Recovery Housing Association (ARHA)",
      "Submit ADHS SLH license application + fee",
      "Pass ADHS inspection",
      "Receive provisional certification",
    ],
  },
  {
    phase: 4,
    title: "Network & Launch",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    wizardSteps: [9, 10],
    items: [
      "List on BHSL.com and SAMHSA Locator",
      "Create Google Business Profile",
      "Outreach to referral partners (courts, treatment centers)",
      "Build waiting list of 3+ prospective residents",
      "Open doors and accept first residents",
    ],
  },
];

const STEP_TITLES = [
  "Business Model Definition",
  "Business Formation",
  "Property Selection",
  "Insurance",
  "Policies & Procedures",
  "Staffing",
  "AzRHA Membership",
  "ADHS Licensing",
  "Referral Network",
  "Launch Readiness",
];

const RESOURCE_LINKS = [
  {
    label: "ADHS SLH License Application",
    href: "https://azdhs.gov/licensing/sober-living-homes/index.php",
    desc: "Official ADHS application packet",
  },
  {
    label: "AZ Corporation Commission Filing",
    href: "https://azcc.gov/entities/create",
    desc: "File your LLC Articles of Organization",
  },
  {
    label: "ARHA — AZ Recovery Housing Assoc.",
    href: "https://azrha.org",
    desc: "NARR affiliate and certification body for AZ",
  },
  {
    label: "BHSL.com — AZ SLH Directory",
    href: "https://bhsl.com",
    desc: "Get listed; referral sources use this daily",
  },
  {
    label: "SAMHSA Treatment Locator",
    href: "https://findtreatment.gov",
    desc: "National directory — add your facility",
  },
  {
    label: "Arizona 211",
    href: "https://az211.gov",
    desc: "Statewide resource directory listing",
  },
];

// ── Component ───────────────────────────────────────────────────

export default function OperatorOnboarding() {
  const navigate = useNavigate();

  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = sessionData?.user?.id;

  const { data: wizards = [] } = useQuery<WizardRow[]>({
    queryKey: ["startup-wizards", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_wizards")
        .select("id, organization_name, municipality, current_step, completed_steps, status")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: requiredCourses = [] } = useQuery<CourseRow[]>({
    queryKey: ["lms-required-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("id, title, cover_color, estimated_minutes, is_required, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: enrollments = [] } = useQuery<EnrollmentRow[]>({
    queryKey: ["lms-enrollments-onboarding", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_enrollments")
        .select("course_id, status, progress_pct")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["lms-certs-onboarding", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_certificates")
        .select("course_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Derived state ────────────────────────────────────────────

  const activeWizard = wizards[0] ?? null;
  const completedWizardSteps: number[] = activeWizard?.completed_steps ?? [];
  const wizardProgress = activeWizard
    ? Math.round((completedWizardSteps.length / 10) * 100)
    : 0;

  const enrollmentMap = Object.fromEntries(enrollments.map((e) => [e.course_id, e]));
  const certSet = new Set((certificates as any[]).map((c) => c.course_id));

  const requiredOnly = requiredCourses.filter((c) => c.is_required);
  const completedRequired = requiredOnly.filter(
    (c) => certSet.has(c.id) || enrollmentMap[c.id]?.status === "completed"
  );
  const trainingProgress =
    requiredOnly.length > 0
      ? Math.round((completedRequired.length / requiredOnly.length) * 100)
      : 0;

  const overallProgress = Math.round((wizardProgress + trainingProgress) / 2);

  const isPhaseComplete = (phase: (typeof LAUNCH_PHASES)[0]) => {
    return phase.wizardSteps.every((s) => completedWizardSteps.includes(s));
  };

  const operatorCourse = requiredCourses.find(
    (c) => c.id === "c0000006-0000-0000-0000-000000000006"
  );

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operator Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Your complete roadmap from formation to first resident.
          </p>
        </div>
        <Button onClick={() => navigate("/startup")} className="shrink-0">
          <Rocket className="mr-2 h-4 w-4" />
          {activeWizard ? "Continue Wizard" : "Start Startup Wizard"}
        </Button>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Launch Progress</span>
            <span className="text-sm font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{wizardProgress}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedWizardSteps.length}/10 wizard steps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{trainingProgress}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedRequired.length}/{requiredOnly.length} required courses
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active wizard summary */}
      {activeWizard && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Active Startup Wizard</p>
                <p className="font-semibold">
                  {activeWizard.organization_name || "Unnamed Organization"} ·{" "}
                  {activeWizard.municipality.charAt(0).toUpperCase() +
                    activeWizard.municipality.slice(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Currently on Step {activeWizard.current_step}:{" "}
                  <span className="font-medium">
                    {STEP_TITLES[activeWizard.current_step - 1]}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/startup/${activeWizard.id}`)}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Launch Phases */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Launch Roadmap</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {LAUNCH_PHASES.map((phase) => {
            const complete = isPhaseComplete(phase);
            const Icon = phase.icon;
            return (
              <Card
                key={phase.phase}
                className={`border ${complete ? "border-green-300 bg-green-50/50" : phase.border}`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${complete ? "bg-green-100" : phase.bg}`}
                    >
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Icon className={`h-4 w-4 ${phase.color}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Phase {phase.phase}
                        </span>
                        {complete && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700 border-green-300"
                          >
                            Complete
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm mt-0">{phase.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-1.5">
                    {phase.items.map((item, i) => {
                      const stepIndex = i;
                      const wizardStep = phase.wizardSteps[Math.min(stepIndex, phase.wizardSteps.length - 1)];
                      const done = completedWizardSteps.includes(wizardStep) && complete;
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                          )}
                          <span className={done ? "text-muted-foreground line-through" : ""}>
                            {item}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 text-xs w-full justify-between"
                    onClick={() =>
                      activeWizard
                        ? navigate(`/startup/${activeWizard.id}`)
                        : navigate("/startup")
                    }
                  >
                    {complete ? "Review this phase" : "Work through wizard"}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Required Training */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Required Training</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/training/courses")}>
            View all courses
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {requiredOnly.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Loading training requirements…</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {requiredOnly.map((course) => {
              const enrollment = enrollmentMap[course.id];
              const certified = certSet.has(course.id);
              const pct = certified ? 100 : enrollment?.progress_pct ?? 0;
              const statusLabel = certified
                ? "Certified"
                : enrollment?.status === "in_progress"
                ? "In Progress"
                : enrollment?.status === "completed"
                ? "Completed"
                : "Not Started";
              const statusColor = certified || enrollment?.status === "completed"
                ? "bg-green-100 text-green-700 border-green-300"
                : enrollment?.status === "in_progress"
                ? "bg-amber-100 text-amber-700 border-amber-300"
                : "bg-muted text-muted-foreground";

              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/training/courses/${course.id}`)}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: course.cover_color + "22" }}
                  >
                    {certified ? (
                      <Award className="h-5 w-5" style={{ color: course.cover_color }} />
                    ) : (
                      <PlayCircle className="h-5 w-5" style={{ color: course.cover_color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{course.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${statusColor}`}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-7 text-right shrink-0">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Operator Startup Course CTA */}
      {operatorCourse && (
        <Card
          className="border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => navigate(`/training/courses/${operatorCourse.id}`)}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Arizona Sober Living Startup Guide</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  8 lessons covering ADHS licensing, zoning, insurance, policies, referrals & financials.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {operatorCourse.estimated_minutes} min · Recommended for all new operators
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-blue-400 shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Planning CTA */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/projections")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Financial Projections</p>
                <p className="text-xs text-muted-foreground">
                  Revenue, expenses, break-even analysis & startup cost calculator
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/accreditation")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Accreditation Tracker</p>
                <p className="text-xs text-muted-foreground">
                  ADHS, AzRHA/NARR, CARF, and Joint Commission certification tracking
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Official Resources</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {RESOURCE_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {link.label}
                </p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
