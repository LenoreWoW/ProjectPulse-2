import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  FileBarChart, 
  CalendarDays, 
  Users, 
  LineChart, 
  ArrowUpRight, 
  Download,
  FileText,
  Briefcase,
  Construction,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Wallet
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
  PieChart,
  Pie,
  Cell
} from "recharts";

// Sample data for the charts
const projectStatusData = [
  { status: "Planning", count: 8 },
  { status: "In Progress", count: 12 },
  { status: "On Hold", count: 3 },
  { status: "Completed", count: 7 },
];

const budgetData = [
  { department: "Security", budget: 300000, actual: 280000 },
  { department: "Operations", budget: 350000, actual: 370000 },
  { department: "Technology", budget: 250000, actual: 220000 },
  { department: "Logistics", budget: 180000, actual: 190000 },
  { department: "R&D", budget: 220000, actual: 200000 },
];

const riskData = [
  { name: "High", value: 5 },
  { name: "Medium", value: 12 },
  { name: "Low", value: 18 },
];

const COLORS = ["#e53e3e", "#ed8936", "#38a169", "#3182ce"];
const RISK_COLORS = ["#8A1538", "#f97316", "#22c55e"];

interface BudgetSummary {
  totalBudget: number;
  actualCost: number;
  remainingBudget: number;
  variance: number;
}

export default function ReportsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  
  // Get budget summary from API
  const { data: budgetSummary = { totalBudget: 900000, actualCost: 875000, remainingBudget: 25000, variance: -2.8 } } = useQuery<unknown, unknown, BudgetSummary>({
    queryKey: ["/api/budget-summary"],
  });
  
  const reportCategories = [
    {
      id: "financial",
      title: t("financialReports"),
      description: t("financialReportsDescription"),
      icon: <Wallet className="h-10 w-10 text-qatar-maroon" />,
      reports: [
        {
          id: "budget-overview",
          title: t("budgetOverview"),
          description: t("budgetOverviewDescription"),
          link: "/reports/budget"
        },
        {
          id: "cost-reports",
          title: t("costReports"),
          description: t("costReportsDescription"),
          link: "/reports/costs"
        },
        {
          id: "financial-forecast",
          title: t("financialForecast"),
          description: t("financialForecastDescription"),
          link: "/reports/forecast"
        }
      ]
    },
    {
      id: "customAnalytics",
      title: t("customAnalytics"),
      description: t("customAnalyticsDescription"),
      icon: <FileBarChart className="h-10 w-10 text-qatar-maroon" />,
      reports: [
        {
          id: "custom-analytics",
          title: t("customAnalytics"),
          description: t("customAnalyticsDescription"),
          link: "/reports/custom-analytics"
        }
      ]
    },
    {
      id: "project",
      title: t("projectReports"),
      description: t("projectReportsDescription"),
      icon: <Briefcase className="h-10 w-10 text-qatar-maroon" />,
      reports: [
        {
          id: "project-status",
          title: t("projectStatus"),
          description: t("projectStatusDescription"),
          link: "/reports/projects/status"
        },
        {
          id: "project-timeline",
          title: t("projectTimeline"),
          description: t("projectTimelineDescription"),
          link: "/reports/projects/timeline"
        }
      ]
    },
    {
      id: "resource",
      title: t("resourceReports"),
      description: t("resourceReportsDescription"),
      icon: <Users className="h-10 w-10 text-qatar-maroon" />,
      reports: [
        {
          id: "resource-allocation",
          title: t("resourceAllocation"),
          description: t("resourceAllocationDescription"),
          link: "/reports/resources/allocation"
        },
        {
          id: "resource-utilization",
          title: t("resourceUtilization"),
          description: t("resourceUtilizationDescription"),
          link: "/reports/resources/utilization"
        }
      ]
    },
    {
      id: "risk",
      title: t("riskReports"),
      description: t("riskReportsDescription"),
      icon: <AlertTriangle className="h-10 w-10 text-qatar-maroon" />,
      reports: [
        {
          id: "risk-assessment",
          title: t("riskAssessment"),
          description: t("riskAssessmentDescription"),
          link: "/reports/risks/assessment"
        },
        {
          id: "issue-tracking",
          title: t("issueTracking"),
          description: t("issueTrackingDescription"),
          link: "/reports/risks/issues"
        }
      ]
    }
  ];
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("reports")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("reportsDescription")}</p>
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {t("exportAllReports")}
        </Button>
      </div>
      
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalBudget")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetSummary.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("allProjects")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("actualCost")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetSummary.actualCost.toLocaleString()}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("spentToDate")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("remainingBudget")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetSummary.remainingBudget.toLocaleString()}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("budgetRemaining")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("variancePercentage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetSummary.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {budgetSummary.variance}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {budgetSummary.variance > 0 ? t("underBudget") : t("overBudget")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("projectStatusDistribution")}</CardTitle>
            <CardDescription>{t("projectStatusDistributionDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Link href="/reports/projects/status">
              <Button variant="ghost" className="w-full hover:bg-qatar-maroon/10">
                {t("viewDetailedReport")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("budgetVsActual")}</CardTitle>
            <CardDescription>{t("budgetVsActualDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="budget" name={t("budgetAllocated")} fill="#8A1538" />
                  <Bar dataKey="actual" name={t("actualSpend")} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Link href="/reports/budget">
              <Button variant="ghost" className="w-full hover:bg-qatar-maroon/10">
                {t("viewDetailedReport")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("riskDistribution")}</CardTitle>
            <CardDescription>{t("riskDistributionDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Link href="/reports/risks/assessment">
              <Button variant="ghost" className="w-full hover:bg-qatar-maroon/10">
                {t("viewDetailedReport")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Report Categories */}
      <div className="space-y-8">
        {reportCategories.map((category) => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-4">
              {category.icon}
              <div>
                <h2 className="text-2xl font-bold">{category.title}</h2>
                <p className="text-gray-500 dark:text-gray-400">{category.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {category.reports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 flex justify-between">
                    <Link href={report.link}>
                      <Button variant="ghost" className="text-qatar-maroon hover:bg-qatar-maroon/10 px-0">
                        {t("viewReport")}
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}