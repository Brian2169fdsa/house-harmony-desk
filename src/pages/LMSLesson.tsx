import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface Lesson {
  id: string;
  course_id: string;
  sort_order: number;
  title: string;
  content_type: string;
  content_url: string | null;
  content_body: string | null;
  duration_minutes: number;
  has_quiz: boolean;
}

interface QuizQuestion {
  id: string;
  lesson_id: string;
  sort_order: number;
  question: string;
  options_json: string[];
  correct_index: number;
  explanation: string | null;
}

interface QuizAttempt {
  score: number;
  passed: boolean;
  answers_json: number[];
  attempted_at: string;
}

type QuizPhase = "not_started" | "in_progress" | "submitted";

export default function LMSLesson() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Quiz state
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("not_started");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const { data: lesson } = useQuery({
    queryKey: ["lms_lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_lessons")
        .select("*")
        .eq("id", lessonId!)
        .single();
      if (error) throw error;
      return data as Lesson;
    },
    enabled: !!lessonId,
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ["lms_lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_lessons")
        .select("id, sort_order, title")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!courseId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["lms_quiz_questions", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_quiz_questions")
        .select("*")
        .eq("lesson_id", lessonId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as QuizQuestion[];
    },
    enabled: !!lessonId,
  });

  const { data: lastAttempt } = useQuery({
    queryKey: ["lms_quiz_attempt", lessonId, userId],
    enabled: !!lessonId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_quiz_attempts")
        .select("*")
        .eq("lesson_id", lessonId!)
        .eq("user_id", userId!)
        .order("attempted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as QuizAttempt | null;
    },
  });

  const { data: lessonProgressEntry } = useQuery({
    queryKey: ["lms_lesson_done", lessonId, userId],
    enabled: !!lessonId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_lesson_progress")
        .select("completed_at")
        .eq("lesson_id", lessonId!)
        .eq("user_id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: enrollmentData } = useQuery({
    queryKey: ["lms_enrollment", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_enrollments")
        .select("id, status, progress_pct")
        .eq("course_id", courseId!)
        .eq("user_id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (quizScore?: number) => {
      if (!userId || !lessonId || !courseId) throw new Error("Not authenticated");

      // Upsert lesson progress
      const { error: progErr } = await supabase
        .from("lms_lesson_progress")
        .upsert(
          { user_id: userId, lesson_id: lessonId },
          { onConflict: "user_id,lesson_id" }
        );
      if (progErr) throw progErr;

      // Recalculate course progress
      const lessonIds = (allLessons as any[]).map((l: any) => l.id);
      const { data: allProgress } = await supabase
        .from("lms_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds);

      const doneCount = (allProgress ?? []).length + 1; // +1 for the one we just added
      const pct = Math.round((doneCount / lessonIds.length) * 100);
      const isCourseDone = doneCount >= lessonIds.length;

      const enrollUpdates: Record<string, any> = {
        progress_pct: Math.min(pct, 100),
        status: isCourseDone ? "completed" : "in_progress",
      };
      if (isCourseDone) {
        enrollUpdates.completed_at = new Date().toISOString();
      }

      if (enrollmentData?.id) {
        await supabase
          .from("lms_enrollments")
          .update(enrollUpdates)
          .eq("id", enrollmentData.id);
      }

      // Issue certificate if course complete
      if (isCourseDone) {
        const certNum = `CERT-${courseId!.substring(0, 8).toUpperCase()}-${Date.now()}`;
        await supabase.from("lms_certificates").upsert(
          { user_id: userId, course_id: courseId!, certificate_number: certNum },
          { onConflict: "user_id,course_id" }
        );
      }

      return { isCourseDone, pct };
    },
    onSuccess: ({ isCourseDone }) => {
      queryClient.invalidateQueries({ queryKey: ["lms_lesson_done", lessonId, userId] });
      queryClient.invalidateQueries({ queryKey: ["lms_enrollment", courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ["lms_enrollments", userId] });
      queryClient.invalidateQueries({ queryKey: ["lms_lesson_progress_course", courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ["lms_cert", courseId, userId] });

      if (isCourseDone) {
        toast.success("Course complete! Certificate issued.");
        navigate(`/training/${courseId}`);
      } else {
        toast.success("Lesson complete!");
        // Navigate to next lesson
        const currentIdx = (allLessons as any[]).findIndex(
          (l: any) => l.id === lessonId
        );
        const nextLesson = (allLessons as any[])[currentIdx + 1];
        if (nextLesson) {
          navigate(`/training/${courseId}/${nextLesson.id}`);
        } else {
          navigate(`/training/${courseId}`);
        }
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !lessonId) throw new Error("Not authenticated");

      const answers = questions.map((_, i) => selectedAnswers[i] ?? -1);
      const correct = questions.filter((q, i) => selectedAnswers[i] === q.correct_index).length;
      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

      // Fetch passing score from course
      const { data: courseData } = await supabase
        .from("lms_courses")
        .select("passing_score")
        .eq("id", courseId!)
        .single();

      const passingScore = courseData?.passing_score ?? 80;
      const passed = score >= passingScore;

      await supabase.from("lms_quiz_attempts").insert({
        user_id: userId,
        lesson_id: lessonId,
        answers_json: answers,
        score,
        passed,
      });

      return { score, passed, answers };
    },
    onSuccess: ({ score, passed }) => {
      queryClient.invalidateQueries({ queryKey: ["lms_quiz_attempt", lessonId, userId] });
      setQuizPhase("submitted");
      if (passed) {
        toast.success(`Quiz passed! Score: ${score}%`);
        markCompleteMutation.mutate(score);
      } else {
        toast.error(`Score: ${score}% — need ${80}% to pass. Try again.`);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLessonComplete = !!lessonProgressEntry;
  const currentIdx = (allLessons as any[]).findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? (allLessons as any[])[currentIdx - 1] : null;
  const nextLessonData = currentIdx < (allLessons as any[]).length - 1 ? (allLessons as any[])[currentIdx + 1] : null;

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/training/${courseId}`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Course
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground truncate">{lesson.title}</span>
      </div>

      {/* Lesson Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {lesson.duration_minutes} min
            </span>
            <Badge variant="outline" className="capitalize">
              {lesson.content_type}
            </Badge>
            {lesson.has_quiz && (
              <Badge variant="secondary">
                <HelpCircle className="h-3 w-3 mr-1" />
                Quiz
              </Badge>
            )}
          </div>
        </div>
        {isLessonComplete && (
          <Badge className="bg-green-600 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Complete
          </Badge>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {lesson.content_type === "text" && lesson.content_body && (
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
              {lesson.content_body}
            </div>
          )}

          {lesson.content_type === "video" && lesson.content_url && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={lesson.content_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {lesson.content_type === "pdf" && lesson.content_url && (
            <div className="space-y-3">
              <iframe
                src={lesson.content_url}
                className="w-full h-[600px] rounded-lg border"
                title={lesson.title}
              />
              <a
                href={lesson.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                Open PDF in new tab
              </a>
            </div>
          )}

          {!lesson.content_body && !lesson.content_url && (
            <p className="text-muted-foreground text-center py-8">
              No content available for this lesson.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quiz Section */}
      {lesson.has_quiz && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5" />
              Knowledge Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {lastAttempt && lastAttempt.passed ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <Award className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Quiz Passed — Score: {lastAttempt.score}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    You can retake to review
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => {
                    setQuizPhase("in_progress");
                    setSelectedAnswers({});
                  }}
                >
                  Retake
                </Button>
              </div>
            ) : quizPhase === "not_started" ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  {questions.length} question{questions.length !== 1 ? "s" : ""} · Must pass to complete this lesson
                </p>
                <Button onClick={() => setQuizPhase("in_progress")}>
                  Start Quiz
                </Button>
              </div>
            ) : (
              <>
                {questions.map((q, qi) => {
                  const options = q.options_json as string[];
                  const submitted = quizPhase === "submitted";
                  const selected = selectedAnswers[qi];
                  const isCorrect = selected === q.correct_index;

                  return (
                    <div key={q.id} className="space-y-3">
                      <p className="font-medium text-sm">
                        {qi + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {options.map((option, oi) => {
                          let optClass =
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ";

                          if (!submitted) {
                            optClass +=
                              selected === oi
                                ? "border-primary bg-primary/10"
                                : "hover:bg-muted/50";
                          } else {
                            if (oi === q.correct_index) {
                              optClass += "border-green-500 bg-green-50 dark:bg-green-950/30";
                            } else if (oi === selected && !isCorrect) {
                              optClass += "border-red-500 bg-red-50 dark:bg-red-950/30";
                            } else {
                              optClass += "opacity-60";
                            }
                          }

                          return (
                            <div
                              key={oi}
                              className={optClass}
                              onClick={() => {
                                if (submitted) return;
                                setSelectedAnswers((prev) => ({
                                  ...prev,
                                  [qi]: oi,
                                }));
                              }}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                  selected === oi
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              />
                              {option}
                            </div>
                          );
                        })}
                      </div>
                      {submitted && q.explanation && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}

                {quizPhase === "in_progress" && (
                  <Button
                    onClick={() => submitQuizMutation.mutate()}
                    disabled={
                      submitQuizMutation.isPending ||
                      Object.keys(selectedAnswers).length < questions.length
                    }
                    className="w-full"
                  >
                    {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                )}

                {quizPhase === "submitted" &&
                  lastAttempt &&
                  !lastAttempt.passed && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setQuizPhase("in_progress");
                        setSelectedAnswers({});
                      }}
                    >
                      Try Again
                    </Button>
                  )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Complete / Navigation */}
      {!lesson.has_quiz && (
        <div className="flex justify-end">
          {!isLessonComplete ? (
            <Button
              onClick={() => markCompleteMutation.mutate()}
              disabled={markCompleteMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {markCompleteMutation.isPending ? "Saving..." : "Mark Complete"}
            </Button>
          ) : nextLessonData ? (
            <Button
              onClick={() =>
                navigate(`/training/${courseId}/${(nextLessonData as any).id}`)
              }
            >
              Next: {(nextLessonData as any).title}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate(`/training/${courseId}`)}>
              Back to Course
            </Button>
          )}
        </div>
      )}

      {/* Prev/Next nav */}
      <div className="flex justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          disabled={!prevLesson}
          onClick={() =>
            prevLesson &&
            navigate(`/training/${courseId}/${(prevLesson as any).id}`)
          }
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Lesson
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!nextLessonData}
          onClick={() =>
            nextLessonData &&
            navigate(`/training/${courseId}/${(nextLessonData as any).id}`)
          }
        >
          Next Lesson
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
