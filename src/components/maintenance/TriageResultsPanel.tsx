import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { triageRequest, type TriageResult } from "@/services/agents/maintenanceTriageAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Brain, Zap, User, DollarSign, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Props = { requestId: string };

const CONFIDENCE_COLORS: Record<string, string> = {
  high:   "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low:    "bg-gray-100 text-gray-700",
};
const PRIORITY_COLORS: Record<string, string> = {
  high:   "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low:    "bg-blue-100 text-blue-800",
};

export function TriageResultsPanel({ requestId }: Props) {
  const queryClient = useQueryClient();

  const { data: triageLog, isLoading } = useQuery({
    queryKey: ["triage_log", requestId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_actions_log")
        .select("output_json, created_at")
        .eq("agent_type", "maintenance_triage")
        .eq("entity_id", requestId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const retrigger = useMutation({
    mutationFn: () => triageRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triage_log", requestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests"] });
      toast.success("Triage re-run complete");
    },
    onError: () => toast.error("Triage failed"),
  });

  const apply = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: unknown }) => {
      const { error } = await supabase
        .from("maintenance_requests")
        .update({ [field]: value })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests"] });
      toast.success("Applied");
    },
    onError: () => toast.error("Failed to apply"),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground p-3">Loading triage data…</p>;

  if (!triageLog) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span className="text-sm">AI triage not yet run for this request.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => retrigger.mutate()}
            disabled={retrigger.isPending}
          >
            <Zap className="h-3 w-3 mr-1" /> Run Triage
          </Button>
        </CardContent>
      </Card>
    );
  }

  const result = triageLog.output_json as TriageResult;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" /> AI Triage Results
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => retrigger.mutate()}
            disabled={retrigger.isPending}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${retrigger.isPending ? "animate-spin" : ""}`} /> Re-run
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 text-sm">

        {/* Category */}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Detected Category</p>
          <div className="flex items-center gap-2">
            <span className="font-medium capitalize">{result.detectedCategory}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[result.categoryConfidence]}`}>
              {result.categoryConfidence} confidence
            </span>
          </div>
          {result.categoryKeywordsMatched?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Keywords: {result.categoryKeywordsMatched.slice(0, 4).join(", ")}
            </p>
          )}
        </div>

        <Separator />

        {/* Priority */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Suggested Priority</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_COLORS[result.suggestedPriority]}`}>
                {result.suggestedPriority}
              </span>
              <span className="text-xs text-muted-foreground">{result.priorityReason}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => apply.mutate({ field: "priority", value: result.suggestedPriority })}
            disabled={apply.isPending}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Apply
          </Button>
        </div>

        {result.suggestedVendorName && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Suggested Vendor</p>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{result.suggestedVendorName}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => apply.mutate({ field: "vendor_id", value: result.suggestedVendorId })}
                disabled={apply.isPending}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Assign
              </Button>
            </div>
          </>
        )}

        {result.costEstimate != null && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Cost Estimate</p>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="font-medium">${result.costEstimate.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{result.costEstimateBasis}</span>
              </div>
            </div>
          </>
        )}

        {result.slaDeadlineAt && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">SLA Response Deadline</p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-orange-500" />
                <span className="font-medium">
                  {format(new Date(result.slaDeadlineAt), "MMM d, h:mm a")}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({result.slaDeadlineHours}h SLA)
                </span>
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground pt-1">
          Triaged{" "}
          {(triageLog as any).created_at
            ? format(new Date((triageLog as any).created_at), "MMM d, yyyy h:mm a")
            : "recently"}
        </p>
      </CardContent>
    </Card>
  );
}
