import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Award,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-to-HTML renderer for basic formatting
  const html = content
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted pl-4 my-2 text-muted-foreground italic">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal list-inside">$1</li>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\[ \](.+)$/gm, '<div class="flex items-start gap-2 my-1"><span>☐</span><span>$1</span></div>')
    .replace(/\[x\](.+)$/gm, '<div class="flex items-start gap-2 my-1"><span>☑</span><span>$1</span></div>')
    .replace(/\n\n/g, "</p><p class=\"mb-3\">")
    .replace(/\n/g, "<br/>");

  return (
    <div
      className="prose prose-sm max-w-none text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${html}</p>` }}
    />
  );
}

function QuizEngine({
  questions,
  passingScore,
  lessonId,
  userId,
  onPassed,
}: {
  questions: any[];
  passingScore: number;
  lessonId: string;
  userId: string;
  onPassed: () => void;
}) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const submitMutation = useMutation({
    mutationFn: async (answersArr: number[]) => {
      const correct = answersArr.filter(
        (ans, i) => ans === questions[i].correct_index
      ).length;
      const pct = Math.round((correct / questions.length) * 100);
      const passed = pct >= passingScore;

      const { error } = await supabase.from("lms_quiz_attempts").insert({
        user_id: userId,
        lesson_id: lessonId,
        answers_json: answersArr,
        score: pct,
        passed,
      });
      if (error) throw error;
      return { pct, passed };
    },
    onSuccess: ({ pct, passed }) => {
      setScore(pct);
      setSubmitted(true);
      if (passed) {
        queryClient.invalidateQueries({ queryKey: ["lms-quiz-attempts"] });
        onPassed();
      }
    },
    onError: () => toast.error("Failed to submit quiz"),
  });

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  if (submitted) {
    const passed = score >= passingScore;
    return (
      <Card className={passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardContent className="pt-6 text-center">
          {passed ? (
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
          ) : (
            <Circle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          )}
          <p className="text-2xl font-bold mb-1">{score}%</p>
          <p className={`font-medium mb-3 ${passed ? "text-green-700" : "text-red-700"}`}>
            {passed ? "Quiz Passed!" : `Not quite — need ${passingScore}%`}
          </p>
          {!passed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setScore(0);
              }}
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lesson Quiz</CardTitle>
        <p className="text-xs text-muted-foreground">
          {questions.length} questions · {passingScore}% to pass
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, i) => {
          const options: string[] = Array.isArray(q.options_json)
            ? q.options_json
            : JSON.parse(q.options_json);

          return (
            <div key={q.id}>
              <p className="font-medium text-sm mb-3">
                {i + 1}. {q.question}
              </p>
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [i]: parseInt(val) }))
                }
              >
                {options.map((opt, j) => (
                  <div key={j} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={j.toString()}
                      id={`q${i}-opt${j}`}
                    />
                    <Label
                      htmlFor={`q${i}-opt${j}`}
                      className="text-sm cursor-pointer"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        })}

        <Button
          className="w-full"
          disabled={!allAnswered || submitMutation.isPending}
          onClick={() =>
            submitMutation.mutate(
              questions.map((_, i) => answers[i] ?? -1)
            )
          }
        >
          {submitMutation.isPending ? "Submitting…" : "Submit Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LessonViewer() {
  const { id: courseId, lessonId } = useParams<{
    id: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const userId = session?.user?.id;

  const { data: course } = useQuery({
    queryKey: ["lms-course", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lms-lessons", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: lesson } = useQuery({
    queryKey: ["lms-lesson", lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_lessons")
        .select("*")
        .eq("id", lessonId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["lms-quiz-questions", lessonId],
    enabled: !!lessonId && !!lesson?.has_quiz,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_quiz_questions")
        .select("*")
        .eq("lesson_id", lessonId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lms-lesson-progress", userId, courseId],
    enabled: !!userId && !!courseId,
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

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["lms-quiz-attempts", userId, lessonId],
    enabled: !!userId && !!lessonId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_quiz_attempts")
        .select("*")
        .eq("user_id", userId!)
        .eq("lesson_id", lessonId!)
        .order("attempted_at", { ascending: false });
      return data || [];
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      // Mark lesson complete
      const { error: lpError } = await supabase
        .from("lms_lesson_progress")
        .insert({ user_id: userId!, lesson_id: lessonId! })
        .select();
      // Ignore duplicate error (already completed)
      if (lpError && !lpError.message.includes("duplicate")) throw lpError;

      // Recalculate enrollment progress
      const allLessonIds = lessons.map((l) => l.id);
      const { data: progress } = await supabase
        .from("lms_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId!)
        .in("lesson_id", allLessonIds);
      const doneIds = new Set((progress || []).map((p) => p.lesson_id));
      doneIds.add(lessonId!); // include current

      const progressPct = Math.round((doneIds.size / allLessonIds.length) * 100);
      const isComplete = doneIds.size === allLessonIds.length;

      await supabase
        .from("lms_enrollments")
        .update({
          progress_pct: progressPct,
          status: isComplete ? "completed" : "in_progress",
          completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq("user_id", userId!)
        .eq("course_id", courseId!);

      // Issue certificate if course complete
      if (isComplete && course) {
        const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}`;
        await supabase
          .from("lms_certificates")
          .insert({
            user_id: userId!,
            course_id: courseId!,
            certificate_number: certNumber,
          })
          .select();
        // Ignore conflict (certificate already issued)
      }

      return { isComplete };
    },
    onSuccess: ({ isComplete }) => {
      queryClient.invalidateQueries({ queryKey: ["lms-lesson-progress"] });
      queryClient.invalidateQueries({ queryKey: ["lms-enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["lms-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["lms-certificates"] });

      if (isComplete) {
        toast.success("Course complete! Certificate issued.");
      } else {
        toast.success("Lesson marked complete.");
      }
    },
    onError: (e: any) => {
      if (e?.message?.includes("duplicate")) {
        toast.info("Already marked complete");
      } else {
        toast.error("Failed to mark complete");
      }
    },
  });

  if (!lesson || !course) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading…</div>
    );
  }

  const completedLessonIds = new Set(lessonProgress.map((p) => p.lesson_id));
  const currentIdx = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;
  const isLessonComplete = completedLessonIds.has(lessonId!);
  const quizPassed = quizAttempts.some((a) => a.passed);
  const canComplete = !lesson.has_quiz || quizPassed;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left nav */}
      <aside className="w-64 flex-shrink-0 flex flex-col">
        <Button
          variant="ghost"
          className="h-8 px-2 mb-4 self-start"
          onClick={() => navigate(`/training/courses/${courseId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div
          className="rounded-lg p-3 mb-3 text-white text-sm font-medium"
          style={{ backgroundColor: course.cover_color }}
        >
          {course.title}
        </div>

        <div className="overflow-y-auto flex-1 space-y-1">
          {lessons.map((l, idx) => {
            const done = completedLessonIds.has(l.id);
            const isActive = l.id === lessonId;
            return (
              <button
                key={l.id}
                onClick={() =>
                  navigate(`/training/courses/${courseId}/lesson/${l.id}`)
                }
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-muted"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">
                  {idx + 1}. {l.title}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Lesson {currentIdx + 1} of {lessons.length}
              </p>
              <h1 className="text-xl font-bold">{lesson.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {lesson.duration_minutes} min
                </Badge>
                {lesson.has_quiz && (
                  <Badge variant="outline" className="text-xs">
                    Includes quiz
                  </Badge>
                )}
                {isLessonComplete && (
                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <Award
              className="h-6 w-6 text-muted-foreground flex-shrink-0"
              style={{ color: isLessonComplete ? course.cover_color : undefined }}
            />
          </div>

          {/* Content */}
          {lesson.content_type === "text" && lesson.content_body && (
            <div className="rounded-lg border bg-card p-6">
              <MarkdownContent content={lesson.content_body} />
            </div>
          )}

          {lesson.content_type === "video" && lesson.content_url && (
            <div className="rounded-lg border overflow-hidden">
              <iframe
                src={lesson.content_url}
                className="w-full aspect-video"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {lesson.content_type === "pdf" && lesson.content_url && (
            <div className="rounded-lg border p-6 text-center">
              <a
                href={lesson.content_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open PDF Document
              </a>
            </div>
          )}

          {/* Quiz */}
          {lesson.has_quiz && questions.length > 0 && (
            <QuizEngine
              questions={questions}
              passingScore={course.passing_score}
              lessonId={lessonId!}
              userId={userId!}
              onPassed={() => {
                queryClient.invalidateQueries({
                  queryKey: ["lms-quiz-attempts"],
                });
              }}
            />
          )}

          {/* Complete / Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              disabled={!prevLesson}
              onClick={() =>
                prevLesson &&
                navigate(
                  `/training/courses/${courseId}/lesson/${prevLesson.id}`
                )
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!isLessonComplete && (
                <Button
                  disabled={!canComplete || markCompleteMutation.isPending}
                  onClick={() => markCompleteMutation.mutate()}
                >
                  {markCompleteMutation.isPending
                    ? "Saving…"
                    : lesson.has_quiz && !quizPassed
                    ? "Pass quiz to complete"
                    : "Mark Complete"}
                </Button>
              )}

              {nextLesson && (
                <Button
                  variant={isLessonComplete ? "default" : "outline"}
                  onClick={() =>
                    navigate(
                      `/training/courses/${courseId}/lesson/${nextLesson.id}`
                    )
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
