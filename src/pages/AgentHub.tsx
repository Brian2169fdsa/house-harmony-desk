import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Zap,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  FileText,
  MessageSquare,
  Settings2,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { AgentConfigDrawer } from "@/components/agents/AgentConfigDrawer";
import { Link } from "react-router-dom";

const AGENT_ICONS: Record<string, React.ElementType> = {
  intake_screening:  Zap,
  payment_collection: ClipboardList,
  maintenance_triage: Settings2,
  compliance_monitor: ShieldCheck,
  occupancy_optimizer: TrendingUp,
  report_generator:  FileText,
  assistant:         MessageSquare,
};

const AGENT_COLORS: Record<string, string> = {
  intake_screening:   "text-blue-500",
  payment_collection: "text-orange-500",
  maintenance_triage: "text-yellow-500",
  compliance_monitor: "text-green-500",
  occupancy_optimizer:"text-purple-500",
  report_generator:   "text-pink-500",
  assistant:          "text-cyan-500",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  idle:      { label: "Idle",      color: "bg-gray-100 text-gray-700" },
  running:   { label: "Running",   color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", color: "bg-amber-100 text-amber-700" },
  disabled:  { label: "Disabled",  color: "bg-red-100 text-red-700" },
};

function agentStatus(agent: any) {
  if (!agent.enabled) return "disabled";
  if (agent.schedule_cron) return "scheduled";
  return "idle";
}

export default function AgentHub() {
  const queryClient = useQueryClient();
  const [configAgent, setConfigAgent] = useState<any | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agent_configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_configurations")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: recentActions = [] } = useQuery({
    queryKey: ["agent_actions_log", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_actions_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleAgent = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("agent_configurations")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent_configurations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle agent");
    },
  });

  const totalActions = recentActions.length;
  const successActions = recentActions.filter((a: any) => a.status === "completed").length;
  const pendingApproval = recentActions.filter((a: any) => a.status === "requires_approval").length;
  const enabledCount = agents.filter((a: any) => a.enabled).length;

  const actionsByAgent: Record<string, { total: number; success: number }> = {};
  for (const action of recentActions as any[]) {
    if (!actionsByAgent[action.agent_type]) {
      actionsByAgent[action.agent_type] = { total: 0, success: 0 };
    }
    actionsByAgent[action.agent_type].total++;
    if (action.status === "completed") actionsByAgent[action.agent_type].success++;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading agent hub…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Agent Hub
          </h1>
          <p className="text-muted-foreground">
            Autonomous agents that work 24/7 to manage your facility
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/agents/activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity Log
            {pendingApproval > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingApproval} pending
              </Badge>
            )}
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{enabledCount}</p>
            <p className="text-sm text-muted-foreground">Active Agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{totalActions}</p>
            <p className="text-sm text-muted-foreground">Recent Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">
              {totalActions > 0 ? Math.round((successActions / totalActions) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-amber-600">{pendingApproval}</p>
            <p className="text-sm text-muted-foreground">Needs Approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent: any) => {
          const Icon = AGENT_ICONS[agent.agent_type] ?? Bot;
          const color = AGENT_COLORS[agent.agent_type] ?? "text-gray-500";
          const status = agentStatus(agent);
          const statusInfo = STATUS_LABEL[status];
          const stats = actionsByAgent[agent.agent_type];

          return (
            <Card key={agent.id} className={`transition-opacity ${!agent.enabled ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">
                        {agent.display_name}
                      </CardTitle>
                      <span className={`inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                        {status === "scheduled" && agent.schedule_cron && (
                          <span className="ml-1 font-mono opacity-70">
                            {agent.schedule_cron}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={agent.enabled}
                    onCheckedChange={(v) =>
                      toggleAgent.mutate({ id: agent.id, enabled: v })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold">{stats?.total ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Actions</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">
                      {stats?.total
                        ? Math.round((stats.success / stats.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Success</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {agent.last_run_at
                        ? formatDistanceToNow(new Date(agent.last_run_at), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </p>
                    <p className="text-xs text-muted-foreground">Last run</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setConfigAgent(agent)}
                >
                  <Settings2 className="mr-2 h-3.5 w-3.5" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent activity feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agents/activity">
                View all <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentActions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No agent activity yet. Enable agents to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {(recentActions as any[]).slice(0, 8).map((action: any) => (
                <div
                  key={action.id}
                  className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0"
                >
                  {action.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : action.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : action.status === "requires_approval" ? (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium capitalize">
                      {action.agent_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground">{action.action_type}</span>
                    {action.entity_type && (
                      <span className="text-muted-foreground">
                        {" "}on {action.entity_type}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(action.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AgentConfigDrawer
        agent={configAgent}
        open={!!configAgent}
        onClose={() => setConfigAgent(null)}
      />
    </div>
  );
}
