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
import { Download, CheckCircle, Clock, AlertTriangle, Pause } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectStatusSummary {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  atRiskProjects: number;
  onHoldProjects: number;
  completionRate: number;
}

export default function ProjectStatusReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch project status data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/reports/projects/status"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch project status data");
      }
      const projects = await response.json();
      
      // Calculate summary statistics
      const summary: ProjectStatusSummary = {
        totalProjects: projects.length,
        completedProjects: projects.filter((p: any) => p.status === "Completed").length,
        inProgressProjects: projects.filter((p: any) => p.status === "InProgress").length,
        atRiskProjects: projects.filter((p: any) => p.status === "AtRisk").length,
        onHoldProjects: projects.filter((p: any) => p.status === "OnHold").length,
        completionRate: projects.length > 0 ? (projects.filter((p: any) => p.status === "Completed").length / projects.length) * 100 : 0
      };
      
      return { projects, summary };
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

  const sortedProjects = data?.projects ? [...data.projects].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  }) : [];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed':
        return <Badge className="bg-green-600 hover:bg-green-700">{t("completed")}</Badge>;
      case 'InProgress':
        return <Badge className="bg-blue-600 hover:bg-blue-700">{t("inProgress")}</Badge>;
      case 'AtRisk':
        return <Badge className="bg-red-600 hover:bg-red-700">{t("atRisk")}</Badge>;
      case 'OnHold':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">{t("onHold")}</Badge>;
      case 'Planning':
        return <Badge className="bg-purple-600 hover:bg-purple-700">{t("planning")}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-gray-600 hover:bg-gray-700">{t("cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'Critical':
        return <Badge className="bg-red-600 hover:bg-red-700">{t("critical")}</Badge>;
      case 'High':
        return <Badge className="bg-orange-600 hover:bg-orange-700">{t("high")}</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">{t("medium")}</Badge>;
      case 'Low':
        return <Badge className="bg-green-600 hover:bg-green-700">{t("low")}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const exportReport = () => {
    if (!data?.projects) return;
    
    // Create CSV content
    const headers = ['ID', 'Title', 'Department', 'Status', 'Progress %', 'Priority'];
    const csvContent = [
      headers.join(','),
      ...data.projects.map((project: any) => [
        project.id,
        `"${project.title}"`,
        project.department,
        project.status,
        project.progress || 0,
        project.priority
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-status-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <ReportTemplate
        title={t("projectStatusReport")}
        description={t("projectStatusDescription")}
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
      title={t("projectStatusReport")}
      description={t("projectStatusDescription")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t("totalProjects")}
          value={data?.summary.totalProjects || 0}
          description={t("projectsBeingTracked")}
        />
        <SummaryCard
          title={t("completedProjects")}
          value={data?.summary.completedProjects || 0}
          description={t("projectsCompleted")}
          valueColor="text-green-600"
        />
        <SummaryCard
          title={t("inProgressProjects")}
          value={data?.summary.inProgressProjects || 0}
          description={t("projectsInProgress")}
          valueColor="text-blue-600"
        />
        <SummaryCard
          title={t("completionRate")}
          value={`${(data?.summary.completionRate || 0).toFixed(1)}%`}
          description={t("overallCompletionRate")}
          valueColor={cn(
            (data?.summary.completionRate || 0) > 75 ? "text-green-600" :
            (data?.summary.completionRate || 0) > 50 ? "text-yellow-600" :
            "text-red-600"
          )}
        />
      </div>

      <ReportCard title={t("projectsByStatus")}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
          <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-600">{data?.summary.completedProjects || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("completed")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Clock className="h-8 w-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-blue-600">{data?.summary.inProgressProjects || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("inProgress")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-red-600">{data?.summary.atRiskProjects || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("atRisk")}</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Pause className="h-8 w-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{data?.summary.onHoldProjects || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("onHold")}</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={exportReport}
            disabled={!data?.projects || data.projects.length === 0}
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </ReportCard>

      <ReportCard title={t("projectStatusDetails")}>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        ) : !data?.projects || data.projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("noProjectsFound")}</p>
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
                      {t("project")} {getSortDirection('title')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('department')}>
                      {t("department")} {getSortDirection('department')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('status')}>
                      {t("status")} {getSortDirection('status')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('progress')}>
                      {t("progress")} {getSortDirection('progress')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('priority')}>
                      {t("priority")} {getSortDirection('priority')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProjects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.id}</TableCell>
                    <TableCell>{project.title}</TableCell>
                    <TableCell>{project.department}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress || 0} className="w-20" />
                        <span className="text-sm">{project.progress || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(project.priority)}</TableCell>
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