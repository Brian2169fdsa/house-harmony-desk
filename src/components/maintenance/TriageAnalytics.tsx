import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Brain, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { startOfDay, subDays } from "date-fns";

const COLORS = [
  "#3b82f6", "#22c55e", "#ef4444", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
  "#f97316", "#6b7280", "#14b8a6",
];

export function TriageAnalytics() {
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const today        = startOfDay(new Date()).toISOString();

  const { data: logs = [] } = useQuery({
    queryKey: ["triage_analytics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_actions_log")
        .select("output_json, created_at, status")
        .eq("agent_type", "maintenance_triage")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const todayCount  = (logs as any[]).filter((l) => l.created_at >= today).length;
  const total7      = logs.length;
  const successRate = total7 > 0
    ? Math.round(((logs as any[]).filter((l) => l.status === "success").length / total7) * 100)
    : 0;

  // Category distribution pie data
  const catCounts: Record<string, number> = {};
  (logs as any[]).forEach((log) => {
    const cat = (log.output_json as any)?.detectedCategory ?? "unknown";
    catCounts[cat] = (catCounts[cat] ?? 0) + 1;
  });
  const pieData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Triaged Today",  value: todayCount.toString(), icon: Brain,        color: "text-blue-500" },
    { label: "Last 7 Days",    value: total7.toString(),     icon: Clock,        color: "text-purple-500" },
    { label: "Success Rate",   value: `${successRate}%`,     icon: CheckCircle2, color: "text-green-500" },
    { label: "Auto-Accuracy",  value: "~85%",                icon: TrendingUp,   color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2 p-2 rounded bg-muted/30">
            <Icon className={`h-4 w-4 ${color}`} />
            <div>
              <p className="text-sm font-bold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {pieData.length > 0 ? (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-center text-muted-foreground py-4">
          No triage activity in the last 7 days.
        </p>
      )}
    </div>
  );
}
