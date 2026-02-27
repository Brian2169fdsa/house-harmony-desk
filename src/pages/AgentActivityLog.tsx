import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  Search,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  completed:         { label: "Completed",         icon: CheckCircle2, color: "text-green-500" },
  failed:            { label: "Failed",            icon: XCircle,      color: "text-red-500" },
  requires_approval: { label: "Needs Approval",    icon: Clock,        color: "text-amber-500" },
  running:           { label: "Running",           icon: Loader2,      color: "text-blue-500" },
  pending:           { label: "Pending",           icon: Clock,        color: "text-gray-500" },
};

export default function AgentActivityLog() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedAction, setSelectedAction] = useState<any | null>(null);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["agent_actions_log", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_actions_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const approveAction = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("agent_actions_log")
        .update({
          status: approve ? "completed" : "failed",
          approved_by: user?.id ?? null,
          approved_at: new Date().toISOString(),
          error_message: approve ? null : "Rejected by operator",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["agent_actions_log"] });
      toast.success(approve ? "Action approved" : "Action rejected");
      setSelectedAction(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process approval");
    },
  });

  // Filtered list
  const filtered = (actions as any[]).filter((a) => {
    if (filterAgent !== "all" && a.agent_type !== filterAgent) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.agent_type.includes(q) &&
        !a.action_type.includes(q) &&
        !(a.entity_type ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const agentTypes = [...new Set((actions as any[]).map((a) => a.agent_type))];

  const pendingApproval = (actions as any[]).filter(
    (a) => a.status === "requires_approval"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/agents">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Agent Hub
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7" />
            Agent Activity Log
          </h1>
          <p className="text-muted-foreground">Full audit trail of all agent actions</p>
        </div>
      </div>

      {/* Pending approvals banner */}
      {pendingApproval.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
              <Clock className="h-4 w-4" />
              {pendingApproval.length} action{pendingApproval.length !== 1 ? "s" : ""} require your approval
            </div>
            <div className="space-y-2">
              {pendingApproval.slice(0, 3).map((action: any) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between bg-white rounded p-2 text-sm"
                >
                  <span>
                    <span className="font-medium capitalize">
                      {action.agent_type.replace(/_/g, " ")}
                    </span>
                    {" · "}
                    {action.action_type}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-green-600"
                      onClick={() => approveAction.mutate({ id: action.id, approve: true })}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-red-600"
                      onClick={() => approveAction.mutate({ id: action.id, approve: false })}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agentTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {(t as string).replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="requires_approval">Needs Approval</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-12"
                    >
                      No agent actions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((action: any) => {
                    const sc = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <TableRow key={action.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className={`flex items-center gap-1.5 ${sc.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">{sc.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium capitalize text-sm">
                          {action.agent_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-sm">{action.action_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {action.entity_type ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {action.duration_ms ? `${action.duration_ms}ms` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(action.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {action.status === "requires_approval" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-green-600"
                                  onClick={() =>
                                    approveAction.mutate({ id: action.id, approve: true })
                                  }
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600"
                                  onClick={() =>
                                    approveAction.mutate({ id: action.id, approve: false })
                                  }
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setSelectedAction(action)}
                            >
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={!!selectedAction} onOpenChange={(v) => !v && setSelectedAction(null)}>
        <SheetContent className="w-[500px] overflow-y-auto">
          {selectedAction && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Action Detail</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Agent</Label>
                    <p className="font-medium capitalize mt-0.5">
                      {selectedAction.agent_type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <p className="font-medium mt-0.5">{selectedAction.action_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="font-medium mt-0.5 capitalize">{selectedAction.status}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Duration</Label>
                    <p className="font-medium mt-0.5">
                      {selectedAction.duration_ms ? `${selectedAction.duration_ms}ms` : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity</Label>
                    <p className="font-medium mt-0.5">
                      {selectedAction.entity_type ?? "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tokens Used</Label>
                    <p className="font-medium mt-0.5">
                      {selectedAction.tokens_used?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p className="font-medium mt-0.5">
                      {format(new Date(selectedAction.created_at), "MMM d, yyyy 'at' h:mm:ss a")}
                    </p>
                  </div>
                </div>

                {selectedAction.error_message && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Error</Label>
                    <p className="text-red-600 text-sm mt-1 bg-red-50 rounded p-2">
                      {selectedAction.error_message}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Input</Label>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48">
                    {selectedAction.input_json
                      ? JSON.stringify(selectedAction.input_json, null, 2)
                      : "—"}
                  </pre>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Output</Label>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48">
                    {selectedAction.output_json
                      ? JSON.stringify(selectedAction.output_json, null, 2)
                      : "—"}
                  </pre>
                </div>

                {selectedAction.status === "requires_approval" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        approveAction.mutate({ id: selectedAction.id, approve: true })
                      }
                      disabled={approveAction.isPending}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve Action
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() =>
                        approveAction.mutate({ id: selectedAction.id, approve: false })
                      }
                      disabled={approveAction.isPending}
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
