import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Download, 
  ChevronLeft, 
  Calendar, 
  Filter,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown
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
const departmentBudgetData = [
  { 
    department: "Security", 
    budget: 300000, 
    spent: 280000, 
    remaining: 20000, 
    percentSpent: 93.3,
    status: "On Budget"
  },
  { 
    department: "Operations", 
    budget: 350000, 
    spent: 370000, 
    remaining: -20000, 
    percentSpent: 105.7,
    status: "Over Budget"
  },
  { 
    department: "Technology", 
    budget: 250000, 
    spent: 220000, 
    remaining: 30000, 
    percentSpent: 88.0,
    status: "Under Budget"
  },
];

const monthlySpendingData = [
  { month: "Jan", actual: 55000, projected: 60000 },
  { month: "Feb", actual: 70000, projected: 65000 },
  { month: "Mar", actual: 65000, projected: 70000 },
  { month: "Apr", actual: 90000, projected: 75000 },
  { month: "May", actual: 85000, projected: 80000 },
  { month: "Jun", actual: 78000, projected: 85000 },
  { month: "Jul", actual: 92000, projected: 90000 },
  { month: "Aug", actual: 97000, projected: 95000 },
  { month: "Sep", actual: 0, projected: 100000 }, // Future months
  { month: "Oct", actual: 0, projected: 105000 },
  { month: "Nov", actual: 0, projected: 110000 },
  { month: "Dec", actual: 0, projected: 115000 },
];

const budgetCategoryData = [
  { name: "Personnel", value: 520000 },
  { name: "Equipment", value: 230000 },
  { name: "Services", value: 180000 },
  { name: "Training", value: 80000 },
  { name: "Travel", value: 60000 },
  { name: "Other", value: 30000 },
];

const COLORS = ["#8A1538", "#b01c48", "#d62b5b", "#e55c7f", "#ee8da2", "#f4bec6"];

export default function BudgetReportPage() {
  const { t } = useI18n();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Get budget summary from API
  const { data: budgetSummary = { totalBudget: 0, actualCost: 0, remainingBudget: 0, variance: 0 } } = useQuery<{
    totalBudget: number;
    actualCost: number;
    remainingBudget: number;
    variance: number;
  }>({
    queryKey: ["/api/budget-summary"],
  });
  
  // Sort function for table
  const sortedData = [...departmentBudgetData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
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
            <h1 className="text-3xl font-bold tracking-tight">{t("budgetReport")}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t("detailedBudgetAnalysis")}</p>
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
      
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("totalBudget")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetSummary.totalBudget.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("allProjects")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("actualCost")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetSummary.actualCost.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("spentToDate")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("remainingBudget")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetSummary.remainingBudget.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("budgetRemaining")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("variancePercentage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetSummary.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {budgetSummary.variance}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {budgetSummary.variance > 0 ? t("underBudget") : t("overBudget")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Department Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("departmentBudgets")}</CardTitle>
          <CardDescription>{t("budgetByDepartment")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('department')}
                  >
                    <div className="flex items-center gap-1">
                      {t("department")}
                      {getSortDirection('department') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('department') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('department') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => requestSort('budget')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t("budget")}
                      {getSortDirection('budget') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('budget') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('budget') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => requestSort('spent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t("spent")}
                      {getSortDirection('spent') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('spent') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('spent') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => requestSort('remaining')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t("remaining")}
                      {getSortDirection('remaining') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('remaining') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('remaining') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => requestSort('percentSpent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t("percentSpent")}
                      {getSortDirection('percentSpent') === 'asc' && <ChevronUp className="h-4 w-4" />}
                      {getSortDirection('percentSpent') === 'desc' && <ChevronDown className="h-4 w-4" />}
                      {!getSortDirection('percentSpent') && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center justify-end gap-1">
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
                    <TableCell className="font-medium">{item.department}</TableCell>
                    <TableCell className="text-right">${item.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.spent.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${item.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ${Math.abs(item.remaining).toLocaleString()}
                      {item.remaining < 0 ? ' Over' : ''}
                    </TableCell>
                    <TableCell className="text-right">{item.percentSpent.toFixed(1)}%</TableCell>
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
      
      {/* Monthly Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t("monthlySpendingTrends")}</CardTitle>
          <CardDescription>{t("actualVsProjectedSpending")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySpendingData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  name={t("actualSpend")} 
                  stroke="#8A1538" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  name={t("projectedSpend")} 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Budget Allocation by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("budgetAllocationByCategory")}</CardTitle>
            <CardDescription>{t("howBudgetIsAllocated")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {budgetCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("budgetVsActualByDepartment")}</CardTitle>
            <CardDescription>{t("compareAllocation")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentBudgetData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="budget" name={t("budgetAllocated")} fill="#8A1538" />
                  <Bar dataKey="spent" name={t("actualSpend")} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}