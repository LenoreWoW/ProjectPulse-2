import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ReportTemplate, ReportCard, SummaryCard } from "@/components/reports/report-template";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskSummary {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  resolvedRisks: number;
  mitigationRate: number;
}

// Mock data - would be replaced with actual API data
const mockRisks = [
  { id: 1, title: "Data Security Breach", project: "Digital Transformation", status: "Open", severity: "High", impact: "Critical", likelihood: "Medium", mitigation: "Implement encryption and access controls" },
  { id: 2, title: "Vendor Delays", project: "HR System Upgrade", status: "InProgress", severity: "Medium", impact: "High", likelihood: "High", mitigation: "Create contingency plan and alternative vendors" },
  { id: 3, title: "Budget Overrun", project: "Office Expansion", status: "Resolved", severity: "Medium", impact: "High", likelihood: "Low", mitigation: "Regular budget reviews and cost controls" },
  { id: 4, title: "Compliance Failure", project: "Security Compliance", status: "Open", severity: "Critical", impact: "Critical", likelihood: "Low", mitigation: "Regular audits and compliance checks" },
  { id: 5, title: "Hardware Failure", project: "Data Center Migration", status: "Resolved", severity: "Low", impact: "Medium", likelihood: "Low", mitigation: "Redundant systems and backups" },
];

export default function RiskAssessmentReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Mock API call - would be replaced with actual API endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/risks/assessment"],
    queryFn: async () => {
      // Simulate API call
      return {
        risks: mockRisks,
        summary: {
          totalRisks: mockRisks.length,
          highRisks: mockRisks.filter(r => r.severity === "High" || r.severity === "Critical").length,
          mediumRisks: mockRisks.filter(r => r.severity === "Medium").length,
          lowRisks: mockRisks.filter(r => r.severity === "Low").length,
          resolvedRisks: mockRisks.filter(r => r.status === "Resolved").length,
          mitigationRate: (mockRisks.filter(r => r.status === "Resolved").length / mockRisks.length) * 100
        } as RiskSummary
      };
    }
  });

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const sortedRisks = data?.risks ? [...data.risks].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  }) : [];

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'Critical':
        return <Badge className="bg-red-600 hover:bg-red-700">{t("critical")}</Badge>;
      case 'High':
        return <Badge className="bg-red-500 hover:bg-red-600">{t("high")}</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t("medium")}</Badge>;
      case 'Low':
        return <Badge className="bg-green-500 hover:bg-green-600">{t("low")}</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Open':
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">{t("open")}</span>
          </div>
        );
      case 'InProgress':
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{t("inProgress")}</span>
          </div>
        );
      case 'Resolved':
        return (
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm">{t("resolved")}</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const exportReport = () => {
    alert("Export functionality not implemented yet");
  };

  return (
    <ReportTemplate
      title={t("riskAssessmentReport")}
      description={t("riskAssessmentDescription")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t("totalRisks")}
          value={data?.summary.totalRisks || 0}
          description={t("risksBeingTracked")}
        />
        <SummaryCard
          title={t("highRisks")}
          value={data?.summary.highRisks || 0}
          description={t("highPriorityRisks")}
          valueColor="text-red-600"
        />
        <SummaryCard
          title={t("resolvedRisks")}
          value={data?.summary.resolvedRisks || 0}
          description={t("risksResolved")}
          valueColor="text-green-600"
        />
        <SummaryCard
          title={t("mitigationRate")}
          value={`${(data?.summary.mitigationRate || 0).toFixed(1)}%`}
          description={t("riskMitigationRate")}
          valueColor={cn(
            (data?.summary.mitigationRate || 0) > 75 ? "text-green-600" :
            (data?.summary.mitigationRate || 0) > 50 ? "text-yellow-600" :
            "text-red-600"
          )}
        />
      </div>

      <ReportCard title={t("risksByPriority")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-red-600">{data?.summary.highRisks || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("highPriorityRisks")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{data?.summary.mediumRisks || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("mediumPriorityRisks")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-600">{data?.summary.lowRisks || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("lowPriorityRisks")}</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={exportReport}
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </ReportCard>

      <ReportCard title={t("riskAssessmentDetails")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort('id')}>
                  ID {getSortDirection('id')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('title')}>
                  {t("risk")} {getSortDirection('title')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('project')}>
                  {t("project")} {getSortDirection('project')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('severity')}>
                  {t("severity")} {getSortDirection('severity')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('impact')}>
                  {t("impact")} {getSortDirection('impact')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('likelihood')}>
                  {t("likelihood")} {getSortDirection('likelihood')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('status')}>
                  {t("status")} {getSortDirection('status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {t("loading")}...
                  </TableCell>
                </TableRow>
              ) : sortedRisks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {t("noRisks")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedRisks.map((risk: any) => (
                  <TableRow key={risk.id}>
                    <TableCell>{risk.id}</TableCell>
                    <TableCell>{risk.title}</TableCell>
                    <TableCell>{risk.project}</TableCell>
                    <TableCell>{getSeverityBadge(risk.severity)}</TableCell>
                    <TableCell>{getSeverityBadge(risk.impact)}</TableCell>
                    <TableCell>{getSeverityBadge(risk.likelihood)}</TableCell>
                    <TableCell>{getStatusBadge(risk.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ReportCard>
    </ReportTemplate>
  );
} 