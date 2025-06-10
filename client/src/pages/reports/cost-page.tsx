import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ChevronLeft, 
  Calendar, 
  Filter,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Sample data for the charts and tables
const costCategoryData = [
  { 
    category: "Personnel", 
    planned: 520000, 
    actual: 535000, 
    variance: -15000, 
    percentVariance: -2.9,
    status: "Over Budget"
  },
  { 
    category: "Equipment", 
    planned: 230000, 
    actual: 215000, 
    variance: 15000, 
    percentVariance: 6.5,
    status: "Under Budget"
  },
  { 
    category: "Services", 
    planned: 180000, 
    actual: 187000, 
    variance: -7000, 
    percentVariance: -3.9,
    status: "Over Budget"
  },
  { 
    category: "Training", 
    planned: 80000, 
    actual: 75000, 
    variance: 5000, 
    percentVariance: 6.3,
    status: "Under Budget"
  },
  { 
    category: "Travel", 
    planned: 60000, 
    actual: 65000, 
    variance: -5000, 
    percentVariance: -8.3,
    status: "Over Budget"
  },
  { 
    category: "Other", 
    planned: 30000, 
    actual: 28000, 
    variance: 2000, 
    percentVariance: 6.7,
    status: "Under Budget"
  },
];

const costTrendData = [
  { month: "Jan", planned: 90000, actual: 92000 },
  { month: "Feb", planned: 95000, actual: 98000 },
  { month: "Mar", planned: 100000, actual: 97000 },
  { month: "Apr", planned: 90000, actual: 95000 },
  { month: "May", planned: 85000, actual: 88000 },
  { month: "Jun", planned: 80000, actual: 83000 },
  { month: "Jul", planned: 85000, actual: 82000 },
  { month: "Aug", planned: 87000, actual: 90000 },
];

const COLORS = ["#8A1538", "#b01c48", "#d62b5b", "#e55c7f", "#ee8da2", "#f4bec6"];

// Get cost summary from API - in a real app this would fetch actual data
interface CostSummary {
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  percentVariance: number;
}

const defaultCostSummary: CostSummary = {
  totalPlanned: 1100000,
  totalActual: 1105000,
  totalVariance: -5000,
  percentVariance: -0.45
};

export default function CostReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Move the useQuery hook inside the component
  const { data: costSummary = defaultCostSummary } = useQuery<CostSummary>({
    queryKey: ["/api/cost-summary"],
    enabled: false, // Disable this query as it's just a placeholder
  });

  // Sort function for table
  const sortedData = [...costCategoryData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key as keyof typeof a;
    if (a[key] < b[key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Request sort
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction for a field
  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? 'asc' : 'desc';
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("costReports")}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t("costReportsDescription")}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>2023-2024</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filters")}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("exportPDF")}
          </Button>
        </div>
      </div>
      
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("plannedCosts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costSummary.totalPlanned.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("allProjects")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("actualCosts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costSummary.totalActual.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("toDate")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("costVariance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${costSummary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(costSummary.totalVariance).toLocaleString()}
              {costSummary.totalVariance < 0 ? ' Over' : ' Under'}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("fromPlannedCosts")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("variancePercentage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${costSummary.percentVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(costSummary.percentVariance).toFixed(2)}%
              {costSummary.percentVariance < 0 ? ' Over' : ' Under'}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {costSummary.percentVariance >= 0 ? t("underBudget") : t("overBudget")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Cost Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("costsByCategory")}</CardTitle>
          <CardDescription>{t("plannedVsActualCostsByCategory")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => requestSort('category')}
                    >
                      {t("category")}
                      {getSortDirection('category') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('category') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('category') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer"
                      onClick={() => requestSort('planned')}
                    >
                      {t("planned")}
                      {getSortDirection('planned') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('planned') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('planned') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer"
                      onClick={() => requestSort('actual')}
                    >
                      {t("actual")}
                      {getSortDirection('actual') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('actual') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('actual') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer"
                      onClick={() => requestSort('variance')}
                    >
                      {t("variance")}
                      {getSortDirection('variance') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('variance') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('variance') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer"
                      onClick={() => requestSort('percentVariance')}
                    >
                      {t("percentVariance")}
                      {getSortDirection('percentVariance') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('percentVariance') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('percentVariance') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer"
                      onClick={() => requestSort('status')}
                    >
                      {t("status")}
                      {getSortDirection('status') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('status') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('status') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">${item.planned.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.actual.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${item.variance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ${Math.abs(item.variance).toLocaleString()}
                      {item.variance < 0 ? ' Over' : ' Under'}
                    </TableCell>
                    <TableCell className={`text-right ${item.percentVariance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.abs(item.percentVariance).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${item.status === 'Over Budget' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          item.status === 'Under Budget' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("costTrends")}</CardTitle>
          <CardDescription>{t("plannedVsActualCostTrends")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={costTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  name={t("plannedCosts")} 
                  stroke="#8A1538" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  name={t("actualCosts")} 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Cost Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("costBreakdown")}</CardTitle>
          <CardDescription>{t("costBreakdownByCategory")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costCategoryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="planned" name={t("plannedCosts")} fill="#8A1538" />
                <Bar dataKey="actual" name={t("actualCosts")} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 