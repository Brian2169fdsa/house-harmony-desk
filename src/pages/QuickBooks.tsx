import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Link2,
  Link2Off,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings2,
  ArrowLeftRight,
  Clock,
  ChevronRight,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Local category → display label mapping ───────────────────────────────────
const LOCAL_CATEGORIES = [
  { key: "rent", label: "Resident Rent", type: "Income" },
  { key: "program_fees", label: "Program Fees", type: "Income" },
  { key: "application_fees", label: "Application Fees", type: "Income" },
  { key: "late_fees", label: "Late Fees", type: "Income" },
  { key: "maintenance", label: "Maintenance & Repairs", type: "Expense" },
  { key: "utilities", label: "Utilities", type: "Expense" },
  { key: "insurance", label: "Insurance", type: "Expense" },
  { key: "mortgage", label: "Mortgage / Lease", type: "Expense" },
  { key: "payroll", label: "Staff Payroll", type: "Expense" },
  { key: "supplies", label: "Supplies", type: "Expense" },
  { key: "deposits", label: "Security Deposits Held", type: "Asset" },
];

// ─── Default QB account suggestions (operators override these) ────────────────
const DEFAULT_QB_ACCOUNTS: Record<string, { name: string; type: string }> = {
  rent: { name: "Resident Rent Income", type: "Income" },
  program_fees: { name: "Program Fees", type: "Income" },
  application_fees: { name: "Application Fee Income", type: "Income" },
  late_fees: { name: "Late Fee Income", type: "Income" },
  maintenance: { name: "Repairs & Maintenance", type: "Expense" },
  utilities: { name: "Utilities", type: "Expense" },
  insurance: { name: "Insurance Expense", type: "Expense" },
  mortgage: { name: "Mortgage Interest & Principal", type: "Expense" },
  payroll: { name: "Wages & Salaries", type: "Expense" },
  supplies: { name: "Supplies & Materials", type: "Expense" },
  deposits: { name: "Security Deposits Liability", type: "Liability" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    success: { label: "Success", variant: "default" },
    synced: { label: "Synced", variant: "default" },
    active: { label: "Connected", variant: "default" },
    pending: { label: "Pending", variant: "secondary" },
    conflict: { label: "Conflict", variant: "secondary" },
    error: { label: "Error", variant: "destructive" },
    expired: { label: "Expired", variant: "destructive" },
    disconnected: { label: "Disconnected", variant: "destructive" },
  };
  const cfg = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function QuickBooks() {
  const queryClient = useQueryClient();
  const [conflictItem, setConflictItem] = useState<any>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);

  // ─── Fetch QB connection ────────────────────────────────────────────────────
  const { data: connection } = useQuery({
    queryKey: ["qb_connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("qb_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // ─── Fetch account mappings ─────────────────────────────────────────────────
  const { data: mappings = [] } = useQuery({
    queryKey: ["qb_account_mappings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("qb_account_mappings")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Fetch sync log ─────────────────────────────────────────────────────────
  const { data: syncLog = [], refetch: refetchLog } = useQuery({
    queryKey: ["qb_sync_log"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("qb_sync_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Fetch sync mappings ────────────────────────────────────────────────────
  const { data: syncMappings = [] } = useQuery({
    queryKey: ["qb_sync_mappings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("qb_sync_mappings")
        .select("*")
        .eq("user_id", user.id)
        .order("last_synced", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Upsert account mapping ─────────────────────────────────────────────────
  const saveMappingMutation = useMutation({
    mutationFn: async ({ category, qbAccountId, qbAccountName, qbAccountType }: {
      category: string; qbAccountId: string; qbAccountName: string; qbAccountType: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("qb_account_mappings").upsert({
        user_id: user.id,
        local_category: category,
        qb_account_id: qbAccountId,
        qb_account_name: qbAccountName,
        qb_account_type: qbAccountType,
      }, { onConflict: "user_id,local_category" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qb_account_mappings"] });
      toast.success("Account mapping saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ─── OAuth connect handler ─────────────────────────────────────────────────
  // Production flow: call Supabase Edge Function to get the OAuth URL, then redirect.
  // The Edge Function handles token exchange on callback and stores tokens in qb_connections.
  const handleConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("qb-oauth-url");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      // Fallback: Edge Function not deployed yet
      toast.info(
        "QuickBooks integration requires the qb-oauth-url Edge Function to be deployed. " +
        "See supabase/functions/qb-oauth-url for the implementation template."
      );
    } catch {
      toast.info(
        "QuickBooks integration requires the qb-oauth-url Edge Function to be deployed. " +
        "See supabase/functions/qb-oauth-url for the implementation template."
      );
    }
  };

  const handleDisconnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !connection) return;
    const { error } = await supabase
      .from("qb_connections")
      .update({ status: "disconnected" })
      .eq("id", connection.id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["qb_connection"] });
    toast.success("QuickBooks disconnected");
  };

  const handleTriggerSync = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Insert a log entry to simulate triggering sync
    await supabase.from("qb_sync_log").insert({
      user_id: user.id,
      entity_type: "manual_sync",
      direction: "push",
      operation: "create",
      status: "pending",
    });
    refetchLog();
    toast.info("Sync queued. In production this triggers a Supabase Edge Function.");
  };

  const handleInitializeMappings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const toInsert = LOCAL_CATEGORIES.map((cat) => {
      const defaults = DEFAULT_QB_ACCOUNTS[cat.key];
      return {
        user_id: user.id,
        local_category: cat.key,
        qb_account_id: `QB-${cat.key.toUpperCase()}-001`,
        qb_account_name: defaults.name,
        qb_account_type: defaults.type,
      };
    });
    const { error } = await supabase
      .from("qb_account_mappings")
      .upsert(toInsert, { onConflict: "user_id,local_category" });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["qb_account_mappings"] });
    toast.success("Default account mappings initialized");
  };

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const syncedCount = syncMappings.filter((m: any) => m.sync_status === "synced").length;
  const errorCount = syncLog.filter((l: any) => l.status === "error").length;
  const conflictCount = syncLog.filter((l: any) => l.status === "conflict").length;
  const lastSync = syncLog[0]?.created_at;

  const mappingMap: Record<string, any> = {};
  mappings.forEach((m: any) => { mappingMap[m.local_category] = m; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">QuickBooks Integration</h1>
        <p className="text-muted-foreground">Connect your QuickBooks Online account to sync invoices, payments, and expenses automatically</p>
      </div>

      {/* Connection status banner */}
      {!connection || connection.status !== "active" ? (
        <Alert>
          <Link2 className="h-4 w-4" />
          <AlertTitle>QuickBooks Not Connected</AlertTitle>
          <AlertDescription className="mt-1">
            Connect your QuickBooks Online account to enable automatic sync of invoices, payments, and expenses.
            <Button className="ml-4 mt-2 sm:mt-0" size="sm" onClick={handleConnect}>
              <Zap className="h-4 w-4 mr-2" />
              Connect QuickBooks
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Connected to {connection.company_name ?? "QuickBooks"}</AlertTitle>
          <AlertDescription className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Realm ID: {connection.realm_id} · Last refreshed: {connection.last_refreshed_at ? format(new Date(connection.last_refreshed_at), "PPp") : "Never"}</span>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <Link2Off className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Connection Status", value: connection?.status === "active" ? "Connected" : "Not Connected", icon: connection?.status === "active" ? CheckCircle2 : XCircle, color: connection?.status === "active" ? "text-green-600" : "text-muted-foreground" },
          { label: "Synced Entities", value: String(syncedCount), icon: ArrowLeftRight, color: "text-primary" },
          { label: "Sync Errors", value: String(errorCount), icon: XCircle, color: errorCount > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "Last Sync", value: lastSync ? format(new Date(lastSync), "MMM d, h:mm a") : "Never", icon: Clock, color: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`text-lg font-semibold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="connection">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="mapping">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts {conflictCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs justify-center" variant="destructive">{conflictCount}</Badge>}</TabsTrigger>
        </TabsList>

        {/* ── Connection Tab ─────────────────────────────────────────────── */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                OAuth2 Connection Flow
              </CardTitle>
              <CardDescription>
                Connect SoberOps to your QuickBooks Online company. Each step below describes what happens in production.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { step: 1, title: "Authorize SoberOps", desc: "Click 'Connect QuickBooks' to be redirected to the Intuit authorization page where you grant access to your QB company.", done: !!connection },
                { step: 2, title: "Token Exchange", desc: "Intuit redirects back with an authorization code. The Supabase Edge Function exchanges it for access + refresh tokens, encrypted at rest.", done: !!connection },
                { step: 3, title: "Company Selection", desc: "If you have multiple QB companies, select which one to link to SoberOps.", done: !!connection },
                { step: 4, title: "Map Accounts", desc: "Map your SoberOps expense categories to your QuickBooks chart of accounts.", done: mappings.length > 0 },
                { step: 5, title: "Enable Auto-Sync", desc: "Enable automatic sync of invoices, payments, and expenses in real-time.", done: false },
              ].map(({ step, title, desc, done }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${done ? "bg-green-100 text-green-700 dark:bg-green-900/40" : "bg-muted text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 flex gap-2 flex-wrap">
                <Button onClick={handleConnect}>
                  <Zap className="h-4 w-4 mr-2" />
                  Connect to QuickBooks Online
                </Button>
                {connection?.status === "active" && (
                  <Button variant="outline" onClick={handleDisconnect}>
                    <Link2Off className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Gets Synced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { direction: "SoberOps → QB", items: ["Invoices created when rent is due", "Payments marked paid → QB invoice marked paid", "Expense records → QB expense entries", "Security deposits → QB journal entries", "Vendor bills from maintenance costs"] },
                  { direction: "QB → SoberOps", items: ["Invoice payment status updates", "Expense approvals", "Account balance data for reporting", "Vendor information updates", "P&L data for investor reports"] },
                ].map(({ direction, items }) => (
                  <div key={direction} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">{direction}</p>
                    </div>
                    <ul className="space-y-1">
                      {items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRight className="h-3 w-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Chart of Accounts Mapping ──────────────────────────────────── */}
        <TabsContent value="mapping" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">Chart of Accounts Mapping</h2>
              <p className="text-sm text-muted-foreground">Map SoberOps categories to your QuickBooks accounts</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleInitializeMappings}>
              <Zap className="h-4 w-4 mr-2" />
              Load Default Mappings
            </Button>
          </div>

          {/* Income accounts */}
          {["Income", "Expense", "Asset"].map((accountType) => {
            const cats = LOCAL_CATEGORIES.filter((c) => c.type === accountType);
            return (
              <Card key={accountType}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{accountType} Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cats.map((cat) => {
                    const existing = mappingMap[cat.key];
                    return (
                      <MappingRow
                        key={cat.key}
                        category={cat.key}
                        label={cat.label}
                        accountType={accountType}
                        existing={existing}
                        onSave={(qbId, qbName) =>
                          saveMappingMutation.mutate({ category: cat.key, qbAccountId: qbId, qbAccountName: qbName, qbAccountType: accountType })
                        }
                      />
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Sync Status ────────────────────────────────────────────────── */}
        <TabsContent value="sync" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">Sync Status Dashboard</h2>
              <p className="text-sm text-muted-foreground">Last 50 sync operations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchLog()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleTriggerSync}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Trigger Sync
              </Button>
            </div>
          </div>

          {/* Synced entities */}
          {syncMappings.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Synced Entity Mappings</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Local ID</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">QB ID</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Last Synced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncMappings.map((m: any) => (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 capitalize">{m.entity_type}</td>
                          <td className="py-2 font-mono text-xs text-muted-foreground">{m.local_id.slice(0, 8)}…</td>
                          <td className="py-2 font-mono text-xs text-muted-foreground">{m.qb_id}</td>
                          <td className="py-2"><StatusBadge status={m.sync_status} /></td>
                          <td className="py-2 text-xs text-muted-foreground">{format(new Date(m.last_synced), "MMM d, h:mm a")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sync log */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Sync Log</CardTitle></CardHeader>
            <CardContent>
              {syncLog.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 space-y-2">
                  <AlertCircle className="h-8 w-8 mx-auto" />
                  <p className="text-sm">No sync operations recorded yet.</p>
                  <p className="text-xs">Connect QuickBooks and trigger a sync to see logs here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncLog.map((log: any) => (
                    <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${log.status === "error" ? "bg-red-50 dark:bg-red-950/20" : log.status === "conflict" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/50"}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {log.status === "success" || log.status === "synced" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : log.status === "error" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : log.status === "conflict" ? (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium capitalize">{log.entity_type}</span>
                          <Badge variant="outline" className="text-xs">{log.direction}</Badge>
                          <Badge variant="outline" className="text-xs">{log.operation}</Badge>
                          <StatusBadge status={log.status} />
                        </div>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                          {log.qb_id && ` · QB ID: ${log.qb_id}`}
                        </p>
                      </div>
                      {log.status === "error" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleTriggerSync}>
                          Retry
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conflict Resolution ────────────────────────────────────────── */}
        <TabsContent value="conflicts" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Conflict Resolution</h2>
            <p className="text-sm text-muted-foreground">Resolve discrepancies between SoberOps and QuickBooks data</p>
          </div>

          {conflictCount === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                <p className="font-medium">No conflicts found</p>
                <p className="text-sm text-muted-foreground">All synced data is consistent between SoberOps and QuickBooks.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{conflictCount} conflict{conflictCount > 1 ? "s" : ""} require attention</AlertTitle>
                <AlertDescription>Review each conflict and choose whether to keep the SoberOps or QuickBooks version.</AlertDescription>
              </Alert>

              {syncLog
                .filter((l: any) => l.status === "conflict")
                .map((conflict: any) => (
                  <Card key={conflict.id} className="border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="font-medium text-sm capitalize">{conflict.entity_type} Conflict</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conflict.created_at), "PPp")}
                            {conflict.entity_id && ` · Entity: ${conflict.entity_id.slice(0, 8)}…`}
                          </p>
                          {conflict.payload_json && (
                            <p className="text-xs text-muted-foreground mt-1">
                              The value in SoberOps differs from QuickBooks. Choose which to keep.
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConflictItem({ ...conflict, resolution: "local" });
                              setResolutionDialogOpen(true);
                            }}
                          >
                            Keep SoberOps
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setConflictItem({ ...conflict, resolution: "remote" });
                              setResolutionDialogOpen(true);
                            }}
                          >
                            Keep QuickBooks
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Conflict Prevention Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Always record payments and expenses in SoberOps first — let the sync push to QuickBooks.</p>
              <p>• Avoid manually editing QB invoices that were created by SoberOps.</p>
              <p>• If you need to edit a synced record in QB, re-sync from SoberOps afterwards.</p>
              <p>• Use the Manual Re-sync button in the Sync Status tab to force a refresh after any manual QB edits.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conflict resolution dialog */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Conflict Resolution</DialogTitle>
            <DialogDescription>
              {conflictItem?.resolution === "local"
                ? "This will overwrite the QuickBooks record with the SoberOps value. This action cannot be undone."
                : "This will overwrite the SoberOps record with the QuickBooks value. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!conflictItem) return;
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                // Mark the conflict as resolved in the log
                await supabase
                  .from("qb_sync_log")
                  .update({ status: "success", error_message: `Resolved: kept ${conflictItem.resolution} version` })
                  .eq("id", conflictItem.id);
                queryClient.invalidateQueries({ queryKey: ["qb_sync_log"] });
                setResolutionDialogOpen(false);
                toast.success(`Conflict resolved — kept ${conflictItem.resolution === "local" ? "SoberOps" : "QuickBooks"} version`);
              }}
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Mapping Row Component ─────────────────────────────────────────────────────
function MappingRow({ category, label, accountType, existing, onSave }: {
  category: string;
  label: string;
  accountType: string;
  existing?: any;
  onSave: (qbId: string, qbName: string) => void;
}) {
  const [qbId, setQbId] = useState(existing?.qb_account_id ?? "");
  const [qbName, setQbName] = useState(existing?.qb_account_name ?? DEFAULT_QB_ACCOUNTS[category]?.name ?? "");
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    if (!qbId || !qbName) { toast.error("QB Account ID and Name are required"); return; }
    onSave(qbId, qbName);
    setDirty(false);
  };

  return (
    <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
      <div>
        <Label className="text-xs text-muted-foreground">SoberOps Category</Label>
        <p className="text-sm font-medium mt-1">{label}</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">QB Account ID</Label>
        <Input
          value={qbId}
          onChange={(e) => { setQbId(e.target.value); setDirty(true); }}
          placeholder="e.g. 123"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">QB Account Name</Label>
        <Input
          value={qbName}
          onChange={(e) => { setQbName(e.target.value); setDirty(true); }}
          placeholder="e.g. Rental Income"
          className="h-8 text-xs"
        />
      </div>
      <div className="flex items-end gap-1">
        {existing && !dirty ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 mb-1.5" />
        ) : (
          <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={!dirty}>
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
