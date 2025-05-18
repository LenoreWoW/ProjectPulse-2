import { useState } from "react";
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
import { Download, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ResourceUtilizationSummary {
  totalResources: number;
  highUtilization: number;
  optimalUtilization: number;
  lowUtilization: number;
  averageUtilization: number;
}

// Mock data - would be replaced with actual API data
const mockResourceUtilization = [
  { id: 1, name: "Ahmed Hassan", role: "Developer", department: "IT", utilization: 95, projectCount: 3, availability: "Low" },
  { id: 2, name: "Fatima Ahmed", role: "Designer", department: "UI/UX", utilization: 75, projectCount: 2, availability: "Medium" },
  { id: 3, name: "Mohammed Khalid", role: "Project Manager", department: "PMO", utilization: 100, projectCount: 4, availability: "None" },
  { id: 4, name: "Sara Abdullah", role: "Business Analyst", department: "Business", utilization: 60, projectCount: 2, availability: "Medium" },
  { id: 5, name: "Omar Yousef", role: "QA Engineer", department: "IT", utilization: 45, projectCount: 1, availability: "High" },
];

export default function ResourceUtilizationReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Mock API call - would be replaced with actual API endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/resources/utilization"],
    queryFn: async () => {
      // Simulate API call
      return {
        resources: mockResourceUtilization,
        summary: {
          totalResources: mockResourceUtilization.length,
          highUtilization: mockResourceUtilization.filter(r => r.utilization > 85).length,
          optimalUtilization: mockResourceUtilization.filter(r => r.utilization >= 60 && r.utilization <= 85).length,
          lowUtilization: mockResourceUtilization.filter(r => r.utilization < 60).length,
          averageUtilization: mockResourceUtilization.reduce((sum, r) => sum + r.utilization, 0) / mockResourceUtilization.length
        } as ResourceUtilizationSummary
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

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 85) return "text-red-500";
    if (percentage >= 60) return "text-green-500";
    return "text-blue-500";
  };

  const getAvailabilityStatus = (availability: string) => {
    switch(availability) {
      case 'None':
        return <span className="text-red-500">{t("none")}</span>;
      case 'Low':
        return <span className="text-orange-500">{t("low")}</span>;
      case 'Medium':
        return <span className="text-yellow-500">{t("medium")}</span>;
      case 'High':
        return <span className="text-green-500">{t("high")}</span>;
      default:
        return <span>{availability}</span>;
    }
  };

  const exportReport = () => {
    alert("Export functionality not implemented yet");
  };

  return (
    <ReportTemplate
      title={t("resourceUtilizationReport")}
      description={t("resourceUtilizationDescription")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t("totalResources")}
          value={data?.summary.totalResources || 0}
          description={t("resourcesBeingTracked")}
        />
        <SummaryCard
          title={t("averageUtilization")}
          value={`${(data?.summary.averageUtilization || 0).toFixed(1)}%`}
          description={t("acrossAllResources")}
          valueColor={cn(
            (data?.summary.averageUtilization || 0) > 85 ? "text-red-600" :
            (data?.summary.averageUtilization || 0) >= 60 ? "text-green-600" :
            "text-blue-600"
          )}
        />
        <SummaryCard
          title={t("overutilizedResources")}
          value={data?.summary.highUtilization || 0}
          description={t("resourcesOver85Percent")}
          valueColor="text-red-600"
        />
        <SummaryCard
          title={t("optimalUtilization")}
          value={data?.summary.optimalUtilization || 0}
          description={t("resourcesInOptimalRange")}
          valueColor="text-green-600"
        />
      </div>

      <ReportCard title={t("utilizationDistribution")}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">{t("overUtilized")} ({data?.summary.highUtilization || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">{t("optimal")} ({data?.summary.optimalUtilization || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">{t("underUtilized")} ({data?.summary.lowUtilization || 0})</span>
            </div>
          </div>
          
          <div className="flex h-8 w-full overflow-hidden rounded-md">
            <div 
              className="bg-red-500 h-full" 
              style={{ 
                width: `${(data?.summary.highUtilization || 0) / (data?.summary.totalResources || 1) * 100}%` 
              }}
            ></div>
            <div 
              className="bg-green-500 h-full" 
              style={{ 
                width: `${(data?.summary.optimalUtilization || 0) / (data?.summary.totalResources || 1) * 100}%` 
              }}
            ></div>
            <div 
              className="bg-blue-500 h-full" 
              style={{ 
                width: `${(data?.summary.lowUtilization || 0) / (data?.summary.totalResources || 1) * 100}%` 
              }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {(data?.summary.highUtilization || 0) > (data?.summary.totalResources || 0) * 0.3 && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{t("highUtilizationWarning")}</span>
            </div>
          )}
          <div className="ml-auto">
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
        </div>
      </ReportCard>

      <ReportCard title={t("resourceUtilizationDetails")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort('id')}>
                  ID {getSortDirection('id')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
                  {t("name")} {getSortDirection('name')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('role')}>
                  {t("role")} {getSortDirection('role')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('department')}>
                  {t("department")} {getSortDirection('department')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('utilization')}>
                  {t("utilization")} {getSortDirection('utilization')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('projectCount')}>
                  {t("projects")} {getSortDirection('projectCount')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('availability')}>
                  {t("availability")} {getSortDirection('availability')}
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
              ) : sortedResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {t("noResourcesFound")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedResources.map((resource: any) => (
                  <TableRow key={resource.id}>
                    <TableCell>{resource.id}</TableCell>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.role}</TableCell>
                    <TableCell>{resource.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={resource.utilization} 
                          className={cn(
                            "h-2 w-24", 
                            resource.utilization > 85 ? "bg-red-200" : 
                            resource.utilization >= 60 ? "bg-green-200" : 
                            "bg-blue-200"
                          )}
                        />
                        <span className={cn("text-sm", getUtilizationColor(resource.utilization))}>
                          {resource.utilization}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{resource.projectCount}</TableCell>
                    <TableCell>{getAvailabilityStatus(resource.availability)}</TableCell>
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