import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calculator, TrendingUp, Save, Trash2, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

// ─── SLH vs BHRF startup cost data (from pages 11-15 of guide) ───────────────
const STARTUP_COST_ROWS = [
  { item: "Legal entity + policies + contracts", slhLow: 3000, slhHigh: 15000, bhrfLow: 10000, bhrfHigh: 40000, note: "More intensive for clinical compliance + payer contracts (BHRF)" },
  { item: "Local zoning / use permit", slhLow: 0, slhHigh: 10000, bhrfLow: 2000, bhrfHigh: 25000, note: "BHRF may trigger conditional use permit + planning hearings" },
  { item: "Building / fire code renovations", slhLow: 10000, slhHigh: 80000, bhrfLow: 25000, bhrfHigh: 200000, note: "BHRF triggers more stringent occupancy/egress/systems (IFC + PBCC)" },
  { item: "Furnishings, beds, linens, security", slhLow: 8000, slhHigh: 35000, bhrfLow: 15000, bhrfHigh: 60000, note: "" },
  { item: "Safety gear (extinguishers, detectors, egress)", slhLow: 500, slhHigh: 3000, bhrfLow: 2000, bhrfHigh: 10000, note: "SLH: UL-rated extinguisher, evacuation plan postings required" },
  { item: "IT + EHR / record system", slhLow: 1000, slhHigh: 10000, bhrfLow: 5000, bhrfHigh: 40000, note: "BHRF: medical records must be HIPAA/Part 2 protected & retrievable" },
  { item: "ADHS licensing fees", slhLow: 600, slhHigh: 1500, bhrfLow: 1000, bhrfHigh: 5000, note: "SLH: $500 + $100×max residents. BHRF: varies by class and capacity" },
  { item: "AzRHA / NARR certification", slhLow: 580, slhHigh: 580, bhrfLow: 0, bhrfHigh: 2000, note: "AzRHA: $400 membership + $100/house + $10/bed/yr (Level I/II)" },
  { item: "Initial staffing recruitment + training", slhLow: 5000, slhHigh: 25000, bhrfLow: 20000, bhrfHigh: 80000, note: "BHRF requires qualified clinical staff + fingerprint clearance" },
  { item: "Insurance (Year 1 premiums)", slhLow: 3000, slhHigh: 15000, bhrfLow: 10000, bhrfHigh: 40000, note: "Higher for clinical/professional liability (BHRF)" },
  { item: "Working capital reserve (2–3 months)", slhLow: 20000, slhHigh: 80000, bhrfLow: 80000, bhrfHigh: 250000, note: "Covers ramp-up before steady occupancy" },
];

function StartupCostTable() {
  const [mode, setMode] = useState<"slh" | "bhrf">("slh");

  const rows = STARTUP_COST_ROWS;
  const totalLow = rows.reduce((s, r) => s + (mode === "slh" ? r.slhLow : r.bhrfLow), 0);
  const totalHigh = rows.reduce((s, r) => s + (mode === "slh" ? r.slhHigh : r.bhrfHigh), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium">Facility Type:</span>
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setMode("slh")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${mode === "slh" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
          >
            SLH (Sober Living Home)
          </button>
          <button
            onClick={() => setMode("bhrf")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${mode === "bhrf" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
          >
            BHRF (Behavioral Health RF)
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {mode === "slh" ? "SLH — Startup Cost Estimates (Maricopa County, AZ)" : "BHRF — Startup Cost Estimates (Maricopa County, AZ)"}
          </CardTitle>
          <CardDescription>
            {mode === "slh"
              ? "ADHS-licensed Sober Living Home (R9-12). No clinical services on-site. AzRHA/NARR certification recommended."
              : "ADHS-licensed Behavioral Health Residential Facility (R9-10). Clinical services permitted. Higher staffing and facility requirements."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Line Item</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Low</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">High</th>
                  <th className="text-left py-2 pl-3 font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const low = mode === "slh" ? row.slhLow : row.bhrfLow;
                  const high = mode === "slh" ? row.slhHigh : row.bhrfHigh;
                  return (
                    <tr key={row.item} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3">{row.item}</td>
                      <td className="py-2 text-right tabular-nums">{fmt(low)}</td>
                      <td className="py-2 text-right tabular-nums">{fmt(high)}</td>
                      <td className="py-2 pl-3 text-xs text-muted-foreground hidden md:table-cell">{row.note}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td className="py-3 font-bold">TOTAL ESTIMATED STARTUP</td>
                  <td className="py-3 text-right font-bold text-green-700">{fmt(totalLow)}</td>
                  <td className="py-3 text-right font-bold text-amber-700">{fmt(totalHigh)}</td>
                  <td className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
            <p><strong>Source:</strong> Pages 11-15 of Arizona Sober Living Startup Guide (Maricopa County, AZ baseline — 10 residents).</p>
            <p><strong>ADHS SLH fee formula:</strong> $500 + $100 × max residents. For 10 residents = $1,500.</p>
            <p><strong>AzRHA/NARR:</strong> $400 membership + $100/house inspection + $10/bed/year (Level I/II).</p>
            <p><strong>Note:</strong> Ranges reflect lease-based model. Property acquisition (purchase) adds $400K–$1.5M.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── What-if inputs ───────────────────────────────────────────────────────────
interface ScenarioInputs {
  scenarioName: string;
  beds: number;
  rentPerBed: number;
  targetOccupancy: number;
  monthlyMortgage: number;
  monthlyUtilities: number;
  monthlyInsurance: number;
  monthlySupplies: number;
  staffHours: number;
  staffHourlyRate: number;
  vacancyRampMonths: number;
  annualRentGrowth: number;
  annualExpenseGrowth: number;
}

const defaultInputs: ScenarioInputs = {
  scenarioName: "New House Scenario",
  beds: 8,
  rentPerBed: 900,
  targetOccupancy: 85,
  monthlyMortgage: 2000,
  monthlyUtilities: 500,
  monthlyInsurance: 200,
  monthlySupplies: 150,
  staffHours: 80,
  staffHourlyRate: 18,
  vacancyRampMonths: 3,
  annualRentGrowth: 3,
  annualExpenseGrowth: 2,
};

// ─── Core calculation engine ──────────────────────────────────────────────────
function calculateProjection(inputs: ScenarioInputs) {
  const months = 24;
  const data: any[] = [];

  for (let m = 1; m <= months; m++) {
    // Ramp occupancy up over first N months
    const rampFactor = inputs.vacancyRampMonths > 0
      ? Math.min(1, m / inputs.vacancyRampMonths)
      : 1;
    const occupancy = (inputs.targetOccupancy / 100) * rampFactor;
    const occupiedBeds = Math.round(inputs.beds * occupancy);

    // Revenue
    const yearFraction = (m - 1) / 12;
    const rentPerBed = inputs.rentPerBed * Math.pow(1 + inputs.annualRentGrowth / 100, yearFraction);
    const revenue = occupiedBeds * rentPerBed;

    // Expenses
    const expGrowth = Math.pow(1 + inputs.annualExpenseGrowth / 100, yearFraction);
    const mortgage = inputs.monthlyMortgage;
    const utilities = inputs.monthlyUtilities * expGrowth;
    const insurance = inputs.monthlyInsurance * expGrowth;
    const supplies = inputs.monthlySupplies * expGrowth;
    const payroll = inputs.staffHours * inputs.staffHourlyRate * expGrowth;
    const totalExpenses = mortgage + utilities + insurance + supplies + payroll;

    const noi = revenue - totalExpenses;
    const noiMargin = revenue > 0 ? (noi / revenue) * 100 : -100;

    data.push({
      month: `M${m}`,
      revenue: Math.round(revenue),
      expenses: Math.round(totalExpenses),
      noi: Math.round(noi),
      occupancy: Math.round(occupancy * 100),
      occupiedBeds,
      noiMargin: Math.round(noiMargin),
    });
  }

  // Break-even analysis
  const fixedMonthly = inputs.monthlyMortgage + inputs.monthlyInsurance;
  const variablePerBed = (inputs.monthlyUtilities + inputs.monthlySupplies + inputs.staffHours * inputs.staffHourlyRate / inputs.beds);
  const revenuePerBed = inputs.rentPerBed;
  const contributionMarginPerBed = revenuePerBed - variablePerBed;
  const breakEvenBeds = contributionMarginPerBed > 0
    ? Math.ceil(fixedMonthly / contributionMarginPerBed)
    : inputs.beds;
  const breakEvenOccupancy = (breakEvenBeds / inputs.beds) * 100;

  // Monthly fixed expense breakdown
  const expenseBreakdown = [
    { name: "Mortgage/Lease", amount: Math.round(inputs.monthlyMortgage) },
    { name: "Utilities", amount: Math.round(inputs.monthlyUtilities) },
    { name: "Insurance", amount: Math.round(inputs.monthlyInsurance) },
    { name: "Supplies", amount: Math.round(inputs.monthlySupplies) },
    { name: "Staff Payroll", amount: Math.round(inputs.staffHours * inputs.staffHourlyRate) },
  ];

  // Year 1 & Year 2 totals
  const year1 = data.slice(0, 12);
  const year2 = data.slice(12, 24);
  const yr1Revenue = year1.reduce((s, r) => s + r.revenue, 0);
  const yr1Expenses = year1.reduce((s, r) => s + r.expenses, 0);
  const yr1NOI = yr1Revenue - yr1Expenses;
  const yr2Revenue = year2.reduce((s, r) => s + r.revenue, 0);
  const yr2Expenses = year2.reduce((s, r) => s + r.expenses, 0);
  const yr2NOI = yr2Revenue - yr2Expenses;

  // DSCR (Debt Service Coverage Ratio) — annual NOI / annual debt service
  const annualDebtService = inputs.monthlyMortgage * 12;
  const dscr = annualDebtService > 0 ? yr1NOI / annualDebtService : 0;

  // ROI: Year 1 NOI / estimated initial investment (assume 6 months expenses as startup)
  const startupCost = (expenseBreakdown.reduce((s, e) => s + e.amount, 0)) * 6;
  const roi = startupCost > 0 ? (yr1NOI / startupCost) * 100 : 0;

  return { data, breakEvenBeds, breakEvenOccupancy, expenseBreakdown, yr1Revenue, yr1Expenses, yr1NOI, yr2Revenue, yr2Expenses, yr2NOI, dscr, roi, startupCost };
}

function NumberInput({ label, value, onChange, prefix, suffix, step = 1, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className={prefix ? "pl-6" : suffix ? "pr-8" : ""}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

export default function Projections() {
  const queryClient = useQueryClient();
  const [inputs, setInputs] = useState<ScenarioInputs>(defaultInputs);

  const set = (key: keyof ScenarioInputs) => (v: number | string) =>
    setInputs((prev) => ({ ...prev, [key]: v }));

  const calc = calculateProjection(inputs);

  // ─── Saved scenarios ───────────────────────────────────────────────────────
  const { data: savedScenarios = [] } = useQuery({
    queryKey: ["projection_scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projection_scenarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("projection_scenarios").insert({
        name: inputs.scenarioName,
        assumptions_json: inputs as any,
        results_json: {
          yr1Revenue: calc.yr1Revenue,
          yr1Expenses: calc.yr1Expenses,
          yr1NOI: calc.yr1NOI,
          yr2Revenue: calc.yr2Revenue,
          yr2NOI: calc.yr2NOI,
          breakEvenOccupancy: calc.breakEvenOccupancy,
          dscr: calc.dscr,
          roi: calc.roi,
        } as any,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projection_scenarios"] });
      toast.success("Scenario saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projection_scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projection_scenarios"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const loadScenario = (s: any) => {
    const assumptions = s.assumptions_json as ScenarioInputs;
    if (assumptions) setInputs({ ...defaultInputs, ...assumptions });
    toast.info(`Loaded scenario: ${s.name}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Projections</h1>
        <p className="text-muted-foreground">What-if calculator, break-even analysis, and ROI projections</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Inputs panel ───────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                What-If Calculator
              </CardTitle>
              <CardDescription>Adjust assumptions to model a new property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Scenario Name</Label>
                <Input
                  value={inputs.scenarioName}
                  onChange={(e) => setInputs((p) => ({ ...p, scenarioName: e.target.value }))}
                  placeholder="New House Scenario"
                />
              </div>

              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property & Revenue</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Total Beds" value={inputs.beds} onChange={set("beds")} min={1} />
                <NumberInput label="Rent per Bed/Month" value={inputs.rentPerBed} onChange={set("rentPerBed")} prefix="$" />
                <NumberInput label="Target Occupancy" value={inputs.targetOccupancy} onChange={set("targetOccupancy")} suffix="%" min={0} />
                <NumberInput label="Ramp-up Months" value={inputs.vacancyRampMonths} onChange={set("vacancyRampMonths")} min={0} />
              </div>

              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Expenses</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Mortgage/Lease" value={inputs.monthlyMortgage} onChange={set("monthlyMortgage")} prefix="$" />
                <NumberInput label="Utilities" value={inputs.monthlyUtilities} onChange={set("monthlyUtilities")} prefix="$" />
                <NumberInput label="Insurance" value={inputs.monthlyInsurance} onChange={set("monthlyInsurance")} prefix="$" />
                <NumberInput label="Supplies" value={inputs.monthlySupplies} onChange={set("monthlySupplies")} prefix="$" />
              </div>

              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Staff</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Staff Hours/Month" value={inputs.staffHours} onChange={set("staffHours")} min={0} />
                <NumberInput label="Hourly Rate" value={inputs.staffHourlyRate} onChange={set("staffHourlyRate")} prefix="$" />
              </div>

              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Growth Assumptions</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Annual Rent Growth" value={inputs.annualRentGrowth} onChange={set("annualRentGrowth")} suffix="%" step={0.5} />
                <NumberInput label="Annual Expense Growth" value={inputs.annualExpenseGrowth} onChange={set("annualExpenseGrowth")} suffix="%" step={0.5} />
              </div>

              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Scenario"}
              </Button>
            </CardContent>
          </Card>

          {/* Saved scenarios */}
          {savedScenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Saved Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedScenarios.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <button
                      className="flex-1 text-left text-sm text-primary hover:underline truncate"
                      onClick={() => loadScenario(s)}
                    >
                      {s.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => deleteMutation.mutate(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Results panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Year 1 Revenue", value: fmt(calc.yr1Revenue), color: "text-green-600" },
              { label: "Year 1 NOI", value: fmt(calc.yr1NOI), color: calc.yr1NOI >= 0 ? "text-green-600" : "text-red-600" },
              { label: "DSCR", value: calc.dscr.toFixed(2), color: calc.dscr >= 1.25 ? "text-green-600" : calc.dscr >= 1 ? "text-amber-600" : "text-red-600" },
              { label: "Proj. ROI (Y1)", value: fmtPct(calc.roi), color: calc.roi >= 15 ? "text-green-600" : calc.roi >= 0 ? "text-amber-600" : "text-red-600" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="projection">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="projection">24-Month Projection</TabsTrigger>
              <TabsTrigger value="breakeven">Break-Even</TabsTrigger>
              <TabsTrigger value="expenses">Expense Mix</TabsTrigger>
              <TabsTrigger value="dscr">DSCR / ROI</TabsTrigger>
              <TabsTrigger value="startup_cost">Startup Cost</TabsTrigger>
            </TabsList>

            {/* 24-month projection */}
            <TabsContent value="projection" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>24-Month Revenue & NOI Projection</CardTitle>
                  <CardDescription>
                    {inputs.scenarioName} — {inputs.beds} beds at {fmt(inputs.rentPerBed)}/bed,{" "}
                    {inputs.targetOccupancy}% target occupancy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={calc.data}>
                      <defs>
                        <linearGradient id="projRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="projExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="url(#projRev)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#projExp)" strokeWidth={2} />
                      <Line type="monotone" dataKey="noi" name="NOI" stroke="#6366f1" strokeWidth={2} dot={false} />
                      <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Year-over-Year Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Metric</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Year 1</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Year 2</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Revenue", y1: calc.yr1Revenue, y2: calc.yr2Revenue },
                          { label: "Expenses", y1: calc.yr1Expenses, y2: calc.yr2Expenses },
                          { label: "NOI", y1: calc.yr1NOI, y2: calc.yr2NOI },
                        ].map(({ label, y1, y2 }) => (
                          <tr key={label} className="border-b last:border-0">
                            <td className="py-2 font-medium">{label}</td>
                            <td className="py-2 text-right">{fmt(y1)}</td>
                            <td className="py-2 text-right">{fmt(y2)}</td>
                            <td className={`py-2 text-right text-xs ${y2 > y1 ? "text-green-600" : "text-red-600"}`}>
                              {y1 !== 0 ? `${((y2 - y1) / Math.abs(y1) * 100).toFixed(1)}%` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Break-even */}
            <TabsContent value="breakeven" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Break-Even Occupancy</p>
                    <p className="text-4xl font-bold text-amber-600">{fmtPct(calc.breakEvenOccupancy)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{calc.breakEvenBeds} beds occupied</p>
                  </CardContent>
                </Card>
                <Card className={calc.targetOccupancy > calc.breakEvenOccupancy ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"}>
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Safety Margin</p>
                    <p className={`text-4xl font-bold ${calc.targetOccupancy > calc.breakEvenOccupancy ? "text-green-600" : "text-red-600"}`}>
                      {fmtPct(Math.max(0, calc.targetOccupancy - calc.breakEvenOccupancy))}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Above break-even at target occupancy</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>NOI at Different Occupancy Rates</CardTitle>
                  <CardDescription>Monthly NOI sensitivity to occupancy — break-even marked</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={[50, 60, 70, 75, 80, 85, 90, 95, 100].map((occ) => {
                        const occupied = Math.round(inputs.beds * (occ / 100));
                        const rev = occupied * inputs.rentPerBed;
                        const exp = inputs.monthlyMortgage + inputs.monthlyUtilities + inputs.monthlyInsurance + inputs.monthlySupplies + inputs.staffHours * inputs.staffHourlyRate;
                        return { occupancy: `${occ}%`, noi: Math.round(rev - exp), occupied };
                      })}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="occupancy" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Monthly NOI"]} />
                      <ReferenceLine y={0} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" label={{ value: "Break-Even", fill: "#f59e0b", fontSize: 11 }} />
                      <Bar dataKey="noi" name="Monthly NOI" radius={[4, 4, 0, 0]}>
                        {[50, 60, 70, 75, 80, 85, 90, 95, 100].map((occ, i) => {
                          const occupied = Math.round(inputs.beds * (occ / 100));
                          const rev = occupied * inputs.rentPerBed;
                          const exp = inputs.monthlyMortgage + inputs.monthlyUtilities + inputs.monthlyInsurance + inputs.monthlySupplies + inputs.staffHours * inputs.staffHourlyRate;
                          return <rect key={i} fill={rev - exp >= 0 ? "#22c55e" : "#ef4444"} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expense mix */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={calc.expenseBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Monthly Cost"]} />
                      <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {calc.expenseBreakdown.map((e) => {
                      const total = calc.expenseBreakdown.reduce((s, i) => s + i.amount, 0);
                      return (
                        <div key={e.name} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{e.name}</span>
                          <div className="flex gap-3">
                            <span>{fmt(e.amount)}/mo</span>
                            <span className="text-muted-foreground w-12 text-right">
                              {total > 0 ? `${Math.round((e.amount / total) * 100)}%` : "0%"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span>Total Monthly Expenses</span>
                      <span>{fmt(calc.expenseBreakdown.reduce((s, e) => s + e.amount, 0))}/mo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DSCR / ROI */}
            <TabsContent value="dscr" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>DSCR Analysis</CardTitle><CardDescription>Debt Service Coverage Ratio — lenders want ≥ 1.25</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${calc.dscr >= 1.25 ? "text-green-600" : calc.dscr >= 1 ? "text-amber-600" : "text-red-600"}`}>
                        {calc.dscr.toFixed(2)}x
                      </p>
                      <Badge className="mt-2" variant={calc.dscr >= 1.25 ? "default" : calc.dscr >= 1 ? "secondary" : "destructive"}>
                        {calc.dscr >= 1.25 ? "Lender-Ready" : calc.dscr >= 1 ? "Marginal" : "Below Threshold"}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year 1 NOI</span>
                        <span>{fmt(calc.yr1NOI)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual Debt Service</span>
                        <span>{fmt(inputs.monthlyMortgage * 12)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>DSCR</span>
                        <span>{calc.dscr.toFixed(2)}x</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>ROI Analysis</CardTitle><CardDescription>Return on initial startup investment</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${calc.roi >= 15 ? "text-green-600" : calc.roi >= 0 ? "text-amber-600" : "text-red-600"}`}>
                        {fmtPct(calc.roi)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Year 1 ROI on startup capital</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Startup Cost (6 mo. expenses)</span>
                        <span>{fmt(calc.startupCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year 1 NOI</span>
                        <span>{fmt(calc.yr1NOI)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Year 1 ROI</span>
                        <span>{fmtPct(calc.roi)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* Startup Cost SLH vs BHRF */}
            <TabsContent value="startup_cost">
              <StartupCostTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
