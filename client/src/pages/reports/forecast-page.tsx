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

// Sample data for the charts and tables
const quarterlyForecastData = [
  { 
    quarter: "Q1 2023", 
    forecastedRevenue: 600000, 
    actualRevenue: 580000, 
    forecastedCost: 500000, 
    actualCost: 510000,
    forecastedProfit: 100000,
    actualProfit: 70000
  },
  { 
    quarter: "Q2 2023", 
    forecastedRevenue: 650000, 
    actualRevenue: 670000, 
    forecastedCost: 520000, 
    actualCost: 530000,
    forecastedProfit: 130000,
    actualProfit: 140000
  },
  { 
    quarter: "Q3 2023", 
    forecastedRevenue: 700000, 
    actualRevenue: 710000, 
    forecastedCost: 550000, 
    actualCost: 560000,
    forecastedProfit: 150000,
    actualProfit: 150000
  },
  { 
    quarter: "Q4 2023", 
    forecastedRevenue: 750000, 
    actualRevenue: 730000, 
    forecastedCost: 580000, 
    actualCost: 590000,
    forecastedProfit: 170000,
    actualProfit: 140000
  },
  { 
    quarter: "Q1 2024", 
    forecastedRevenue: 800000, 
    actualRevenue: 0, 
    forecastedCost: 600000, 
    actualCost: 0,
    forecastedProfit: 200000,
    actualProfit: 0
  },
  { 
    quarter: "Q2 2024", 
    forecastedRevenue: 850000, 
    actualRevenue: 0, 
    forecastedCost: 620000, 
    actualCost: 0,
    forecastedProfit: 230000,
    actualProfit: 0
  },
];

const projectForecastData = [
  { 
    project: "Project Alpha", 
    department: "Technology",
    forecastedCost: 320000, 
    actualCost: 310000, 
    remainingCost: 10000, 
    completionPercent: 85,
    status: "On Track"
  },
  { 
    project: "Project Beta", 
    department: "Operations",
    forecastedCost: 250000, 
    actualCost: 270000, 
    remainingCost: -20000, 
    completionPercent: 90,
    status: "Over Budget"
  },
  { 
    project: "Project Gamma", 
    department: "Security",
    forecastedCost: 180000, 
    actualCost: 160000, 
    remainingCost: 20000, 
    completionPercent: 70,
    status: "Under Budget"
  },
  { 
    project: "Project Delta", 
    department: "Logistics",
    forecastedCost: 420000, 
    actualCost: 400000, 
    remainingCost: 20000, 
    completionPercent: 75,
    status: "On Track"
  },
];

interface ForecastSummary {
  currentYearForecast: number;
  nextYearForecast: number;
  percentChange: number;
  varianceFromBudget: number;
}

const defaultForecastSummary: ForecastSummary = {
  currentYearForecast: 2690000,
  nextYearForecast: 2780000,
  percentChange: 3.3,
  varianceFromBudget: -1.5
};

// Mock data - would be replaced with actual API data
const mockProjectForecasts = [
  { id: 1, name: "Digital Transformation", department: "IT", currentYearForecast: 500000, nextYearForecast: 350000, percentChange: -30, budget: 475000 },
  { id: 2, name: "HR System Upgrade", department: "HR", currentYearForecast: 250000, nextYearForecast: 100000, percentChange: -60, budget: 275000 },
  { id: 3, name: "Office Expansion", department: "Facilities", currentYearForecast: 1200000, nextYearForecast: 500000, percentChange: -58.3, budget: 1150000 },
  { id: 4, name: "Security Compliance", department: "IT", currentYearForecast: 350000, nextYearForecast: 400000, percentChange: 14.3, budget: 375000 },
  { id: 5, name: "Data Center Migration", department: "IT", currentYearForecast: 800000, nextYearForecast: 950000, percentChange: 18.8, budget: 825000 },
];

export default function ForecastReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Mock API call - would be replaced with actual API endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/forecast"],
    queryFn: async () => {
      // Simulate API call
      const totalCurrentYear = mockProjectForecasts.reduce((sum, project) => sum + project.currentYearForecast, 0);
      const totalNextYear = mockProjectForecasts.reduce((sum, project) => sum + project.nextYearForecast, 0);
      const percentChange = ((totalNextYear - totalCurrentYear) / totalCurrentYear) * 100;
      const totalBudget = mockProjectForecasts.reduce((sum, project) => sum + project.budget, 0);
      const varianceFromBudget = totalCurrentYear - totalBudget;

      return {
        projects: mockProjectForecasts,
        summary: {
          currentYearForecast: totalCurrentYear,
          nextYearForecast: totalNextYear,
          percentChange,
          varianceFromBudget
        } as ForecastSummary
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-red-600";
    if (change < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return "text-green-600";
    if (variance > 0) return "text-red-600";
    return "text-gray-600";
  };

  const exportReport = () => {
    alert("Export functionality not implemented yet");
  };

  return (
    <ReportTemplate 
      title={t("forecastReport")} 
      description={t("forecastReportDescription")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t("fiscalYear2023")}
          value={formatCurrency(data?.summary.currentYearForecast || 0)}
          description={t("currentYearForecast")}
        />
        <SummaryCard
          title={t("fiscalYear2024")}
          value={formatCurrency(data?.summary.nextYearForecast || 0)}
          description={t("nextYearForecast")}
        />
        <SummaryCard
          title={t("forecastChange")}
          value={`${(data?.summary.percentChange || 0).toFixed(1)}%`}
          description={t("yearOverYearChange")}
          valueColor={getChangeColor(data?.summary.percentChange || 0)}
        />
        <SummaryCard
          title={t("budgetVariance")}
          value={formatCurrency(data?.summary.varianceFromBudget || 0)}
          description={t("currentVsBudget")}
          valueColor={getVarianceColor(data?.summary.varianceFromBudget || 0)}
        />
      </div>

      <ReportCard title={t("forecastByProject")}>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-medium">{t("projectForecasts")}</span>
          </div>
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort('id')}>
                  ID {getSortDirection('id')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
                  {t("project")} {getSortDirection('name')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('department')}>
                  {t("department")} {getSortDirection('department')}
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => requestSort('currentYearForecast')}>
                  {t("fiscalYear2023")} {getSortDirection('currentYearForecast')}
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => requestSort('nextYearForecast')}>
                  {t("fiscalYear2024")} {getSortDirection('nextYearForecast')}
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => requestSort('percentChange')}>
                  {t("change")} {getSortDirection('percentChange')}
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => requestSort('budget')}>
                  {t("budget")} {getSortDirection('budget')}
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
              ) : sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {t("noProjectsWithForecasts")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedProjects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.id}</TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.department}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.currentYearForecast)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.nextYearForecast)}</TableCell>
                    <TableCell className={cn("text-right", getChangeColor(project.percentChange))}>
                      {project.percentChange.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ReportCard>

      <ReportCard title={t("forecastingAssumptions")}>
        <div className="py-8 text-center bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="mb-4">{t("detailedForecastingMethodologyComingSoon")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("checkBackLater")}</p>
        </div>
      </ReportCard>
    </ReportTemplate>
  );
} 