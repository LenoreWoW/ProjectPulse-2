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

export default function RiskAssessmentReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch risks from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/reports/risks/assessment"],
    queryFn: async () => {
      const response = await fetch("/api/risks");
      if (!response.ok) {
        throw new Error("Failed to fetch risks data");
      }
      const risks = await response.json();
      
      // Calculate summary statistics
      const summary: RiskSummary = {
        totalRisks: risks.length,
        highRisks: risks.filter((r: any) => r.priority === "High" || r.priority === "Critical").length,
        mediumRisks: risks.filter((r: any) => r.priority === "Medium").length,
        lowRisks: risks.filter((r: any) => r.priority === "Low").length,
        resolvedRisks: risks.filter((r: any) => r.status === "Resolved").length,
        mitigationRate: risks.length > 0 ? (risks.filter((r: any) => r.status === "Resolved").length / risks.length) * 100 : 0
      };
      
      return { risks, summary };
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

  const getSeverityBadge = (priority: string) => {
    switch(priority) {
      case 'Critical':
        return <Badge className="bg-red-600 hover:bg-red-700">{t("critical")}</Badge>;
      case 'High':
        return <Badge className="bg-red-500 hover:bg-red-600">{t("high")}</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t("medium")}</Badge>;
      case 'Low':
        return <Badge className="bg-green-500 hover:bg-green-600">{t("low")}</Badge>;
      default:
        return <Badge>{priority}</Badge>;
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
    if (!data?.risks) return;
    
    // Create CSV content
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'Impact', 'Mitigation'];
    const csvContent = [
      headers.join(','),
      ...data.risks.map((risk: any) => [
        risk.id,
        `"${risk.title}"`,
        risk.type,
        risk.priority,
        risk.status,
        `"${risk.impact || ''}"`,
        `"${risk.mitigation || ''}"`
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'risk-assessment-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <ReportTemplate
        title={t("riskAssessmentReport")}
        description={t("riskAssessmentDescription")}
      >
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{t("errorLoadingData")}</p>
          <p className="text-sm text-gray-500 mt-2">{(error as Error).message}</p>
        </div>
      </ReportTemplate>
    );
  }

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
            disabled={!data?.risks || data.risks.length === 0}
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </ReportCard>

      <ReportCard title={t("riskAssessmentDetails")}>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        ) : !data?.risks || data.risks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("noRisksFound")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('id')}>
                      ID {getSortDirection('id')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('title')}>
                      {t("risk")} {getSortDirection('title')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('type')}>
                      {t("type")} {getSortDirection('type')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('priority')}>
                      {t("priority")} {getSortDirection('priority')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('status')}>
                      {t("status")} {getSortDirection('status')}
                    </div>
                  </TableHead>
                  <TableHead>{t("mitigation")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRisks.map((risk: any) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.id}</TableCell>
                    <TableCell>{risk.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{risk.type}</Badge>
                    </TableCell>
                    <TableCell>{getSeverityBadge(risk.priority)}</TableCell>
                    <TableCell>{getStatusBadge(risk.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <span title={risk.mitigation}>
                        {risk.mitigation || t("noMitigationPlan")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ReportCard>
    </ReportTemplate>
  );
} 