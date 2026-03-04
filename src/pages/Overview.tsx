import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Wrench,
  UserPlus,
  FileText,
  Home,
} from "lucide-react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

type ActivityItem = {
  id: string;
  type: "incident" | "maintenance" | "intake_lead" | "payment" | "new_resident" | "notice";
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
    case "notice":
      return { bg: "bg-muted", icon: FileText, color: "text-muted-foreground" };
    default:
      return { bg: "bg-muted", icon: UserPlus, color: "text-muted-foreground" };
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Overview() {
  const queryClient = useQueryClient();

  // Realtime: refresh activity feed on new incidents, residents, invoices
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incidents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
        queryClient.invalidateQueries({ queryKey: ["incidents-overview"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "residents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
        queryClient.invalidateQueries({ queryKey: ["invoices-overview"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "maintenance_requests" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
        queryClient.invalidateQueries({ queryKey: ["maintenance-overview"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];

  // Houses
  const { data: houses = [] } = useQuery({
    queryKey: ["houses-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Beds for occupancy
  const { data: beds = [] } = useQuery({
    queryKey: ["beds-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("beds").select("id, status");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Residents for move-ins/outs
  const { data: upcomingMoves } = useQuery({
    queryKey: ["upcoming-moves"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, room, move_in_date, move_out_date, created_at")
        .or(
          `and(move_in_date.gte.${todayStr},move_in_date.lte.${sevenDaysStr}),and(move_out_date.gte.${todayStr},move_out_date.lte.${sevenDaysStr})`
        );
      if (error) throw error;
      return data ?? [];
    },
  });

  // Invoices for payment KPIs and AR aging
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount_cents, status, due_date, paid_date, created_at, residents(name)");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        amount_cents: number;
        status: string;
        due_date: string;
        paid_date: string | null;
        created_at: string;
        residents: { name: string } | null;
      }>;
    },
  });

  // Incidents for KPI and activity
  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("id, type, description, severity, status, created_at, resident_name")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Maintenance for KPI and activity
  const { data: maintenance = [] } = useQuery({
    queryKey: ["maintenance-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("id, title, priority, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Activity feed: combine from all tables
  const { data: activityFeed } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const limit = 5;

      const [incidentsRes, maintenanceRes, leadsRes, invoicesRes, residentsRes, noticesRes] =
        await Promise.all([
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
            .from("invoices")
            .select("id, amount_cents, status, paid_date, created_at, residents(name)")
            .eq("status", "paid")
            .order("paid_date", { ascending: false })
            .limit(limit),
          supabase
            .from("residents")
            .select("id, name, room, created_at")
            .order("created_at", { ascending: false })
            .limit(limit),
          supabase
            .from("notices")
            .select("id, type, subject, status, created_at, residents(name)")
            .order("created_at", { ascending: false })
            .limit(limit),
        ]);

      const items: ActivityItem[] = [];

      for (const row of incidentsRes.data ?? []) {
        items.push({
          id: `incident-${row.id}`,
          type: "incident",
          title: `Incident: ${row.type} (${row.severity})`,
          subtitle: row.description,
          created_at: row.created_at,
        });
      }
      for (const row of maintenanceRes.data ?? []) {
        items.push({
          id: `maint-${row.id}`,
          type: "maintenance",
          title: `Maintenance: ${row.title}`,
          subtitle: `Priority: ${row.priority}`,
          created_at: row.created_at,
        });
      }
      for (const row of leadsRes.data ?? []) {
        items.push({
          id: `lead-${row.id}`,
          type: "intake_lead",
          title: `New intake lead: ${row.name}`,
          subtitle: row.referral_source ? `Via ${row.referral_source}` : "Direct inquiry",
          created_at: row.created_at,
        });
      }
      for (const row of invoicesRes.data ?? []) {
        const inv = row as any;
        items.push({
          id: `pay-${row.id}`,
          type: "payment",
          title: "Payment received",
          subtitle: `${inv.residents?.name ?? "Resident"} — ${formatCents(row.amount_cents)}`,
          created_at: row.paid_date ?? row.created_at,
        });
      }
      for (const row of residentsRes.data ?? []) {
        items.push({
          id: `res-${row.id}`,
          type: "new_resident",
          title: `New resident added: ${row.name}`,
          subtitle: row.room ? `Assigned to ${row.room}` : "Room not assigned",
          created_at: row.created_at,
        });
      }
      for (const row of noticesRes.data ?? []) {
        const n = row as any;
        items.push({
          id: `notice-${row.id}`,
          type: "notice",
          title: `Notice: ${row.subject}`,
          subtitle: `${n.residents?.name ?? "Resident"} — ${row.status}`,
          created_at: row.created_at,
        });
      }

      return items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
  });

  // Derived KPIs
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b: any) => b.status === "occupied").length;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const moveIns =
    upcomingMoves?.filter(
      (r) =>
        r.move_in_date &&
        r.move_in_date >= todayStr &&
        r.move_in_date <= sevenDaysStr
    ) ?? [];
  const moveOuts =
    upcomingMoves?.filter(
      (r) =>
        r.move_out_date &&
        r.move_out_date >= todayStr &&
        r.move_out_date <= sevenDaysStr
    ) ?? [];

  const outstanding = invoices
    .filter((i) => ["pending", "overdue", "partial"].includes(i.status))
    .reduce((sum, i) => sum + (i.amount_cents ?? 0), 0);
  const overdueResidentCount = new Set(
    invoices.filter((i) => i.status === "overdue").map((i) => i.residents?.name).filter(Boolean)
  ).size;

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "paid").length;
  const successRate =
    totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

  const openIncidents = (incidents as any[]).filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );
  const highPriorityIncidents = openIncidents.filter((i: any) => i.severity === "high");

  // AR Aging buckets
  const now = new Date();
  function ageBucket(dueDate: string): string {
    const due = new Date(dueDate);
    const ageDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays <= 30) return "0-30 days";
    if (ageDays <= 60) return "31-60 days";
    if (ageDays <= 90) return "61-90 days";
    return "90+ days";
  }

  const unpaidInvoices = invoices.filter((i) =>
    ["pending", "overdue", "partial"].includes(i.status)
  );
  const agingMap: Record<string, { amount: number; count: number }> = {
    "0-30 days": { amount: 0, count: 0 },
    "31-60 days": { amount: 0, count: 0 },
    "61-90 days": { amount: 0, count: 0 },
    "90+ days": { amount: 0, count: 0 },
  };
  for (const inv of unpaidInvoices) {
    const bucket = ageBucket(inv.due_date);
    agingMap[bucket].amount += inv.amount_cents ?? 0;
    agingMap[bucket].count += 1;
  }

  const kpis = [
    {
      title: "Payment Success Rate",
      value: `${successRate}%`,
      subtitle: `${paidInvoices} of ${totalInvoices} invoices paid`,
      icon: TrendingUp,
      trend: "",
    },
    {
      title: "Outstanding AR",
      value: formatCents(outstanding),
      subtitle:
        overdueResidentCount > 0
          ? `${overdueResidentCount} resident${overdueResidentCount !== 1 ? "s" : ""} overdue`
          : "No overdue invoices",
      icon: DollarSign,
      trend: "",
    },
    {
      title: "Open Incidents",
      value: String(openIncidents.length),
      subtitle:
        highPriorityIncidents.length > 0
          ? `${highPriorityIncidents.length} high priority`
          : "No high priority",
      icon: AlertCircle,
      trend: highPriorityIncidents.length > 0 ? "Requires attention" : "",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground">Monitor your facility's key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Home className="h-4 w-4" /> Houses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houses.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalBeds} total beds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyPct}%</div>
            <p className="text-xs text-muted-foreground">
              {occupiedBeds}/{totalBeds} beds filled
            </p>
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
              {kpi.trend && (
                <p className="text-xs text-primary mt-1">{kpi.trend}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Move-ins/outs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Moves (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold text-success">{moveIns.length}</div>
                <p className="text-xs text-muted-foreground">Move-ins</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{moveOuts.length}</div>
                <p className="text-xs text-muted-foreground">Move-outs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(maintenance as any[]).filter((m) => m.status === "pending" || m.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">Open requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AR Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(agingMap).map(([label, { amount, count }]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "invoice" : "invoices"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {amount > 0 ? formatCents(amount) : "$0"}
                    </p>
                  </div>
                </div>
              ))}
              {unpaidInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No outstanding invoices
                </p>
              )}
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
