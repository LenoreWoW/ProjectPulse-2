import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ReportTemplate, ReportCard, SummaryCard } from "@/components/reports/report-template";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ProjectStatusSummary {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  atRiskProjects: number;
  onHoldProjects: number;
  completionRate: number;
}

// Mock data - would be replaced with actual API data
const mockProjects = [
  { id: 1, title: "Digital Transformation", department: "IT", status: "InProgress", progress: 45, priority: "High" },
  { id: 2, title: "HR System Upgrade", department: "HR", status: "OnHold", progress: 20, priority: "Medium" },
  { id: 3, title: "Office Expansion", department: "Facilities", status: "Completed", progress: 100, priority: "Medium" },
  { id: 4, title: "Security Compliance", department: "IT", status: "InProgress", progress: 65, priority: "Critical" },
  { id: 5, title: "Data Center Migration", department: "IT", status: "AtRisk", progress: 30, priority: "High" },
];

export default function ProjectStatusReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Mock API call - would be replaced with actual API endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/projects/status"],
    queryFn: async () => {
      // Simulate API call
      return {
        projects: mockProjects,
        summary: {
          totalProjects: mockProjects.length,
          completedProjects: mockProjects.filter(p => p.status === "Completed").length,
          inProgressProjects: mockProjects.filter(p => p.status === "InProgress").length,
          atRiskProjects: mockProjects.filter(p => p.status === "AtRisk").length,
          onHoldProjects: mockProjects.filter(p => p.status === "OnHold").length,
          completionRate: (mockProjects.filter(p => p.status === "Completed").length / mockProjects.length) * 100
        } as ProjectStatusSummary
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
        return <Badge className="bg-green-500 hover:bg-green-600">{t("completed")}</Badge>;
      case 'InProgress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t("inProgress")}</Badge>;
      case 'OnHold':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t("onHold")}</Badge>;
      case 'AtRisk':
        return <Badge className="bg-red-500 hover:bg-red-600">{t("atRisk")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'Critical':
        return <Badge variant="outline" className="text-red-500 border-red-500">{t("critical")}</Badge>;
      case 'High':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">{t("high")}</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">{t("medium")}</Badge>;
      case 'Low':
        return <Badge variant="outline" className="text-green-500 border-green-500">{t("low")}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const exportReport = () => {
    alert("Export functionality not implemented yet");
  };

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
          title={t("inProgress")}
          value={data?.summary.inProgressProjects || 0}
          description={t("projectsInProgress")}
          valueColor="text-blue-600"
        />
        <SummaryCard
          title={t("completedProjects")}
          value={data?.summary.completedProjects || 0}
          description={t("projectsCompleted")}
          valueColor="text-green-600"
        />
        <SummaryCard
          title={t("atRiskProjects")}
          value={data?.summary.atRiskProjects || 0}
          description={t("projectsAtRisk")}
          valueColor="text-red-600"
        />
      </div>

      <ReportCard title={t("overallProjectCompletion")}>
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {data?.summary.completionRate.toFixed(1)}% {t("complete")}
          </span>
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
        <Progress value={data?.summary.completionRate || 0} className="h-2" />
      </ReportCard>

      <ReportCard title={t("projectStatusDetails")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => requestSort('id')}
                >
                  ID {getSortDirection('id')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => requestSort('title')}
                >
                  {t("project")} {getSortDirection('title')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => requestSort('department')}
                >
                  {t("department")} {getSortDirection('department')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => requestSort('status')}
                >
                  {t("status")} {getSortDirection('status')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => requestSort('progress')}
                >
                  {t("progress")} {getSortDirection('progress')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => requestSort('priority')}
                >
                  {t("priority")} {getSortDirection('priority')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {t("loading")}...
                  </TableCell>
                </TableRow>
              ) : sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {t("noProjects")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedProjects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.id}</TableCell>
                    <TableCell>{project.title}</TableCell>
                    <TableCell>{project.department}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 w-24" />
                        <span className="text-xs">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(project.priority)}</TableCell>
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