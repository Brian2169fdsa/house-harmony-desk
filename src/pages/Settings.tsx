import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUserRole } from "@/contexts/UserRoleContext";
import { Link2, Link2Off, CheckCircle2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  regional_manager: "Regional Manager",
  house_manager: "House Manager",
  staff: "Staff",
  investor: "Investor (Read-Only)",
};

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export default function Settings() {
  const queryClient = useQueryClient();
  const { profile, role } = useUserRole();

  const navigate = useNavigate();

  // Feature flags (localStorage-based)
  const [enableIntake, setEnableIntake] = useState(false);
  const [enableCRM, setEnableCRM] = useState(false);
  const [enableMaintenance, setEnableMaintenance] = useState(false);
  const [enableAnalytics, setEnableAnalytics] = useState(false);
  const [enableInvestorPortal, setEnableInvestorPortal] = useState(false);
  const [enableQuickBooks, setEnableQuickBooks] = useState(false);
  const [enableStartupWizard, setEnableStartupWizard] = useState(false);
  const [enableChecklists, setEnableChecklists] = useState(false);
  const [enableDocumentTemplates, setEnableDocumentTemplates] = useState(false);
  const [enableLMS, setEnableLMS] = useState(false);

  // Facility settings form state
  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState("");
  const [totalBeds, setTotalBeds] = useState("");
  const [defaultRent, setDefaultRent] = useState("");
  const [depositCap, setDepositCap] = useState("");
  const [autoInvoices, setAutoInvoices] = useState(false);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyIncidents, setNotifyIncidents] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(false);

  useEffect(() => {
    setEnableIntake(localStorage.getItem("ENABLE_INTAKE") === "true");
    setEnableCRM(localStorage.getItem("ENABLE_CRM") === "true");
    setEnableMaintenance(localStorage.getItem("ENABLE_MAINTENANCE") === "true");
    setEnableAnalytics(localStorage.getItem("ENABLE_ANALYTICS") === "true");
    setEnableInvestorPortal(localStorage.getItem("ENABLE_INVESTOR_PORTAL") === "true");
    setEnableQuickBooks(localStorage.getItem("ENABLE_QUICKBOOKS") === "true");
    setEnableStartupWizard(localStorage.getItem("ENABLE_STARTUP_WIZARD") === "true");
    setEnableChecklists(localStorage.getItem("ENABLE_CHECKLISTS") === "true");
    setEnableDocumentTemplates(localStorage.getItem("ENABLE_DOCUMENT_TEMPLATES") === "true");
    setEnableLMS(localStorage.getItem("ENABLE_LMS") === "true");
  }, []);

  // Load facility settings from DB
  const { data: settings } = useQuery({
    queryKey: ["facility_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setFacilityName(settings.facility_name ?? "");
      setAddress(settings.address ?? "");
      setTotalBeds(settings.total_beds?.toString() ?? "");
      setDefaultRent(settings.default_rent_amount?.toString() ?? "");
      setDepositCap(settings.deposit_cap?.toString() ?? "");
      setAutoInvoices(settings.auto_monthly_invoices ?? false);
      setNotifyPayments(settings.notification_payment_reminders ?? true);
      setNotifyIncidents(settings.notification_incident_alerts ?? true);
      setNotifyDailySummary(settings.notification_daily_summary ?? false);
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("facility_settings")
        .upsert({
          id: SETTINGS_ID,
          facility_name: facilityName,
          address,
          total_beds: totalBeds ? parseInt(totalBeds, 10) : 0,
          default_rent_amount: defaultRent ? parseFloat(defaultRent) : 0,
          deposit_cap: depositCap ? parseFloat(depositCap) : 0,
          auto_monthly_invoices: autoInvoices,
          notification_payment_reminders: notifyPayments,
          notification_incident_alerts: notifyIncidents,
          notification_daily_summary: notifyDailySummary,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility_settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to save settings: " + (err?.message ?? "Unknown error"));
    },
  });

  const handleFeatureFlagChange = (flag: string, enabled: boolean) => {
    localStorage.setItem(flag, enabled.toString());
    if (flag === "ENABLE_INTAKE") setEnableIntake(enabled);
    if (flag === "ENABLE_CRM") setEnableCRM(enabled);
    if (flag === "ENABLE_MAINTENANCE") setEnableMaintenance(enabled);
    if (flag === "ENABLE_ANALYTICS") setEnableAnalytics(enabled);
    if (flag === "ENABLE_INVESTOR_PORTAL") setEnableInvestorPortal(enabled);
    if (flag === "ENABLE_QUICKBOOKS") setEnableQuickBooks(enabled);
    if (flag === "ENABLE_STARTUP_WIZARD") setEnableStartupWizard(enabled);
    if (flag === "ENABLE_CHECKLISTS") setEnableChecklists(enabled);
    if (flag === "ENABLE_DOCUMENT_TEMPLATES") setEnableDocumentTemplates(enabled);
    if (flag === "ENABLE_LMS") setEnableLMS(enabled);
    toast.success("Feature flag updated. Refresh the page to see changes.");
  };

  // QuickBooks connection state
  const { data: qbConnection } = useQuery({
    queryKey: ["qb_connection_settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("qb_connections")
        .select("id, status, company_name, connected_at")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your facility and system preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current user account info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">Name</span>
              <span className="text-sm font-medium">{profile?.full_name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">Role</span>
              {role ? (
                <Badge variant="secondary">{ROLE_LABELS[role] ?? role}</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Not assigned</span>
              )}
            </div>
            {profile?.hire_date && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">Hire Date</span>
                <span className="text-sm">{profile.hire_date}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facility Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="facility-name">Facility Name</Label>
              <Input
                id="facility-name"
                placeholder="Phoenix Recovery House"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Phoenix, AZ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-beds">Total Beds</Label>
              <Input
                id="total-beds"
                type="number"
                placeholder="8"
                value={totalBeds}
                onChange={(e) => setTotalBeds(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="rent-amount">Default Rent Amount ($)</Label>
              <Input
                id="rent-amount"
                type="number"
                placeholder="800"
                value={defaultRent}
                onChange={(e) => setDefaultRent(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit-cap">Deposit Cap ($)</Label>
              <Input
                id="deposit-cap"
                type="number"
                placeholder="1600"
                value={depositCap}
                onChange={(e) => setDepositCap(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-generate Monthly Invoices</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create invoices on the 1st of each month
                </p>
              </div>
              <Switch
                checked={autoInvoices}
                onCheckedChange={setAutoInvoices}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Intake & Waitlist</Label>
                <p className="text-sm text-muted-foreground">
                  Manage leads through admission pipeline with Kanban board
                </p>
              </div>
              <Switch
                checked={enableIntake}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_INTAKE", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable CRM</Label>
                <p className="text-sm text-muted-foreground">
                  Manage contacts, organizations, and referrals
                </p>
              </div>
              <Switch
                checked={enableCRM}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_CRM", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Track maintenance requests with trusted vendors
                </p>
              </div>
              <Switch
                checked={enableMaintenance}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_MAINTENANCE", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Analytics Dashboard</Label>
                <p className="text-sm text-muted-foreground">
                  Occupancy, revenue, retention, pipeline & collection charts
                </p>
              </div>
              <Switch
                checked={enableAnalytics}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_ANALYTICS", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Investor Portal</Label>
                <p className="text-sm text-muted-foreground">
                  Read-only property P&L, NOI, cap rate & PDF reports for investors
                </p>
              </div>
              <Switch
                checked={enableInvestorPortal}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_INVESTOR_PORTAL", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable QuickBooks Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Sync invoices, payments & expenses with QuickBooks Online
                </p>
              </div>
              <Switch
                checked={enableQuickBooks}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_QUICKBOOKS", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Startup Wizard</Label>
                <p className="text-sm text-muted-foreground">
                  Guided 10-step setup for launching a new Arizona sober living house
                </p>
              </div>
              <Switch
                checked={enableStartupWizard}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_STARTUP_WIZARD", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Checklists</Label>
                <p className="text-sm text-muted-foreground">
                  Smart operational checklists with dependencies, assignees, and progress tracking
                </p>
              </div>
              <Switch
                checked={enableChecklists}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_CHECKLISTS", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Document Templates</Label>
                <p className="text-sm text-muted-foreground">
                  Generate and manage facility documents with variable substitution and PDF export
                </p>
              </div>
              <Switch
                checked={enableDocumentTemplates}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_DOCUMENT_TEMPLATES", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Staff Training (LMS)</Label>
                <p className="text-sm text-muted-foreground">
                  Online training courses with quizzes and certificates for staff and house managers
                </p>
              </div>
              <Switch
                checked={enableLMS}
                onCheckedChange={(checked) =>
                  handleFeatureFlagChange("ENABLE_LMS", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* QuickBooks Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              QuickBooks Connection
            </CardTitle>
            <CardDescription>
              Connect your QuickBooks Online account to sync financial data automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qbConnection?.status === "active" ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-green-700">{qbConnection.company_name ?? "QuickBooks Online"}</p>
                    <p className="text-xs text-green-600">Connected and syncing</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/quickbooks")}>
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user || !qbConnection) return;
                      await supabase.from("qb_connections").update({ status: "disconnected" }).eq("id", qbConnection.id);
                      queryClient.invalidateQueries({ queryKey: ["qb_connection_settings"] });
                      toast.success("QuickBooks disconnected");
                    }}
                  >
                    <Link2Off className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Not connected. Enable the QuickBooks feature flag above, then click below to start the OAuth2 connection flow.
                </p>
                <Button
                  disabled={!enableQuickBooks}
                  onClick={() => {
                    if (enableQuickBooks) navigate("/quickbooks");
                    else toast.info("Enable the QuickBooks feature flag first.");
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Connect to QuickBooks Online
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders 3 days before due date
                </p>
              </div>
              <Switch
                checked={notifyPayments}
                onCheckedChange={setNotifyPayments}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Incident Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify staff immediately when incidents are logged
                </p>
              </div>
              <Switch
                checked={notifyIncidents}
                onCheckedChange={setNotifyIncidents}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Activity Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily email with facility activity
                </p>
              </div>
              <Switch
                checked={notifyDailySummary}
                onCheckedChange={setNotifyDailySummary}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
