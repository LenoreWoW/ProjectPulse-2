import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Calendar, 
  Users, 
  Check, 
  Clock, 
  Download, 
  AlertTriangle, 
  ChevronRight, 
  Layers, 
  Briefcase
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
  Cell,
} from "recharts";

// Sample data for the charts
const projectStatusData = [
  { name: "Planning", value: 5 },
  { name: "In Progress", value: 12 },
  { name: "On Hold", value: 3 },
  { name: "Completed", value: 8 },
  { name: "Pending", value: 4 },
];

const budgetData = [
  { name: "Technology", budget: 250000, actual: 220000 },
  { name: "Operations", budget: 350000, actual: 370000 },
  { name: "Security", budget: 300000, actual: 280000 },
];

const tasksCompletionData = [
  { month: "Jan", completed: 15, pending: 12 },
  { month: "Feb", completed: 22, pending: 8 },
  { month: "Mar", completed: 28, pending: 10 },
  { month: "Apr", completed: 19, pending: 15 },
  { month: "May", completed: 25, pending: 12 },
  { month: "Jun", completed: 30, pending: 5 },
];

const reportLinks = [
  { 
    title: "Project Status", 
    icon: Briefcase, 
    description: "Overall status of all projects with completion rates",
    path: "/reports/projects"
  },
  { 
    title: "Budget Analysis", 
    icon: BarChart3, 
    description: "Analysis of budget allocation and expenditure by department",
    path: "/reports/budget" 
  },
  {
    title: "Task Completion", 
    icon: Check, 
    description: "Task completion rates by month and department",
    path: "/reports/tasks"
  },
  {
    title: "Risk Assessment", 
    icon: AlertTriangle, 
    description: "Risk and issues analysis across projects",
    path: "/reports/risks"
  },
  { 
    title: "Timeline Analysis", 
    icon: Clock, 
    description: "Project timeline analysis and delays",
    path: "/reports/timeline" 
  },
  { 
    title: "Resource Allocation", 
    icon: Users, 
    description: "Staff allocation and utilization across departments",
    path: "/reports/resources" 
  },
];

const COLORS = ["#8A1538", "#b01c48", "#d62b5b", "#e55c7f", "#ee8da2", "#f4bec6"];

export default function ReportsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get budget summary
  const { data: budgetSummary = { totalBudget: 0, actualCost: 0, remainingBudget: 0, variance: 0 } } = useQuery({
    queryKey: ["/api/budget-summary"],
  });
  
  // Dummy placeholder query for budget details since we need to create this endpoint
  const { data: budgetDetails = [] } = useQuery({
    queryKey: ["/api/budget-details"],
    enabled: false, // Disable this query since we're using sample data
  });
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("reports")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("reportsDescription")}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("exportData")}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="budget">{t("budget")}</TabsTrigger>
          <TabsTrigger value="projects">{t("projects")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("tasks")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Reports Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportLinks.map((report) => (
              <Link key={report.path} href={report.path}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-maroon-50 dark:bg-maroon-900/20">
                        <report.icon className="h-5 w-5 text-qatar-maroon" />
                      </div>
                      <CardTitle className="text-lg">{t(report.title)}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(report.description)}</p>
                    <div className="flex justify-end mt-4">
                      <span className="text-qatar-maroon text-sm flex items-center">
                        {t("view")}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Quick Stats */}
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
        </TabsContent>
        
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("budgetAnalysis")}</CardTitle>
              <CardDescription>{t("budgetByDepartment")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="budget" name={t("budgetAllocated")} fill="#8A1538" />
                    <Bar dataKey="actual" name={t("actualSpend")} fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("spendingTrends")}</CardTitle>
                <CardDescription>{t("monthlySpending")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <FileText className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium">{t("comingSoon")}</p>
                  <p className="mt-2">{t("featureInDevelopment")}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t("budgetVariance")}</CardTitle>
                <CardDescription>{t("varianceAnalysis")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <TrendingUp className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium">{t("comingSoon")}</p>
                  <p className="mt-2">{t("featureInDevelopment")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("projectStatusDistribution")}</CardTitle>
              <CardDescription>{t("projectsByStatus")}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-80 w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("projectCompletion")}</CardTitle>
                <CardDescription>{t("completionRates")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <Layers className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium">{t("comingSoon")}</p>
                  <p className="mt-2">{t("featureInDevelopment")}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t("projectTimelines")}</CardTitle>
                <CardDescription>{t("timelineAnalysis")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <Calendar className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium">{t("comingSoon")}</p>
                  <p className="mt-2">{t("featureInDevelopment")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("taskCompletionTrends")}</CardTitle>
              <CardDescription>{t("monthlyTaskCompletion")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tasksCompletionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name={t("completedTasks")} fill="#8A1538" />
                    <Bar dataKey="pending" name={t("pendingTasks")} fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("taskAssignments")}</CardTitle>
                <CardDescription>{t("tasksByAssignee")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium">{t("comingSoon")}</p>
                  <p className="mt-2">{t("featureInDevelopment")}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t("taskEfficiency")}</CardTitle>
                <CardDescription>{t("taskCompletionEfficiency")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <Clock className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium">{t("comingSoon")}</p>
                  <p className="mt-2">{t("featureInDevelopment")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}