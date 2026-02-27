import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, PlayCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function CoursesCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });
  const userId = session?.user?.id;

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["lms-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["lms-enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_enrollments")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("lms_enrollments").insert({
        user_id: userId!,
        course_id: courseId,
        status: "enrolled",
        progress_pct: 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["lms-enrollments"] });
      toast.success("Enrolled! Good luck.");
      navigate(`/training/courses/${courseId}`);
    },
    onError: () => toast.error("Enrollment failed"),
  });

  const enrollmentMap = Object.fromEntries(
    enrollments.map((e) => [e.course_id, e])
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground">Loading courses…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Course Catalog</h1>
        <p className="text-muted-foreground">
          {courses.length} courses · Staff training for recovery housing operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const enrollment = enrollmentMap[course.id];
          const isCompleted = enrollment?.status === "completed";
          const isInProgress = enrollment?.status === "in_progress";
          const isEnrolled = enrollment?.status === "enrolled";

          return (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Color header */}
              <div
                className="h-2"
                style={{ backgroundColor: course.cover_color }}
              />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    {course.title}
                  </CardTitle>
                  {isCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {course.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {course.category.replace(/-/g, " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {course.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.estimated_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.passing_score}% to pass
                  </span>
                </div>

                {(isInProgress || isEnrolled) && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress_pct}%</span>
                    </div>
                    <Progress value={enrollment.progress_pct} className="h-1.5" />
                  </div>
                )}

                <div className="mt-auto pt-2">
                  {isCompleted ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/training/courses/${course.id}`)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Completed — Review
                    </Button>
                  ) : isInProgress || isEnrolled ? (
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/training/courses/${course.id}`)}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="default"
                      style={{ backgroundColor: course.cover_color }}
                      disabled={!userId || enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(course.id)}
                    >
                      Enroll Now
                    </Button>
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
