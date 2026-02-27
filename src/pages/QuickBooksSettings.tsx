import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link2, Link2Off, CheckCircle2, AlertCircle, Zap, Settings2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const LOCAL_CATEGORIES = [
  { key: "resident_rent",     label: "Resident Rent",     type: "Income" },
  { key: "program_fees",      label: "Program Fees",      type: "Income" },
  { key: "application_fees",  label: "Application Fees",  type: "Income" },
  { key: "late_fees",         label: "Late Fees",         type: "Income" },
  { key: "maintenance",       label: "Maintenance",       type: "Expense" },
  { key: "utilities",         label: "Utilities",         type: "Expense" },
  { key: "insurance",         label: "Insurance",         type: "Expense" },
  { key: "mortgage",          label: "Mortgage/Lease",    type: "Expense" },
  { key: "payroll",           label: "Staff Payroll",     type: "Expense" },
  { key: "supplies",          label: "Supplies",          type: "Expense" },
  { key: "security_deposits", label: "Security Deposits", type: "Asset" },
];

const DEFAULT_QB_NAMES: Record<string, string> = {
  resident_rent:     "Resident Rental Income",
  program_fees:      "Program Fee Income",
  application_fees:  "Application Fee Income",
  late_fees:         "Late Fee Income",
  maintenance:       "Repairs & Maintenance",
  utilities:         "Utilities",
  insurance:         "Insurance Expense",
  mortgage:          "Mortgage / Rent Expense",
  payroll:           "Payroll Expenses",
  supplies:          "Office / Household Supplies",
  security_deposits: "Security Deposits Held",
};

type MappingDraft = Record<string, { id: string; name: string }>;

export default function QuickBooksSettings() {
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectStep, setConnectStep] = useState(1);
  const [draft, setDraft] = useState<MappingDraft>({});

  const { data: connection } = useQuery({
    queryKey: ["qb_connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("qb_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: mappings = [] } = useQuery({
    queryKey: ["qb_account_mappings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("qb_account_mappings")
        .select("*")
        .eq("user_id", user.id);
      return data ?? [];
    },
  });

  // Sync mappings into draft when loaded
  useEffect(() => {
    if (!mappings.length) return;
    const d: MappingDraft = {};
    (mappings as any[]).forEach((m) => {
      d[m.local_category] = { id: m.qb_account_id, name: m.qb_account_name };
    });
    setDraft(d);
  }, [mappings]);

  const mockConnect = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("qb_connections").upsert(
        {
          user_id: user.id,
          realm_id: "123456789",
          company_name: "SoberOps Demo Company",
          access_token_encrypted: "mock_access_token",
          refresh_token_encrypted: "mock_refresh_token",
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
          is_connected: true,
          status: "active",
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qb_connection"] });
      setConnectOpen(false);
      setConnectStep(1);
      toast.success("QuickBooks connected (demo mode)");
    },
    onError: () => toast.error("Connection failed"),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!connection) return;
      const { error } = await supabase
        .from("qb_connections")
        .update({ is_connected: false, status: "disconnected" })
        .eq("id", (connection as any).id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qb_connection"] });
      toast.success("Disconnected from QuickBooks");
    },
  });

  const saveMapping = useMutation({
    mutationFn: async (catKey: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const cat = LOCAL_CATEGORIES.find((c) => c.key === catKey)!;
      const d = draft[catKey] || { id: "", name: "" };
      const { error } = await supabase.from("qb_account_mappings").upsert(
        {
          user_id: user.id,
          local_category: catKey,
          qb_account_id: d.id || catKey,
          qb_account_name: d.name,
          qb_account_type: cat.type,
          active: true,
        },
        { onConflict: "user_id,local_category" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qb_account_mappings"] });
      toast.success("Mapping saved");
    },
    onError: () => toast.error("Save failed"),
  });

  const autoGenerate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const rows = LOCAL_CATEGORIES.map((c, i) => ({
        user_id: user.id,
        local_category: c.key,
        qb_account_id: String(4000 + i),
        qb_account_name: DEFAULT_QB_NAMES[c.key],
        qb_account_type: c.type,
        active: true,
      }));
      const { error } = await supabase
        .from("qb_account_mappings")
        .upsert(rows, { onConflict: "user_id,local_category" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qb_account_mappings"] });
      const d: MappingDraft = {};
      LOCAL_CATEGORIES.forEach((c, i) => {
        d[c.key] = { id: String(4000 + i), name: DEFAULT_QB_NAMES[c.key] };
      });
      setDraft(d);
      toast.success("Standard chart of accounts generated");
    },
    onError: () => toast.error("Auto-generate failed"),
  });

  const isConnected =
    (connection as any)?.is_connected === true ||
    (connection as any)?.status === "active";

  const steps = [
    { n: 1, title: "Authorize Access", desc: "Click Next to initiate the QuickBooks OAuth2 flow. In production, this redirects to Intuit's authorization page via the Edge Function at supabase/functions/quickbooks-auth." },
    { n: 2, title: "Grant Permissions", desc: "Review and approve SoberOps access to your QuickBooks data (Accounting, Reports). Demo mode skips this step." },
    { n: 3, title: "Select Company", desc: "If you have multiple QB companies, select which one to link. Demo mode uses a placeholder company." },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">QuickBooks Settings</h1>
        <p className="text-muted-foreground">Manage your QuickBooks Online connection and chart of accounts mapping.</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Connection Status</CardTitle>
          <CardDescription>Connect your QuickBooks Online account to enable two-way financial sync.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isConnected
                ? <CheckCircle2 className="h-8 w-8 text-green-500" />
                : <Link2Off className="h-8 w-8 text-muted-foreground" />}
              <div>
                <p className="font-medium">
                  {isConnected
                    ? ((connection as any)?.company_name || "Connected")
                    : "Not Connected"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConnected
                    ? `Last sync: ${(connection as any)?.last_sync_at
                        ? format(new Date((connection as any).last_sync_at), "MMM d, yyyy h:mm a")
                        : "Never"}`
                    : "Connect to begin syncing invoices, payments, and expenses"}
                </p>
                {isConnected && ((connection as any)?.sync_errors ?? 0) > 0 && (
                  <p className="text-sm text-red-500">{(connection as any).sync_errors} sync errors — view Sync Dashboard</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {isConnected ? (
                <Button variant="outline" size="sm" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                  <Link2Off className="h-4 w-4 mr-1" /> Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={() => { setConnectStep(1); setConnectOpen(true); }}>
                  <Link2 className="h-4 w-4 mr-1" /> Connect QuickBooks
                </Button>
              )}
            </div>
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Production OAuth2 Setup</AlertTitle>
            <AlertDescription>
              Live OAuth2 requires a Supabase Edge Function at{" "}
              <code className="bg-muted px-1 rounded text-xs">supabase/functions/quickbooks-auth</code>.
              The demo Connect button stores mock credentials for UI testing.
              See architecture docs for Intuit Developer credentials and Edge Function deployment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Account Mapping */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Chart of Accounts Mapping</CardTitle>
            <CardDescription>Map local categories to your QuickBooks chart of accounts.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => autoGenerate.mutate()} disabled={autoGenerate.isPending}>
            <Zap className="h-4 w-4 mr-1" />
            {autoGenerate.isPending ? "Generating…" : "Auto-Generate Standard Accounts"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-4">Local Category</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">QB Account ID</div>
            <div className="col-span-3">QB Account Name</div>
            <div className="col-span-1" />
          </div>
          <Separator className="mb-2" />
          <div className="space-y-1">
            {LOCAL_CATEGORIES.map((cat) => {
              const d = draft[cat.key] || { id: "", name: "" };
              return (
                <div key={cat.key} className="grid grid-cols-12 gap-2 items-center py-1.5">
                  <div className="col-span-4 text-sm font-medium">{cat.label}</div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">{cat.type}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="e.g. 4000"
                      value={d.id}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], id: e.target.value } }))
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="e.g. Rental Income"
                      value={d.name}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], name: e.target.value } }))
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => saveMapping.mutate(cat.key)}
                      title="Save mapping"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* OAuth2 Flow Dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect QuickBooks Online</DialogTitle>
            <DialogDescription>Three steps to authorize SoberOps.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {steps.map(({ n, title, desc }) => (
              <div
                key={n}
                className={`flex gap-3 p-3 rounded-lg border ${
                  connectStep > n
                    ? "border-green-200 bg-green-50"
                    : connectStep === n
                    ? "border-primary/40 bg-primary/5"
                    : "border-muted bg-muted/20"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    connectStep > n
                      ? "bg-green-500 text-white"
                      : connectStep === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {connectStep > n ? "✓" : n}
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectOpen(false); setConnectStep(1); }}>Cancel</Button>
            {connectStep < 3 ? (
              <Button onClick={() => setConnectStep((s) => s + 1)}>Next →</Button>
            ) : (
              <Button onClick={() => mockConnect.mutate()} disabled={mockConnect.isPending}>
                {mockConnect.isPending ? "Connecting…" : "Complete (Demo)"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
