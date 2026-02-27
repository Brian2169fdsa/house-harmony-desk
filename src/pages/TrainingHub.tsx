import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, Award, ChevronRight, PlayCircle } from "lucide-react";

export default function TrainingHub() {
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = session?.user?.id;

  const { data: courses = [] } = useQuery({
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

  const { data: certificates = [] } = useQuery({
    queryKey: ["lms-certificates", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_certificates")
        .select("*, course:lms_courses(title, cover_color)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });

  const enrollmentMap = Object.fromEntries(
    enrollments.map((e) => [e.course_id, e])
  );

  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const inProgressCourses = courses.filter(
    (c) => enrollmentMap[c.id]?.status === "in_progress"
  );
  const requiredNotDone = courses.filter(
    (c) => c.is_required && enrollmentMap[c.id]?.status !== "completed"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Hub</h1>
          <p className="text-muted-foreground">Your learning dashboard</p>
        </div>
        <Button onClick={() => navigate("/training/courses")}>
          <BookOpen className="mr-2 h-4 w-4" />
          Browse All Courses
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">
                  of {courses.length} courses completed
                </p>
              </div>
            </div>
            {courses.length > 0 && (
              <Progress
                value={(completedCount / courses.length) * 100}
                className="mt-3"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCourses.length}</p>
                <p className="text-sm text-muted-foreground">courses in progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates.length}</p>
                <p className="text-sm text-muted-foreground">certificates earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required courses alert */}
      {requiredNotDone.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-800">
              Required Training Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 mb-3">
              {requiredNotDone.length} required course{requiredNotDone.length !== 1 ? "s" : ""} not yet completed.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-800"
              onClick={() => navigate("/training/courses")}
            >
              View Required Courses
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Continue in-progress courses */}
      {inProgressCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgressCourses.map((course) => {
              const enrollment = enrollmentMap[course.id];
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/training/courses/${course.id}`)}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: course.cover_color + "33" }}
                  >
                    <div
                      className="h-full w-full rounded-lg flex items-center justify-center"
                    >
                      <PlayCircle className="h-5 w-5" style={{ color: course.cover_color }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{course.title}</p>
                    <Progress
                      value={enrollment?.progress_pct ?? 0}
                      className="h-1.5 mt-1"
                    />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {enrollment?.progress_pct ?? 0}%
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certificates Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {(certificates as any[]).map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cert.course?.cover_color + "33" }}
                  >
                    <Award className="h-5 w-5" style={{ color: cert.course?.cover_color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cert.course?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      #{cert.certificate_number} ·{" "}
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Certified
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {courses.length > 0 && enrollments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Your Training</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Browse the course catalog and enroll in your first course.
            </p>
            <Button onClick={() => navigate("/training/courses")}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
