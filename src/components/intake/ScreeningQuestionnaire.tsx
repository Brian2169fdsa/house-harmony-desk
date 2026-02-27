import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { screenLead, DEFAULT_SCREENING_QUESTIONS, type ScreeningQuestion } from "@/services/agents/intakeScreeningAgent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ScreeningQuestionnaireProps {
  lead: any;
  open: boolean;
  onClose: () => void;
  questions?: ScreeningQuestion[];
}

export function ScreeningQuestionnaire({
  lead,
  open,
  onClose,
  questions = DEFAULT_SCREENING_QUESTIONS,
}: ScreeningQuestionnaireProps) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const submitMutation = useMutation({
    mutationFn: async () => {
      return screenLead(lead, answers);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["ai-screening", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["intake-leads"] });
      queryClient.invalidateQueries({ queryKey: ["agent_actions_log"] });
      toast.success(`Screening complete — Score: ${result.fitScore}, Recommendation: ${result.recommendation}`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Screening failed");
    },
  });

  const handleChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Screening Questionnaire
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Phone screen for <span className="font-medium">{lead.name}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <Label className="text-sm">
                {q.question}
                {q.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              {q.type === "yes_no" ? (
                <Select
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => handleChange(q.id, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : q.type === "date" ? (
                <Input
                  type="date"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  className="h-9"
                />
              ) : q.type === "select" && q.options ? (
                <Select
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => handleChange(q.id, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="Enter response…"
                  className="h-9"
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-3">
            <Button
              className="flex-1"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                "Submit & Score"
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
