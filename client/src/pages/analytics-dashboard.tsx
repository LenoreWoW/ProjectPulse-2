import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/use-i18n-new';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Filter, 
  Calendar, 
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project, Department, Task, RiskIssue } from '@shared/schema';

// Define chart colors (Qatar-themed)
const COLORS = ['#8A1538', '#63A615', '#6C5B7B', '#314E89', '#F18F01', '#610345', '#087E8B'];
const QATAR_MAROON = '#8A1538';

export default function AnalyticsDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('projects');
  
  // Fetch data for analytics
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });
  
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: risks } = useQuery<RiskIssue[]>({
    queryKey: ['/api/risks-issues'],
  });

  // Calculate metrics
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.status === 'InProgress').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'Completed').length || 0;
  const atRiskProjects = projects?.filter(p => p.priority === 'High' && p.status !== 'Completed').length || 0;
  
  // Total budget calculation
  const totalBudget = projects?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;
  const totalSpend = totalBudget * 0.65; // Mock data - 65% spent
  const remainingBudget = totalBudget - totalSpend;
  
  // Budget percentage calculation
  const spendPercentage = totalBudget ? (totalSpend / totalBudget) * 100 : 0;
  
  // Project status distribution data for pie chart
  const projectStatusData = [
    { name: 'In Progress', value: activeProjects },
    { name: 'Completed', value: completedProjects },
    { name: 'On Hold', value: projects?.filter(p => p.status === 'OnHold').length || 0 },
    { name: 'Planning', value: projects?.filter(p => p.status === 'Planning').length || 0 },
    { name: 'Pending', value: projects?.filter(p => p.status === 'Pending').length || 0 },
  ];
  
  // Department project distribution
  const departmentProjectData = departments?.map(dept => {
    const deptProjects = projects?.filter(p => p.departmentId === dept.id) || [];
    return {
      name: dept.name,
      value: deptProjects.length,
      totalBudget: deptProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
    };
  }).sort((a, b) => b.value - a.value) || [];
  
  // Mock monthly project completion data
  const monthlyCompletionData = [
    { name: 'Jan', completed: 5, started: 8 },
    { name: 'Feb', completed: 7, started: 6 },
    { name: 'Mar', completed: 4, started: 9 },
    { name: 'Apr', completed: 6, started: 7 },
    { name: 'May', completed: 8, started: 10 },
    { name: 'Jun', completed: 9, started: 8 },
    { name: 'Jul', completed: 7, started: 9 },
    { name: 'Aug', completed: 5, started: 6 },
    { name: 'Sep', completed: 8, started: 10 },
    { name: 'Oct', completed: 10, started: 12 },
    { name: 'Nov', completed: 12, started: 9 },
    { name: 'Dec', completed: 9, started: 7 },
  ];
  
  // Mock budget trend data
  const budgetTrendData = [
    { name: 'Jan', allocated: 250000, spent: 180000 },
    { name: 'Feb', allocated: 300000, spent: 230000 },
    { name: 'Mar', allocated: 280000, spent: 260000 },
    { name: 'Apr', allocated: 320000, spent: 290000 },
    { name: 'May', allocated: 350000, spent: 310000 },
    { name: 'Jun', allocated: 370000, spent: 330000 },
    { name: 'Jul', allocated: 390000, spent: 340000 },
    { name: 'Aug', allocated: 360000, spent: 320000 },
    { name: 'Sep', allocated: 380000, spent: 350000 },
    { name: 'Oct', allocated: 400000, spent: 370000 },
    { name: 'Nov', allocated: 420000, spent: 380000 },
    { name: 'Dec', allocated: 450000, spent: 400000 },
  ];
  
  // Task completion trend data
  const taskCompletionData = [
    { name: 'Week 1', completed: 28, total: 42 },
    { name: 'Week 2', completed: 32, total: 45 },
    { name: 'Week 3', completed: 36, total: 48 },
    { name: 'Week 4', completed: 40, total: 50 },
    { name: 'Week 5', completed: 38, total: 46 },
    { name: 'Week 6', completed: 42, total: 52 },
    { name: 'Week 7', completed: 46, total: 54 },
    { name: 'Week 8', completed: 44, total: 50 },
  ];
  
  // Risk trend data
  const riskTrendData = [
    { name: 'Jan', high: 8, medium: 12, low: 6 },
    { name: 'Feb', high: 10, medium: 10, low: 8 },
    { name: 'Mar', high: 12, medium: 8, low: 10 },
    { name: 'Apr', high: 9, medium: 14, low: 7 },
    { name: 'May', high: 7, medium: 16, low: 9 },
    { name: 'Jun', high: 8, medium: 12, low: 10 },
    { name: 'Jul', high: 10, medium: 10, low: 12 },
    { name: 'Aug', high: 6, medium: 14, low: 8 },
  ];
  
  // Handle export analytics
  const handleExportAnalytics = () => {
    console.log('Exporting analytics data...');
    // This would trigger a download of analytics data in a real application
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('analyticsDashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('analyticsDescription')}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {timeRange === 'week' && t('thisWeek')}
                {timeRange === 'month' && t('thisMonth')}
                {timeRange === 'quarter' && t('thisQuarter')}
                {timeRange === 'year' && t('thisYear')}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => setTimeRange('week')}>
                {t('thisWeek')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('month')}>
                {t('thisMonth')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('quarter')}>
                {t('thisQuarter')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('year')}>
                {t('thisYear')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('activeProjects')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{activeProjects}</div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {((activeProjects / totalProjects) * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('ofTotalProjects')}: {totalProjects}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('projectsCompleted')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{completedProjects}</div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                +{((completedProjects / totalProjects) * 100).toFixed(0)}%
              </Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span>
                3 {t('completedThisMonth')}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('atRisk')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{atRiskProjects}</div>
              <Badge variant={atRiskProjects > 3 ? "destructive" : "outline"} className={atRiskProjects > 3 ? "" : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"}>
                {atRiskProjects > 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {((atRiskProjects / totalProjects) * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('needsAttention')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('budgetOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">${formatCurrency(totalBudget)}</div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {t('total')}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('spent')}: ${formatCurrency(totalSpend)}</span>
                  <span className="font-medium">{spendPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={spendPercentage} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="space-y-6">
        <Tabs defaultValue="projects" className="w-full" onValueChange={setSelectedChart}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="projects">{t('projectAnalytics')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('taskAnalytics')}</TabsTrigger>
              <TabsTrigger value="budget">{t('budgetAnalytics')}</TabsTrigger>
            </TabsList>
            
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5 mr-1" />
              {t('filter')}
            </Button>
          </div>

          {/* Project Analytics Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('projectStatusDistribution')}</CardTitle>
                  <CardDescription>
                    {t('projectStatusDistributionDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [
                            `${value} projects`, 
                            'Count'
                          ]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('departmentProjectDistribution')}</CardTitle>
                  <CardDescription>
                    {t('departmentProjectDistributionDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentProjectData.slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            value, 
                            name === 'value' ? 'Projects' : 'Budget'
                          ]} 
                        />
                        <Bar dataKey="value" fill={QATAR_MAROON} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('projectCompletionTrend')}</CardTitle>
                  <CardDescription>
                    {t('projectCompletionTrendDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyCompletionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            value, 
                            name === 'completed' ? 'Completed Projects' : 'Started Projects'
                          ]} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="completed" 
                          stroke="#8A1538" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="started" 
                          stroke="#63A615" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Task Analytics Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('taskCompletionRate')}</CardTitle>
                  <CardDescription>
                    {t('taskCompletionRateDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={taskCompletionData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            value, 
                            name === 'completed' ? 'Completed Tasks' : 'Total Tasks'
                          ]} 
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#314E89" 
                          fill="#314E89" 
                          fillOpacity={0.2} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="completed" 
                          stroke="#8A1538" 
                          fill="#8A1538" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('riskTrend')}</CardTitle>
                  <CardDescription>
                    {t('riskTrendDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={riskTrendData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            value, 
                            name === 'high' ? 'High Priority' : 
                            name === 'medium' ? 'Medium Priority' : 'Low Priority'
                          ]} 
                        />
                        <Legend />
                        <Bar dataKey="high" stackId="a" fill="#E11D48" />
                        <Bar dataKey="medium" stackId="a" fill="#FB923C" />
                        <Bar dataKey="low" stackId="a" fill="#22C55E" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budget Analytics Tab */}
          <TabsContent value="budget" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('budgetAllocationVsSpend')}</CardTitle>
                  <CardDescription>
                    {t('budgetAllocationVsSpendDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={budgetTrendData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={formatYAxisCurrency} />
                        <Tooltip 
                          formatter={(value: number) => [`$${formatCurrency(value)}`, 'Amount']} 
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="allocated" 
                          stroke="#63A615" 
                          fill="#63A615" 
                          fillOpacity={0.2} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="spent" 
                          stroke="#8A1538" 
                          fill="#8A1538" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('departmentBudgetAllocation')}</CardTitle>
                  <CardDescription>
                    {t('departmentBudgetAllocationDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentProjectData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="totalBudget"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {departmentProjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${formatCurrency(value)}`, 'Budget']} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function to format currency values
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K';
  } else {
    return value.toString();
  }
}

// Format Y-axis values for currency
function formatYAxisCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value}`;
  }
}