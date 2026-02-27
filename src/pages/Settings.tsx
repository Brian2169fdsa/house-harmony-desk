import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUserRole } from "@/contexts/UserRoleContext";

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

  // Feature flags (localStorage-based)
  const [enableIntake, setEnableIntake] = useState(false);
  const [enableCRM, setEnableCRM] = useState(false);
  const [enableMaintenance, setEnableMaintenance] = useState(false);

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
    toast.success("Feature flag updated. Refresh the page to see changes.");
  };

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
