import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { runComplianceScan, type ComplianceCategory, type ComplianceItem, type ComplianceLevel } from "@/services/agents/complianceMonitorAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Download,
  ChevronRight,
  FlaskConical,
  Users,
  Award,
  Package,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

const LEVEL_CONFIG: Record<ComplianceLevel, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  compliant: { label: "Compliant", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle2 },
  warning: { label: "Warning", color: "text-amber-600", bgColor: "bg-amber-100", icon: AlertTriangle },
  violation: { label: "Violation", color: "text-red-600", bgColor: "bg-red-100", icon: XCircle },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Drug Test Compliance": FlaskConical,
  "Meeting Attendance": Users,
  "Staff Certifications": Award,
  "Facility Supplies": Package,
  "Documentation": FileText,
};

function ScoreGauge({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const color = score >= 90 ? "text-green-600" : score >= 70 ? "text-amber-600" : "text-red-600";
  const dim = size === "lg" ? 120 : 64;
  const fontSize = size === "lg" ? "text-3xl" : "text-base";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="-rotate-90" viewBox="0 0 36 36" width={dim} height={dim}>
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${fontSize} ${color}`}>{score}%</span>
        </div>
      </div>
      {size === "lg" && (
        <span className="text-sm text-muted-foreground mt-2">Overall Compliance</span>
      )}
    </div>
  );
}

export default function ComplianceDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<ComplianceCategory | null>(null);

  const { data: report, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["compliance-scan"],
    queryFn: runComplianceScan,
    staleTime: 10 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Running compliance scan…</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load compliance data.</p>
      </div>
    );
  }

  const totalViolations = report.categories.reduce(
    (s, c) => s + c.items.filter((i) => i.level === "violation").length,
    0
  );
  const totalWarnings = report.categories.reduce(
    (s, c) => s + c.items.filter((i) => i.level === "warning").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground">
            AI-powered compliance monitoring across all categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Re-scan
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall score + summary */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="flex items-center justify-center py-8">
            <ScoreGauge score={report.overallScore} />
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {report.categories.filter((c) => c.level === "compliant").length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Categories Compliant</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-600">{totalWarnings}</span>
                </div>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">{totalViolations}</span>
                </div>
                <p className="text-sm text-muted-foreground">Violations</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Last scan: {format(new Date(report.generatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {report.categories.map((cat) => {
          const levelCfg = LEVEL_CONFIG[cat.level];
          const LevelIcon = levelCfg.icon;
          const CatIcon = CATEGORY_ICONS[cat.name] ?? ShieldCheck;
          const violations = cat.items.filter((i) => i.level === "violation").length;
          const warnings = cat.items.filter((i) => i.level === "warning").length;

          return (
            <Card
              key={cat.name}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCategory(cat)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{cat.name}</CardTitle>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelCfg.bgColor} ${levelCfg.color}`}>
                    <LevelIcon className="h-3 w-3" />
                    {levelCfg.label}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-bold ${levelCfg.color}`}>{cat.score}%</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {violations > 0 && (
                      <span className="flex items-center gap-0.5 text-red-600">
                        <XCircle className="h-3 w-3" /> {violations}
                      </span>
                    )}
                    {warnings > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> {warnings}
                      </span>
                    )}
                  </div>
                </div>
                <Progress
                  value={cat.score}
                  className="h-2"
                />
                {cat.items.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    {cat.items.length} issue{cat.items.length !== 1 ? "s" : ""} found
                    <ChevronRight className="h-3 w-3" />
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selectedCategory} onOpenChange={(v) => !v && setSelectedCategory(null)}>
        <SheetContent className="w-[500px] overflow-y-auto">
          {selectedCategory && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{selectedCategory.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <ScoreGauge score={selectedCategory.score} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    {selectedCategory.items.length} issue{selectedCategory.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </SheetHeader>

              {selectedCategory.items.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 py-8 justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Fully compliant — no issues found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCategory.items
                    .sort((a, b) => (a.level === "violation" ? -1 : 1))
                    .map((item) => {
                      const cfg = LEVEL_CONFIG[item.level];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border-l-4 ${
                            item.level === "violation"
                              ? "border-l-red-500 bg-red-50"
                              : "border-l-amber-500 bg-amber-50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                            <div>
                              <p className="text-sm font-medium">{item.entityName}</p>
                              <p className="text-sm text-muted-foreground">{item.issue}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                              <Badge variant="secondary" className="text-[10px] mt-1.5">
                                {item.entityType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
