import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Download,
  TrendingUp
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ReportTemplate, SummaryCard, ReportCard } from "@/components/reports/report-template";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ForecastSummary {
  currentYearForecast: number;
  nextYearForecast: number;
  percentChange: number;
  varianceFromBudget: number;
}

export default function ForecastReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch forecast data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/reports/forecast"],
    queryFn: async () => {
      const response = await fetch("/api/reports/forecast");
      if (!response.ok) {
        throw new Error("Failed to fetch forecast data");
      }
      return response.json();
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

  const exportReport = () => {
    if (!data?.projects) return;
    
    // Create CSV content
    const headers = ['ID', 'Name', 'Department', 'Current Year Forecast', 'Next Year Forecast', 'Percent Change', 'Budget'];
    const csvContent = [
      headers.join(','),
      ...data.projects.map((project: any) => [
        project.id,
        `"${project.name}"`,
        project.department,
        project.currentYearForecast,
        project.nextYearForecast,
        project.percentChange,
        project.budget
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forecast-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <ReportTemplate
        title={t("forecastReport")}
        description={t("forecastReportDescription")}
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
      title={t("forecastReport")}
      description={t("forecastReportDescription")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t("currentYearForecast")}
          value={`$${(data?.summary?.currentYearForecast || 0).toLocaleString()}`}
          description={t("totalForecastedRevenue")}
        />
        <SummaryCard
          title={t("nextYearForecast")}
          value={`$${(data?.summary?.nextYearForecast || 0).toLocaleString()}`}
          description={t("projectedNextYear")}
        />
        <SummaryCard
          title={t("percentChange")}
          value={`${(data?.summary?.percentChange || 0).toFixed(1)}%`}
          description={t("yearOverYearChange")}
          valueColor={cn(
            (data?.summary?.percentChange || 0) > 0 ? "text-green-600" : "text-red-600"
          )}
        />
        <SummaryCard
          title={t("budgetVariance")}
          value={`${(data?.summary?.varianceFromBudget || 0).toFixed(1)}%`}
          description={t("varianceFromBudget")}
          valueColor={cn(
            (data?.summary?.varianceFromBudget || 0) > 0 ? "text-green-600" : "text-red-600"
          )}
        />
      </div>

      {data?.quarterlyData && (
        <ReportCard title={t("quarterlyForecast")}>
          <div className="h-80 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="forecastedRevenue" 
                  stroke="#8A1538" 
                  strokeWidth={2}
                  name={t("forecastedRevenue")}
                />
                <Line 
                  type="monotone" 
                  dataKey="actualRevenue" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name={t("actualRevenue")}
                />
              </LineChart>
            </ResponsiveContainer>
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
      )}

      <ReportCard title={t("projectForecastDetails")}>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        ) : !data?.projects || data.projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("noForecastDataFound")}</p>
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
                      {t("project")} {getSortDirection('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('department')}>
                      {t("department")} {getSortDirection('department')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('currentYearForecast')}>
                      {t("currentYearForecast")} {getSortDirection('currentYearForecast')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('nextYearForecast')}>
                      {t("nextYearForecast")} {getSortDirection('nextYearForecast')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('percentChange')}>
                      {t("percentChange")} {getSortDirection('percentChange')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div onClick={() => requestSort('budget')}>
                      {t("budget")} {getSortDirection('budget')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProjects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.id}</TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.department}</TableCell>
                    <TableCell>${project.currentYearForecast?.toLocaleString()}</TableCell>
                    <TableCell>${project.nextYearForecast?.toLocaleString()}</TableCell>
                    <TableCell className={cn(
                      project.percentChange > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {project.percentChange?.toFixed(1)}%
                    </TableCell>
                    <TableCell>${project.budget?.toLocaleString()}</TableCell>
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