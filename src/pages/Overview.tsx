import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, AlertCircle, Wrench, UserPlus, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const kpis = [
  {
    title: "Payment Success Rate",
    value: "92%",
    subtitle: "Last 30 days",
    icon: TrendingUp,
    trend: "+5% from last month",
  },
  {
    title: "Outstanding AR",
    value: "$4,200",
    subtitle: "Across 3 residents",
    icon: DollarSign,
    trend: "2 overdue",
  },
  {
    title: "Open Incidents",
    value: "3",
    subtitle: "1 high priority",
    icon: AlertCircle,
    trend: "Requires attention",
  },
];

const agingBuckets = [
  { label: "0-30 days", amount: "$2,400", count: 2 },
  { label: "31-60 days", amount: "$1,200", count: 1 },
  { label: "61-90 days", amount: "$600", count: 0 },
  { label: "90+ days", amount: "$0", count: 0 },
];

type ActivityItem = {
  id: string;
  type: "incident" | "maintenance" | "intake_lead" | "payment" | "new_resident";
  title: string;
  subtitle: string;
  created_at: string;
};

function activityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "incident":
      return { bg: "bg-destructive/10", icon: AlertCircle, color: "text-destructive" };
    case "maintenance":
      return { bg: "bg-warning/10", icon: Wrench, color: "text-warning" };
    case "intake_lead":
      return { bg: "bg-primary/10", icon: FileText, color: "text-primary" };
    case "payment":
      return { bg: "bg-success/10", icon: DollarSign, color: "text-success" };
    case "new_resident":
      return { bg: "bg-primary/10", icon: Users, color: "text-primary" };
    default:
      return { bg: "bg-muted", icon: UserPlus, color: "text-muted-foreground" };
  }
}

export default function Overview() {
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const { data: upcomingMoves } = useQuery({
    queryKey: ["upcoming-moves"],
    queryFn: async () => {
      const todayStr = today.toISOString().split("T")[0];
      const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("residents")
        .select("*")
        .or(
          `and(move_in_date.gte.${todayStr},move_in_date.lte.${sevenDaysStr}),and(move_out_date.gte.${todayStr},move_out_date.lte.${sevenDaysStr})`
        );
      if (error) throw error;
      return data || [];
    },
  });

  // Activity feed: pull from all relevant tables
  const { data: activityFeed } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const limit = 5;

      const [incidents, maintenance, leads, payments, residents] = await Promise.all([
        supabase
          .from("incidents")
          .select("id, type, description, severity, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("maintenance_requests")
          .select("id, title, priority, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("intake_leads")
          .select("id, name, referral_source, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("payments")
          .select("id, resident_name, amount, status, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("residents")
          .select("id, name, room, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);

      const items: ActivityItem[] = [];

      for (const row of incidents.data ?? []) {
        items.push({
          id: `incident-${row.id}`,
          type: "incident",
          title: `Incident: ${row.type} (${row.severity})`,
          subtitle: row.description,
          created_at: row.created_at,
        });
      }
      for (const row of maintenance.data ?? []) {
        items.push({
          id: `maint-${row.id}`,
          type: "maintenance",
          title: `Maintenance: ${row.title}`,
          subtitle: `Priority: ${row.priority}`,
          created_at: row.created_at,
        });
      }
      for (const row of leads.data ?? []) {
        items.push({
          id: `lead-${row.id}`,
          type: "intake_lead",
          title: `New intake lead: ${row.name}`,
          subtitle: row.referral_source ? `Via ${row.referral_source}` : "Direct inquiry",
          created_at: row.created_at,
        });
      }
      for (const row of payments.data ?? []) {
        items.push({
          id: `pay-${row.id}`,
          type: "payment",
          title: `Payment ${row.status === "paid" ? "received" : row.status}`,
          subtitle: `${row.resident_name ?? "Resident"} — $${row.amount}`,
          created_at: row.created_at,
        });
      }
      for (const row of residents.data ?? []) {
        items.push({
          id: `res-${row.id}`,
          type: "new_resident",
          title: `New resident added: ${row.name}`,
          subtitle: row.room ? `Assigned to ${row.room}` : "Room not assigned",
          created_at: row.created_at,
        });
      }

      // Sort by most recent
      return items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
  });

  const moveIns =
    upcomingMoves?.filter(
      (r) =>
        r.move_in_date &&
        new Date(r.move_in_date) >= today &&
        new Date(r.move_in_date) <= sevenDaysFromNow
    ) || [];

  const moveOuts =
    upcomingMoves?.filter(
      (r) =>
        r.move_out_date &&
        new Date(r.move_out_date) >= today &&
        new Date(r.move_out_date) <= sevenDaysFromNow
    ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground">Monitor your facility's key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">23/27 beds filled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Move-ins (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moveIns.length}</div>
            <p className="text-xs text-muted-foreground">{moveOuts.length} move-outs</p>
          </CardContent>
        </Card>

        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              <p className="text-xs text-primary mt-1">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AR Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agingBuckets.map((bucket) => (
                <div key={bucket.label} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{bucket.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {bucket.count} {bucket.count === 1 ? "resident" : "residents"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{bucket.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!activityFeed || activityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {activityFeed.map((item) => {
                  const { bg, icon: Icon, color } = activityIcon(item.type);
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className={`rounded-full ${bg} p-2 shrink-0`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
