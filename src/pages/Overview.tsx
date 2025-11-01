import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

const kpis = [
  {
    title: "Occupancy",
    value: "75%",
    subtitle: "6 of 8 beds",
    icon: Users,
    trend: "+2 this month",
  },
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

export default function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground">
          Monitor your facility's key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
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
                <div
                  key={bucket.label}
                  className="flex items-center justify-between"
                >
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
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-success/10 p-2">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-muted-foreground">
                    John Doe - $800 rent payment
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New resident added</p>
                  <p className="text-xs text-muted-foreground">
                    Jane Smith assigned to Room 3B
                  </p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-warning/10 p-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Incident reported</p>
                  <p className="text-xs text-muted-foreground">
                    Minor maintenance issue in common area
                  </p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
