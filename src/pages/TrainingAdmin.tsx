import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function TrainingAdmin() {
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

  const { data: profiles = [] } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, user_id, full_name, role")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["lms-all-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_enrollments")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["lms-all-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_certificates")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Build lookup: enrollmentMap[user_id][course_id]
  const enrollmentMap: Record<string, Record<string, any>> = {};
  for (const e of enrollments) {
    if (!enrollmentMap[e.user_id]) enrollmentMap[e.user_id] = {};
    enrollmentMap[e.user_id][e.course_id] = e;
  }

  const certSet = new Set(certificates.map((c) => `${c.user_id}::${c.course_id}`));

  // Per-course completion stats
  const courseStats = courses.map((course) => {
    const courseEnrollments = enrollments.filter(
      (e) => e.course_id === course.id
    );
    const completed = courseEnrollments.filter(
      (e) => e.status === "completed"
    ).length;
    const total = profiles.length;
    return {
      ...course,
      enrolledCount: courseEnrollments.length,
      completedCount: completed,
      totalStaff: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    regional_manager: "Regional Mgr",
    house_manager: "House Mgr",
    staff: "Staff",
    investor: "Investor",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Training Compliance
        </h1>
        <p className="text-muted-foreground">
          Staff completion status across all training courses
        </p>
      </div>

      {/* Course completion rates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courseStats.map((course) => (
          <Card key={course.id}>
            <CardHeader className="pb-2">
              <div
                className="h-1 rounded-full mb-2"
                style={{ backgroundColor: course.cover_color }}
              />
              <CardTitle className="text-sm leading-snug line-clamp-2">
                {course.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {course.completedCount} / {course.totalStaff} staff
                </span>
                <span className="font-medium">{course.completionRate}%</span>
              </div>
              <Progress value={course.completionRate} className="h-2" />
              {course.is_required && (
                <p className="text-xs text-muted-foreground mt-2">
                  Required · {course.totalStaff - course.completedCount} pending
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff × course matrix */}
      {profiles.length > 0 && courses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Staff Completion Matrix</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  {courses.map((c) => (
                    <TableHead
                      key={c.id}
                      className="text-center min-w-[100px] text-xs"
                    >
                      <span className="block truncate max-w-[90px]" title={c.title}>
                        {c.title.split(":")[0].split("–")[0].trim()}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const userEnrollments = enrollmentMap[profile.user_id] || {};
                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[profile.role] ?? profile.role}
                        </Badge>
                      </TableCell>
                      {courses.map((course) => {
                        const enrollment = userEnrollments[course.id];
                        const hasCert = certSet.has(
                          `${profile.user_id}::${course.id}`
                        );

                        return (
                          <TableCell
                            key={course.id}
                            className="text-center"
                          >
                            {hasCert ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                            ) : enrollment?.status === "in_progress" ? (
                              <Clock className="h-4 w-4 text-amber-500 mx-auto" />
                            ) : enrollment?.status === "enrolled" ? (
                              <Clock className="h-4 w-4 text-blue-400 mx-auto" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground mx-auto" />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {profiles.length === 0
              ? "No staff profiles found. Add staff members to track compliance."
              : "No courses available."}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Legend: ✓ Completed · ⏱ In Progress · ○ Not Started
      </p>
    </div>
  );
}
