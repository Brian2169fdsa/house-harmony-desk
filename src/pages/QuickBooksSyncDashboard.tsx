import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock,
  ArrowLeftRight, SkipForward, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

const ENTITY_TYPES = ["invoice", "payment", "expense", "vendor_bill"] as const;

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    synced:  "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    error:   "bg-red-100 text-red-800",
    conflict:"bg-orange-100 text-orange-800",
    skipped: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.skipped}`}>
      {status}
    </span>
  );
}

export default function QuickBooksSyncDashboard() {
  const queryClient = useQueryClient();

  const { data: connection } = useQuery({
    queryKey: ["qb_connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("qb_connections").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ["qb_sync_log"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("qb_sync_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const { data: syncMappings = [] } = useQuery({
    queryKey: ["qb_sync_mappings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("qb_sync_mappings")
        .select("*")
        .eq("user_id", user.id)
        .order("last_synced", { ascending: false });
      return data ?? [];
    },
  });

  const triggerSync = useMutation({
    mutationFn: async (entityType: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("qb_sync_log").insert({
        user_id: user.id,
        entity_type: entityType,
        direction: "push",
        operation: "sync_triggered",
        status: "success",
        payload_json: { triggered_at: new Date().toISOString() },
      });
      if (error) throw error;
    },
    onSuccess: (_, et) => {
      queryClient.invalidateQueries({ queryKey: ["qb_sync_log"] });
      toast.success(`${et} sync triggered`);
    },
    onError: () => toast.error("Sync trigger failed"),
  });

  const resolveError = useMutation({
    mutationFn: async ({ logId, action }: { logId: string; action: "retry" | "skip" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("qb_sync_log").insert({
        user_id: user.id,
        entity_type: "resolution",
        direction: "push",
        operation: action,
        status: "success",
        payload_json: { resolved_log_id: logId },
      });
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["qb_sync_log"] });
      toast.success(action === "retry" ? "Retry scheduled" : "Error skipped");
    },
  });

  const isConnected =
    (connection as any)?.is_connected === true ||
    (connection as any)?.status === "active";
  const totalSynced = syncMappings.filter((m: any) => m.sync_status === "synced").length;
  const errorLogs   = syncLogs.filter((l: any) => l.status === "error");
  const pendingLogs = syncLogs.filter((l: any) => l.status === "pending");
  const lastSync    = syncLogs[0]?.created_at;

  const kpis = [
    {
      label: "Last Sync",
      value: lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true }) : "Never",
      icon: Clock, color: "text-blue-500",
    },
    { label: "Total Synced", value: totalSynced.toString(), icon: CheckCircle2, color: "text-green-500" },
    { label: "Errors",       value: errorLogs.length.toString(), icon: XCircle, color: "text-red-500" },
    { label: "Pending",      value: pendingLogs.length.toString(), icon: AlertCircle, color: "text-yellow-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">QB Sync Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage synchronization with QuickBooks Online.</p>
        </div>
        <Button
          onClick={() => ENTITY_TYPES.forEach((t) => triggerSync.mutate(t))}
          disabled={triggerSync.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${triggerSync.isPending ? "animate-spin" : ""}`} />
          Sync All
        </Button>
      </div>

      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            QuickBooks is not connected.{" "}
            <a href="/settings/quickbooks" className="underline font-medium">Connect in QB Settings</a> to enable sync.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entity Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" /> Entity Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="invoice">
            <TabsList className="grid w-full grid-cols-4">
              {ENTITY_TYPES.map((t) => (
                <TabsTrigger key={t} value={t} className="capitalize">
                  {t.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
            {ENTITY_TYPES.map((entityType) => {
              const logs = (syncLogs as any[]).filter((l) => l.entity_type === entityType);
              const errs = logs.filter((l) => l.status === "error").length;
              return (
                <TabsContent key={entityType} value={entityType} className="pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {logs.length} operations logged · {errs} error{errs !== 1 ? "s" : ""}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerSync.mutate(entityType)}
                      disabled={triggerSync.isPending}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync {entityType.replace("_", " ")}s
                    </Button>
                  </div>

                  {logs.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">
                      No sync activity for {entityType}s yet.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-2 px-2 pb-1 text-xs font-medium text-muted-foreground uppercase">
                        <div className="col-span-4">Entity ID</div>
                        <div className="col-span-2">Direction</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-3">Time</div>
                      </div>
                      {logs.slice(0, 20).map((log: any) => (
                        <div key={log.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded hover:bg-muted/40 text-sm">
                          <div className="col-span-4 font-mono text-xs truncate text-muted-foreground">
                            {log.entity_id || "—"}
                          </div>
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-xs capitalize">{log.direction}</Badge>
                          </div>
                          <div className="col-span-3"><StatusChip status={log.status} /></div>
                          <div className="col-span-3 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Resolution */}
      {errorLogs.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Failed Syncs — Action Required
            </CardTitle>
            <CardDescription>{errorLogs.length} operations failed and need resolution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(errorLogs as any[]).slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium capitalize">
                    {log.entity_type} · {log.operation}
                  </p>
                  <p className="text-xs text-red-600">{log.error_message || "Unknown error"}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveError.mutate({ logId: log.id, action: "retry" })}
                    disabled={resolveError.isPending}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveError.mutate({ logId: log.id, action: "skip" })}
                    disabled={resolveError.isPending}
                  >
                    <SkipForward className="h-3 w-3 mr-1" /> Skip
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
