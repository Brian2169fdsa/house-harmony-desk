import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Award,
  Clock,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const userId = session?.user?.id;

  const { data: course } = useQuery({
    queryKey: ["lms-course", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lms-lessons", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_lessons")
        .select("*")
        .eq("course_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["lms-enrollment", userId, id],
    enabled: !!userId && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_enrollments")
        .select("*")
        .eq("user_id", userId!)
        .eq("course_id", id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lms-lesson-progress", userId, id],
    enabled: !!userId && !!id,
    queryFn: async () => {
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return [];
      const { data } = await supabase
        .from("lms_lesson_progress")
        .select("*")
        .eq("user_id", userId!)
        .in("lesson_id", lessonIds);
      return data || [];
    },
  });

  const { data: certificate } = useQuery({
    queryKey: ["lms-certificate", userId, id],
    enabled: !!userId && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_certificates")
        .select("*")
        .eq("user_id", userId!)
        .eq("course_id", id!)
        .maybeSingle();
      return data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lms_enrollments").insert({
        user_id: userId!,
        course_id: id!,
        status: "enrolled",
        progress_pct: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lms-enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["lms-enrollments"] });
      toast.success("Enrolled! Start with lesson 1.");
    },
    onError: () => toast.error("Enrollment failed"),
  });

  if (!course) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading…</div>
    );
  }

  const completedLessonIds = new Set(lessonProgress.map((p) => p.lesson_id));
  const completedCount = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const nextLesson = lessons.find((l) => !completedLessonIds.has(l.id));
  const isCompleted = enrollment?.status === "completed";

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => navigate("/training/courses")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Course Catalog
      </Button>

      {/* Header */}
      <div
        className="rounded-xl p-6 text-white"
        style={{ backgroundColor: course.cover_color }}
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {course.is_required && (
            <Badge className="bg-white/20 text-white border-0">Required</Badge>
          )}
          <Badge className="bg-white/20 text-white border-0 capitalize">
            {course.category.replace(/-/g, " ")}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <p className="text-white/80 text-sm">{course.description}</p>
        <div className="flex gap-4 mt-4 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.estimated_minutes} min
          </span>
          <span>{lessons.length} lessons</span>
          <span>{course.passing_score}% passing score</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lessons list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">Course Lessons</h2>

          {enrollment && lessons.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>
                  {completedCount} of {lessons.length} lessons completed
                </span>
                <span>{Math.round((completedCount / lessons.length) * 100)}%</span>
              </div>
              <Progress value={(completedCount / lessons.length) * 100} />
            </div>
          )}

          {lessons.map((lesson, idx) => {
            const done = completedLessonIds.has(lesson.id);
            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                  !enrollment ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (!enrollment) return;
                  navigate(`/training/courses/${id}/lesson/${lesson.id}`);
                }}
              >
                <div className="flex-shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-2">
                      {idx + 1}.
                    </span>
                    {lesson.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lesson.duration_minutes} min
                    {lesson.has_quiz ? " · includes quiz" : ""}
                  </p>
                </div>
                {done && (
                  <Badge variant="secondary" className="text-xs">
                    Done
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* CTA */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {isCompleted ? (
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-sm">Course Completed!</p>
                </div>
              ) : !enrollment ? (
                <Button
                  className="w-full"
                  style={{ backgroundColor: course.cover_color }}
                  disabled={!userId || enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate()}
                >
                  {enrollMutation.isPending ? "Enrolling…" : "Enroll in Course"}
                </Button>
              ) : nextLesson ? (
                <Button
                  className="w-full"
                  onClick={() =>
                    navigate(`/training/courses/${id}/lesson/${nextLesson.id}`)
                  }
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {completedCount === 0 ? "Start Course" : "Continue"}
                </Button>
              ) : null}

              {enrollment && !isCompleted && (
                <p className="text-xs text-center text-muted-foreground">
                  {lessons.length - completedCount} lesson
                  {lessons.length - completedCount !== 1 ? "s" : ""} remaining
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certificate */}
          {certificate && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificate Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-green-700">
                  #{certificate.certificate_number}
                </p>
                <p className="text-xs text-green-700">
                  Issued:{" "}
                  {new Date(certificate.issued_at).toLocaleDateString()}
                </p>
                {certificate.expires_at && (
                  <p className="text-xs text-green-700">
                    Expires:{" "}
                    {new Date(certificate.expires_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
