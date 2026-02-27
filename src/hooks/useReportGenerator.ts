import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  generateHousePerformanceReport,
  generateInvestorReport,
  generateCompliancePackage,
  generateGrantReport,
  generateWeeklyOps,
  type HousePerformanceReport,
  type InvestorReport,
  type CompliancePackage,
  type GrantReport,
  type WeeklyOpsReport,
} from "@/services/agents/reportGeneratorAgent";
import { toast } from "sonner";

export type ReportType =
  | "house_performance"
  | "investor"
  | "compliance"
  | "grant"
  | "weekly_ops";

export type ReportParams = {
  houseId?: string | null;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportData =
  | { type: "house_performance"; data: HousePerformanceReport }
  | { type: "investor"; data: InvestorReport }
  | { type: "compliance"; data: CompliancePackage }
  | { type: "grant"; data: GrantReport }
  | { type: "weekly_ops"; data: WeeklyOpsReport };

export function useReportGenerator() {
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      type,
      params,
    }: {
      type: ReportType;
      params: ReportParams;
    }): Promise<ReportData> => {
      const dateFrom = params.dateFrom ?? new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0];
      const dateTo = params.dateTo ?? new Date().toISOString().split("T")[0];

      switch (type) {
        case "house_performance": {
          const data = await generateHousePerformanceReport(
            params.houseId ?? null,
            dateFrom,
            dateTo
          );
          return { type: "house_performance", data };
        }
        case "investor": {
          const data = await generateInvestorReport(dateFrom, dateTo);
          return { type: "investor", data };
        }
        case "compliance": {
          const data = await generateCompliancePackage(params.houseId ?? null);
          return { type: "compliance", data };
        }
        case "grant": {
          const data = await generateGrantReport(dateFrom, dateTo);
          return { type: "grant", data };
        }
        case "weekly_ops": {
          const data = await generateWeeklyOps();
          return { type: "weekly_ops", data };
        }
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
    },
    onSuccess: (data) => {
      setReportData(data);
      toast.success("Report generated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate report");
    },
  });

  const generateReport = (type: ReportType, params: ReportParams = {}) => {
    mutation.mutate({ type, params });
  };

  return {
    generateReport,
    isGenerating: mutation.isPending,
    reportData,
    reportError: mutation.error,
    clearReport: () => setReportData(null),
  };
}
