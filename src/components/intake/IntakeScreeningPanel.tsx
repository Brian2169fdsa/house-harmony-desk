import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { screenLead, type ScreeningResult } from "@/services/agents/intakeScreeningAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface IntakeScreeningPanelProps {
  lead: any;
}

const SCORE_COLORS = {
  high: "text-green-600",
  medium: "text-amber-600",
  low: "text-red-600",
};

const REC_CONFIG = {
  approve: { icon: CheckCircle2, color: "bg-green-100 text-green-700", label: "Approve" },
  review: { icon: AlertTriangle, color: "bg-amber-100 text-amber-700", label: "Review" },
  reject: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Reject" },
};

const FLAG_LABELS: Record<string, string> = {
  FELONY_CONVICTION: "Felony conviction disclosed",
  MAT_MEDICATIONS: "Currently on MAT medications",
  NO_VALID_ID: "No valid ID available",
  CANNOT_PAY_MOVE_IN: "Cannot pay move-in costs",
  REFUSES_DRUG_TESTING: "Refuses random drug testing",
  UNEMPLOYED: "Not employed, not seeking",
  SEX_OFFENDER_REGISTRY: "Sex offender registry",
  HISTORY_OF_VIOLENCE: "History of violence",
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600";
  const bgColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/30"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">Fit Score</span>
    </div>
  );
}

export function IntakeScreeningPanel({ lead }: IntakeScreeningPanelProps) {
  const queryClient = useQueryClient();

  // Fetch existing screening result
  const { data: screening, isLoading } = useQuery({
    queryKey: ["ai-screening", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_screening_results")
        .select("*")
        .eq("lead_id", lead.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Run screening mutation
  const screenMutation = useMutation({
    mutationFn: async () => {
      return screenLead(lead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-screening", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["intake-leads"] });
      queryClient.invalidateQueries({ queryKey: ["agent_actions_log"] });
      toast.success("Lead screened successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Screening failed");
    },
  });

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("ai_screening_results")
        .update({
          operator_override: decision,
          override_by: user?.id ?? null,
          override_at: new Date().toISOString(),
        })
        .eq("lead_id", lead.id);
      if (error) throw error;

      if (decision === "approve" && lead.status === "lead") {
        await supabase
          .from("intake_leads")
          .update({ status: "application", updated_at: new Date().toISOString() })
          .eq("id", lead.id);
      }
    },
    onSuccess: (_, decision) => {
      queryClient.invalidateQueries({ queryKey: ["ai-screening", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["intake-leads"] });
      toast.success(`Lead ${decision === "approve" ? "approved" : "rejected"} by operator`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Override failed");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          Loading screening data…
        </CardContent>
      </Card>
    );
  }

  // No screening yet
  if (!screening) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Screening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Run AI screening to score this lead and get a recommendation.
          </p>
          <Button
            size="sm"
            onClick={() => screenMutation.mutate()}
            disabled={screenMutation.isPending}
          >
            {screenMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Screening…
              </>
            ) : (
              <>
                <Bot className="h-3.5 w-3.5 mr-1.5" />
                Screen Lead
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Screening exists
  const rec = REC_CONFIG[screening.agent_recommendation as keyof typeof REC_CONFIG] ?? REC_CONFIG.review;
  const RecIcon = rec.icon;
  const flags = (screening.flags as string[]) ?? [];
  const hasOverride = !!screening.operator_override;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Screening
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => screenMutation.mutate()}
            disabled={screenMutation.isPending}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${screenMutation.isPending ? "animate-spin" : ""}`} />
            Re-screen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ScoreGauge score={screening.fit_score ?? 0} />
          <div className="flex-1 space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rec.color}`}>
              <RecIcon className="h-3.5 w-3.5" />
              {rec.label}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {screening.recommendation_reason}
            </p>
            {hasOverride && (
              <Badge variant={screening.operator_override === "approve" ? "default" : "destructive"} className="text-xs">
                Operator: {screening.operator_override}
              </Badge>
            )}
          </div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium mb-1.5">Flags</p>
              <div className="space-y-1">
                {flags.map((flag) => (
                  <div key={flag} className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-muted-foreground">
                      {FLAG_LABELS[flag] ?? flag.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Override buttons */}
        {!hasOverride && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => overrideMutation.mutate("approve")}
                disabled={overrideMutation.isPending}
              >
                <ThumbsUp className="h-3 w-3 mr-1.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => overrideMutation.mutate("reject")}
                disabled={overrideMutation.isPending}
              >
                <ThumbsDown className="h-3 w-3 mr-1.5" />
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
