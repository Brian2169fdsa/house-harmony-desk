import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_color: string;
  estimated_minutes: number;
  passing_score: number;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress_pct: number;
  completed_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  compliance: "Compliance",
  safety: "Safety",
  operations: "Operations",
  resident_care: "Resident Care",
};

export default function LMSCourses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["lms_courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["lms_enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_enrollments")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["lms_certificates", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_certificates")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase.from("lms_enrollments").insert({
        user_id: userId,
        course_id: courseId,
        status: "enrolled",
        progress_pct: 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["lms_enrollments", userId] });
      toast.success("Enrolled! Starting course...");
      navigate(`/training/${courseId}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));
  const certSet = new Set((certificates as any[]).map((c: any) => c.course_id));

  const required = courses.filter((c) => c.is_required);
  const optional = courses.filter((c) => !c.is_required);

  const enrolledCount = enrollments.length;
  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const requiredDone = required.filter((c) => enrollmentMap.get(c.id)?.status === "completed").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  const CourseCard = ({ course }: { course: Course }) => {
    const enrollment = enrollmentMap.get(course.id);
    const hasCert = certSet.has(course.id);
    const isCompleted = enrollment?.status === "completed";

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div
          className="h-2"
          style={{ backgroundColor: course.cover_color }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
            <div className="flex gap-1 shrink-0">
              {course.is_required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
              {isCompleted && (
                <Badge variant="default" className="text-xs bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.estimated_minutes} min
            </span>
            <Badge variant="outline" className="text-xs py-0">
              {CATEGORY_LABELS[course.category] ?? course.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          {enrollment && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{enrollment.progress_pct}%</span>
              </div>
              <Progress value={enrollment.progress_pct} className="h-1.5" />
            </div>
          )}

          <div className="flex gap-2">
            {!enrollment ? (
              <Button
                className="w-full"
                size="sm"
                onClick={() => enrollMutation.mutate(course.id)}
                disabled={enrollMutation.isPending}
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Enroll
              </Button>
            ) : (
              <Button
                className="w-full"
                size="sm"
                variant={isCompleted ? "outline" : "default"}
                onClick={() => navigate(`/training/${course.id}`)}
              >
                {isCompleted ? "Review" : "Continue"}
                <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
            {hasCert && (
              <Button size="sm" variant="outline" className="shrink-0">
                <Award className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Training
          </h1>
          <p className="text-muted-foreground">
            Staff training courses and compliance certifications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold">{courses.length}</p>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold">{enrolledCount}</p>
            <p className="text-sm text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold">
              {requiredDone}/{required.length}
            </p>
            <p className="text-sm text-muted-foreground">Required Done</p>
          </CardContent>
        </Card>
      </div>

      {required.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Required Training</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {required.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {optional.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Optional Courses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {optional.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No courses available</p>
            <p className="text-muted-foreground text-sm">
              Run the LMS database migration to load training courses.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
