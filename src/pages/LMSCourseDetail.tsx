import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Video,
  HelpCircle,
  Lock,
  Award,
} from "lucide-react";
import { format } from "date-fns";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_color: string;
  estimated_minutes: number;
  passing_score: number;
  is_required: boolean;
}

interface Lesson {
  id: string;
  course_id: string;
  sort_order: number;
  title: string;
  content_type: string;
  duration_minutes: number;
  has_quiz: boolean;
}

interface Enrollment {
  id: string;
  status: string;
  progress_pct: number;
  completed_at: string | null;
}

interface LessonProgress {
  lesson_id: string;
  completed_at: string;
}

const CONTENT_ICONS: Record<string, React.ElementType> = {
  text: FileText,
  video: Video,
  pdf: FileText,
};

export default function LMSCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const { data: course } = useQuery({
    queryKey: ["lms_course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lms_lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["lms_enrollment", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_enrollments")
        .select("*")
        .eq("course_id", courseId!)
        .eq("user_id", userId!)
        .maybeSingle();
      return data as Enrollment | null;
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lms_lesson_progress_course", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      if (!lessons.length) return [];
      const lessonIds = lessons.map((l) => l.id);
      const { data, error } = await supabase
        .from("lms_lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", userId!)
        .in("lesson_id", lessonIds);
      if (error) throw error;
      return (data ?? []) as LessonProgress[];
    },
    enabled: !!lessons.length && !!userId,
  });

  const { data: certificate } = useQuery({
    queryKey: ["lms_cert", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_certificates")
        .select("*")
        .eq("course_id", courseId!)
        .eq("user_id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !courseId) throw new Error("Not authenticated");
      const { error } = await supabase.from("lms_enrollments").insert({
        user_id: userId,
        course_id: courseId,
        status: "enrolled",
        progress_pct: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lms_enrollment", courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ["lms_enrollments", userId] });
    },
  });

  const completedSet = new Set(lessonProgress.map((p) => p.lesson_id));
  const completedCount = lessonProgress.length;
  const totalCount = lessons.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find first incomplete lesson for "Continue" button
  const nextLesson = lessons.find((l) => !completedSet.has(l.id));

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/training")}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        All Courses
      </Button>

      {/* Course Header */}
      <Card className="overflow-hidden">
        <div className="h-3" style={{ backgroundColor: course.cover_color }} />
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{course.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {course.is_required && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.estimated_minutes} minutes
            </span>
            <span>{lessons.length} lessons</span>
            <span>Passing score: {course.passing_score}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollment ? (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {totalCount} lessons completed
                </p>
              </div>

              {certificate && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Certificate Earned
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      #{(certificate as any).certificate_number} · Issued{" "}
                      {format(new Date((certificate as any).issued_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {nextLesson && (
                <Button
                  onClick={() => navigate(`/training/${courseId}/${nextLesson.id}`)}
                  className="w-full"
                >
                  Continue: {nextLesson.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="w-full"
            >
              {enrollMutation.isPending ? "Enrolling..." : "Enroll in This Course"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lessons List */}
      <div className="space-y-2">
        <h2 className="font-semibold">Course Content</h2>
        {lessons.map((lesson, i) => {
          const isCompleted = completedSet.has(lesson.id);
          const isLocked =
            enrollment === null && lesson.sort_order > 0;
          const ContentIcon = CONTENT_ICONS[lesson.content_type] ?? FileText;

          return (
            <Card
              key={lesson.id}
              className={`cursor-pointer transition-colors ${
                !enrollment
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-muted/30"
              }`}
              onClick={() => {
                if (!enrollment) return;
                navigate(`/training/${courseId}/${lesson.id}`);
              }}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : !enrollment ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium ${
                          isCompleted ? "text-muted-foreground" : ""
                        }`}
                      >
                        {lesson.title}
                      </span>
                      {lesson.has_quiz && (
                        <Badge variant="outline" className="text-xs py-0">
                          <HelpCircle className="h-2.5 w-2.5 mr-1" />
                          Quiz
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <ContentIcon className="h-3 w-3" />
                        {lesson.content_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lesson.duration_minutes} min
                      </span>
                    </div>
                  </div>

                  {enrollment && !isCompleted && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
