import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { triageRequest, type TriageResult } from "@/services/agents/maintenanceTriageAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Zap,
  User,
  DollarSign,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  Star,
  Shield,
  Tag,
  Edit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Props = { requestId: string };

const CONFIDENCE_BADGE_CLASSES: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const PRIORITY_OPTIONS: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

export function TriageResultsPanel({ requestId }: Props) {
  const queryClient = useQueryClient();
  const [overridingField, setOverridingField] = useState<string | null>(null);

  // Fetch the latest triage log for this request
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

  // Fetch vendor performance stats when we have a suggested vendor
  const result = triageLog?.output_json as TriageResult | undefined;

  const { data: vendorStats } = useQuery({
    queryKey: ["vendor_stats", result?.suggestedVendorId],
    queryFn: async () => {
      if (!result?.suggestedVendorId) return null;

      // Get vendor rating info
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name, is_trusted, active")
        .eq("id", result.suggestedVendorId)
        .maybeSingle();

      // Get past job count for this vendor
      const { count: pastJobs } = await supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", result.suggestedVendorId)
        .eq("status", "complete");

      // Get average rating from completed jobs (using maintenance_feedback if exists)
      const { data: feedback } = await supabase
        .from("maintenance_feedback")
        .select("rating")
        .eq("vendor_id", result.suggestedVendorId);

      const ratings = (feedback ?? []).map((f: any) => Number(f.rating)).filter((r) => r > 0);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;

      return {
        vendor,
        pastJobs: pastJobs ?? 0,
        avgRating,
        ratingCount: ratings.length,
        isTrusted: vendor?.is_trusted ?? false,
      };
    },
    enabled: !!result?.suggestedVendorId,
  });

  // Re-run the triage agent
  const retrigger = useMutation({
    mutationFn: () => triageRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triage_log", requestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setOverridingField(null);
      toast.success("Triage re-run complete");
    },
    onError: () => toast.error("Triage failed"),
  });

  // Apply a single field override to the maintenance request
  const applyOverride = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: unknown }) => {
      const { error } = await supabase
        .from("maintenance_requests")
        .update({ [field]: value })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setOverridingField(null);
      toast.success(`Override applied: ${variables.field} updated`);
    },
    onError: () => toast.error("Failed to apply override"),
  });

  // ─── Loading State ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="border-dashed animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span className="text-sm">Loading triage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── No Triage Yet ────────────────────────────────────────────────────────────

  if (!triageLog || !result) {
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
            <Zap className="h-3 w-3 mr-1" />
            {retrigger.isPending ? "Running..." : "Run Triage"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── SLA Countdown Calculation ────────────────────────────────────────────────

  const slaCountdown = result.slaDeadlineAt
    ? formatDistanceToNow(new Date(result.slaDeadlineAt), { addSuffix: true })
    : null;

  const slaIsOverdue = result.slaDeadlineAt
    ? new Date(result.slaDeadlineAt) < new Date()
    : false;

  // ─── Main Results Panel ───────────────────────────────────────────────────────

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            AI Triage Results
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => retrigger.mutate()}
            disabled={retrigger.isPending}
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${retrigger.isPending ? "animate-spin" : ""}`}
            />
            Re-run
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-4 text-sm">
        {/* ── Category Detection ─────────────────────────────────────────── */}
        <div className="rounded-md border p-3 bg-white/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Detected Category
              </span>
            </div>
            <Badge
              variant="outline"
              className={CONFIDENCE_BADGE_CLASSES[result.categoryConfidence]}
            >
              {result.categoryConfidence} confidence
            </Badge>
          </div>
          <p className="font-semibold capitalize text-base">{result.detectedCategory}</p>
          {result.categoryKeywordsMatched?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {result.categoryKeywordsMatched.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs mt-2 text-muted-foreground"
            onClick={() =>
              setOverridingField(overridingField === "category" ? null : "category")
            }
          >
            <Edit className="h-3 w-3 mr-1" />
            Override Category
          </Button>
          {overridingField === "category" && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
              {[
                "plumbing", "electrical", "hvac", "appliance", "pest",
                "cleaning", "landscaping", "locksmith", "networking", "painting", "general",
              ].map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={cat === result.detectedCategory ? "default" : "outline"}
                  className="h-6 text-xs capitalize"
                  onClick={() => {
                    applyOverride.mutate({ field: "category_override", value: cat });
                    toast.info(`Category overridden to "${cat}"`);
                  }}
                  disabled={applyOverride.isPending}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* ── Priority Suggestion ─────────────────────────────────────────── */}
        <div className="rounded-md border p-3 bg-white/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggested Priority
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`capitalize ${PRIORITY_BADGE_CLASSES[result.suggestedPriority]}`}
                >
                  {result.suggestedPriority}
                </Badge>
                <span className="text-xs text-muted-foreground">{result.priorityReason}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() =>
                applyOverride.mutate({ field: "priority", value: result.suggestedPriority })
              }
              disabled={applyOverride.isPending}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs mt-2 text-muted-foreground"
            onClick={() =>
              setOverridingField(overridingField === "priority" ? null : "priority")
            }
          >
            <Edit className="h-3 w-3 mr-1" />
            Override Priority
          </Button>
          {overridingField === "priority" && (
            <div className="flex gap-2 mt-2 pt-2 border-t">
              {PRIORITY_OPTIONS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === result.suggestedPriority ? "default" : "outline"}
                  className={`h-7 text-xs capitalize flex-1 ${
                    p === "high"
                      ? "hover:bg-red-100"
                      : p === "medium"
                        ? "hover:bg-yellow-100"
                        : "hover:bg-blue-100"
                  }`}
                  onClick={() => {
                    applyOverride.mutate({ field: "priority", value: p });
                  }}
                  disabled={applyOverride.isPending}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* ── Vendor Suggestion ───────────────────────────────────────────── */}
        {result.suggestedVendorName && (
          <div className="rounded-md border p-3 bg-white/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Suggested Vendor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{result.suggestedVendorName}</span>
                  {vendorStats?.isTrusted && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Shield className="h-3 w-3 mr-0.5" />
                      Trusted
                    </Badge>
                  )}
                </div>

                {/* Vendor Performance Stats */}
                {vendorStats && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {vendorStats.avgRating !== null && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {vendorStats.avgRating}/5
                        <span className="text-muted-foreground/60">
                          ({vendorStats.ratingCount} review{vendorStats.ratingCount !== 1 ? "s" : ""})
                        </span>
                      </span>
                    )}
                    <span>
                      {vendorStats.pastJobs} past job{vendorStats.pastJobs !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() =>
                    applyOverride.mutate({
                      field: "vendor_id",
                      value: result.suggestedVendorId,
                    })
                  }
                  disabled={applyOverride.isPending}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Assign
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() =>
                    setOverridingField(overridingField === "vendor" ? null : "vendor")
                  }
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Override
                </Button>
              </div>
            </div>
            {overridingField === "vendor" && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  To assign a different vendor, update the vendor field on the request directly.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    applyOverride.mutate({ field: "vendor_id", value: null });
                  }}
                  disabled={applyOverride.isPending}
                >
                  Clear Vendor Assignment
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Cost Estimate ───────────────────────────────────────────────── */}
        {result.costEstimate != null && (
          <div className="rounded-md border p-3 bg-white/50">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cost Estimate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                ${result.costEstimate.toLocaleString()}
              </span>
              {result.costEstimateBasis && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {result.costEstimateBasis}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* ── SLA Deadline Countdown ──────────────────────────────────────── */}
        {result.slaDeadlineAt && (
          <div
            className={`rounded-md border p-3 ${
              slaIsOverdue ? "bg-red-50 border-red-200" : "bg-white/50"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock
                className={`h-3.5 w-3.5 ${slaIsOverdue ? "text-red-500" : "text-orange-500"}`}
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                SLA Response Deadline
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${slaIsOverdue ? "text-red-600" : ""}`}>
                {slaCountdown}
              </span>
              {slaIsOverdue && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  Overdue
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                ({result.slaDeadlineHours}h SLA window)
              </span>
            </div>
          </div>
        )}

        {/* ── Timestamp ──────────────────────────────────────────────────── */}
        <p className="text-xs text-muted-foreground pt-1">
          Triaged{" "}
          {(triageLog as any).created_at
            ? formatDistanceToNow(new Date((triageLog as any).created_at), {
                addSuffix: true,
              })
            : "recently"}
        </p>
      </CardContent>
    </Card>
  );
}
