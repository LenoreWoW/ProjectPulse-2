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
import { Download, Users, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceUtilizationSummary {
  totalResources: number;
  highUtilization: number;
  optimalUtilization: number;
  lowUtilization: number;
  averageUtilization: number;
}

export default function ResourceUtilizationReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch resource utilization data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/reports/resources/utilization"],
    queryFn: async () => {
      const response = await fetch("/api/resources/utilization");
      if (!response.ok) {
        throw new Error("Failed to fetch resource utilization data");
      }
      const resources = await response.json();
      
      // Calculate summary statistics
      const summary: ResourceUtilizationSummary = {
        totalResources: resources.length,
        highUtilization: resources.filter((r: any) => r.utilization > 85).length,
        optimalUtilization: resources.filter((r: any) => r.utilization >= 60 && r.utilization <= 85).length,
        lowUtilization: resources.filter((r: any) => r.utilization < 60).length,
        averageUtilization: resources.length > 0 ? resources.reduce((sum: number, r: any) => sum + r.utilization, 0) / resources.length : 0
      };
      
      return { resources, summary };
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

  const sortedResources = data?.resources ? [...data.resources].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  }) : [];

  const getUtilizationBadge = (utilization: number) => {
    if (utilization > 85) {
      return <Badge className="bg-red-600 hover:bg-red-700">{t("high")}</Badge>;
    } else if (utilization >= 60) {
      return <Badge className="bg-green-600 hover:bg-green-700">{t("optimal")}</Badge>;
    } else {
      return <Badge className="bg-yellow-600 hover:bg-yellow-700">{t("low")}</Badge>;
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch(availability) {
      case 'High':
        return <Badge className="bg-green-600 hover:bg-green-700">{t("high")}</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">{t("medium")}</Badge>;
      case 'Low':
        return <Badge className="bg-orange-600 hover:bg-orange-700">{t("low")}</Badge>;
      case 'None':
        return <Badge className="bg-red-600 hover:bg-red-700">{t("none")}</Badge>;
      default:
        return <Badge variant="outline">{availability}</Badge>;
    }
  };

  const exportReport = () => {
    if (!data?.resources) return;
    
    // Create CSV content
    const headers = ['ID', 'Name', 'Role', 'Department', 'Utilization %', 'Project Count', 'Availability'];
    const csvContent = [
      headers.join(','),
      ...data.resources.map((resource: any) => [
        resource.id,
        `"${resource.name}"`,
        resource.role,
        resource.department,
        resource.utilization,
        resource.projectCount,
        resource.availability
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resource-utilization-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <ReportTemplate
        title={t("resourceUtilizationReport")}
        description={t("resourceUtilizationDescription")}
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
      title={t("resourceUtilizationReport")}
      description={t("resourceUtilizationDescription")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t("totalResources")}
          value={data?.summary.totalResources || 0}
          description={t("activeTeamMembers")}
        />
        <SummaryCard
          title={t("highUtilization")}
          value={data?.summary.highUtilization || 0}
          description={t("resourcesOver85Percent")}
          valueColor="text-red-600"
        />
        <SummaryCard
          title={t("optimalUtilization")}
          value={data?.summary.optimalUtilization || 0}
          description={t("resourcesBetween60And85Percent")}
          valueColor="text-green-600"
        />
        <SummaryCard
          title={t("averageUtilization")}
          value={`${(data?.summary.averageUtilization || 0).toFixed(1)}%`}
          description={t("teamAverageUtilization")}
          valueColor={cn(
            (data?.summary.averageUtilization || 0) > 85 ? "text-red-600" :
            (data?.summary.averageUtilization || 0) >= 60 ? "text-green-600" :
            "text-yellow-600"
          )}
        />
      </div>

      <ReportCard title={t("utilizationByCategory")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-red-600">{data?.summary.highUtilization || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("highUtilization")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Users className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-600">{data?.summary.optimalUtilization || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("optimalUtilization")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Clock className="h-8 w-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{data?.summary.lowUtilization || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("lowUtilization")}</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={exportReport}
            disabled={!data?.resources || data.resources.length === 0}
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </ReportCard>

      <ReportCard title={t("resourceUtilizationDetails")}>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        ) : !data?.resources || data.resources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("noResourcesFound")}</p>
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
                    <div onClick={() => requestSort('name')}>
                      {t("name")} {getSortDirection('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('role')}>
                      {t("role")} {getSortDirection('role')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('department')}>
                      {t("department")} {getSortDirection('department')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('utilization')}>
                      {t("utilization")} {getSortDirection('utilization')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('projectCount')}>
                      {t("projects")} {getSortDirection('projectCount')}
                    </div>
                  </TableHead>
                  <TableHead>{t("availability")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResources.map((resource: any) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.id}</TableCell>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.role}</TableCell>
                    <TableCell>{resource.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{resource.utilization}%</span>
                        {getUtilizationBadge(resource.utilization)}
                      </div>
                    </TableCell>
                    <TableCell>{resource.projectCount}</TableCell>
                    <TableCell>{getAvailabilityBadge(resource.availability)}</TableCell>
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