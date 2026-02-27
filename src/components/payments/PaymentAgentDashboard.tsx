import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scanPayments, snoozeResident, type CollectionStage, type CollectionTimeline } from "@/services/agents/paymentCollectionAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  DollarSign,
  Clock,
  AlertTriangle,
  UserX,
  FileText,
  Users,
  Loader2,
  PauseCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const STAGE_CONFIG: Record<CollectionStage, { label: string; color: string; icon: React.ElementType }> = {
  current: { label: "Current", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  reminder_sent: { label: "Reminder Sent", color: "bg-blue-100 text-blue-700", icon: Clock },
  overdue: { label: "Overdue", color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  escalated: { label: "Escalated", color: "bg-orange-100 text-orange-700", icon: Users },
  formal_notice: { label: "Formal Notice", color: "bg-red-100 text-red-700", icon: FileText },
  discharge_review: { label: "Discharge Review", color: "bg-red-200 text-red-800", icon: UserX },
};

const STAGE_ORDER: CollectionStage[] = [
  "current", "reminder_sent", "overdue", "escalated", "formal_notice", "discharge_review",
];

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PaymentAgentDashboard() {
  const queryClient = useQueryClient();
  const [selectedResident, setSelectedResident] = useState<CollectionTimeline | null>(null);
  const [snoozeReason, setSnoozeReason] = useState("");
  const [snoozeDays, setSnoozeDays] = useState("7");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["payment-collection-scan"],
    queryFn: scanPayments,
    staleTime: 5 * 60_000,
  });

  const snoozeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedResident) return;
      await snoozeResident(selectedResident.residentId, snoozeReason, parseInt(snoozeDays));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-collection-scan"] });
      toast.success("Collection paused for resident");
      setSelectedResident(null);
      setSnoozeReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to snooze");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
          Running payment scan…
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Payment Collection Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{summary.totalResidentsInCollection}</p>
              <p className="text-xs text-muted-foreground">Residents in Collection</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {formatCents(summary.totalARCents)}
              </p>
              <p className="text-xs text-muted-foreground">Total AR</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.actions.length}</p>
              <p className="text-xs text-muted-foreground">Actions Queued</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {summary.byStage.formal_notice.count + summary.byStage.discharge_review.count}
              </p>
              <p className="text-xs text-muted-foreground">Critical Stage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGE_ORDER.map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const data = summary.byStage[stage];
          const Icon = cfg.icon;
          return (
            <Card key={stage}>
              <CardContent className="py-4 px-3 text-center">
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </div>
                <p className="text-xl font-bold">{data.count}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCents(data.totalCents)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resident list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collection Timeline by Resident</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.timelines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No residents in collection — all payments are current.
            </p>
          ) : (
            <div className="divide-y">
              {summary.timelines
                .sort((a, b) => b.oldestDueDays - a.oldestDueDays)
                .map((tl) => {
                  const cfg = STAGE_CONFIG[tl.stage];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={tl.residentId}
                      className="w-full text-left py-3 px-2 hover:bg-muted/50 transition-colors flex items-center gap-3"
                      onClick={() => setSelectedResident(tl)}
                    >
                      <div className={`p-1.5 rounded ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tl.residentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {tl.oldestDueDays > 0
                            ? `${tl.oldestDueDays} days overdue`
                            : `Due in ${Math.abs(tl.oldestDueDays)} days`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{formatCents(tl.totalBalanceCents)}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {cfg.label}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={!!selectedResident} onOpenChange={(v) => !v && setSelectedResident(null)}>
        <SheetContent className="w-[450px] overflow-y-auto">
          {selectedResident && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{selectedResident.residentName}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Balance</Label>
                    <p className="font-bold text-lg">{formatCents(selectedResident.totalBalanceCents)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Days Overdue</Label>
                    <p className="font-bold text-lg">{selectedResident.oldestDueDays}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Collection Timeline</Label>
                  <div className="space-y-3">
                    {selectedResident.actions.map((entry, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          entry.status === "completed" ? "bg-green-100" : "bg-muted"
                        }`}>
                          {entry.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(entry.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Snooze */}
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Pause Collection</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Reason for pausing…"
                      value={snoozeReason}
                      onChange={(e) => setSnoozeReason(e.target.value)}
                      className="h-9"
                    />
                    <Select value={snoozeDays} onValueChange={setSnoozeDays}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!snoozeReason.trim() || snoozeMutation.isPending}
                      onClick={() => snoozeMutation.mutate()}
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
                      {snoozeMutation.isPending ? "Pausing…" : `Pause for ${snoozeDays} days`}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
