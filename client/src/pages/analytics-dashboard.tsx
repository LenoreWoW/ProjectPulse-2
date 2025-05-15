import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, Download } from "lucide-react";

// Custom chart colors (Qatar-themed)
const CHART_COLORS = [
  "#8A1538", // Qatar maroon
  "#FFFFFF", // White
  "#63171B", // Darker maroon
  "#D5A1A6", // Light maroon
  "#261215", // Very dark maroon
  "#A27B7F", // Greyish maroon
  "#3E1519", // Medium dark maroon
  "#C6B4B6", // Very light maroon
];

// Define chart type options
const CHART_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "area", label: "Area Chart" },
];

// Define time range options
const TIME_RANGES = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

export default function AnalyticsDashboardPage() {
  const { t, isRtl } = useI18n();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("preset");
  const [selectedChartType, setSelectedChartType] = useState("bar");
  const [selectedTimeRange, setSelectedTimeRange] = useState("month");
  const [customizationOptions, setCustomizationOptions] = useState({
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    showLabels: true,
    enableAnimation: true,
  });
  
  // Custom chart selection state
  const [selectedDataPoints, setSelectedDataPoints] = useState<string[]>([
    "projectCount", 
    "taskCompletion"
  ]);
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading, refetch } = useQuery({
    queryKey: ["/api/analytics", selectedTimeRange],
  });
  
  // Fetch departments for filtering
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["/api/departments"],
  });
  
  // Dummy data for preset tabs
  const projectStatusData = [
    { name: t("completed"), value: 14, color: "#10b981" },
    { name: t("inProgress"), value: 25, color: "#3b82f6" },
    { name: t("planning"), value: 8, color: "#8b5cf6" },
    { name: t("onHold"), value: 5, color: "#f59e0b" },
    { name: t("pending"), value: 7, color: "#6b7280" },
  ];
  
  const projectTimelineData = [
    { month: "Jan", completed: 2, inProgress: 3, planning: 1 },
    { month: "Feb", completed: 3, inProgress: 4, planning: 2 },
    { month: "Mar", completed: 4, inProgress: 5, planning: 3 },
    { month: "Apr", completed: 2, inProgress: 7, planning: 2 },
    { month: "May", completed: 3, inProgress: 6, planning: 1 },
    { month: "Jun", completed: 5, inProgress: 4, planning: 0 },
  ];
  
  const budgetUtilizationData = [
    { department: "IT", allocated: 250000, utilized: 180000 },
    { department: "HR", allocated: 150000, utilized: 120000 },
    { department: "Finance", allocated: 180000, utilized: 90000 },
    { department: "Operations", allocated: 320000, utilized: 290000 },
    { department: "Marketing", allocated: 120000, utilized: 110000 },
  ];
  
  const userActivityData = [
    { day: "Mon", tasks: 12, changes: 8, messages: 24 },
    { day: "Tue", tasks: 18, changes: 11, messages: 30 },
    { day: "Wed", tasks: 15, changes: 7, messages: 28 },
    { day: "Thu", tasks: 20, changes: 12, messages: 32 },
    { day: "Fri", tasks: 10, changes: 5, messages: 15 },
  ];
  
  // Toggle data point selection
  const toggleDataPoint = (dataPoint: string) => {
    setSelectedDataPoints(prevSelected => 
      prevSelected.includes(dataPoint)
        ? prevSelected.filter(dp => dp !== dataPoint)
        : [...prevSelected, dataPoint]
    );
  };
  
  // Toggle customization option
  const toggleCustomizationOption = (option: string) => {
    setCustomizationOptions(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev],
    }));
  };
  
  // Generate dynamic chart based on user selections
  const renderDynamicChart = () => {
    // In a real implementation, this would filter and transform the actual analytics data
    // based on selectedDataPoints, selectedChartType, etc.
    const dynamicData = [
      { name: "Jan", projectCount: 5, taskCompletion: 78, budgetUsage: 65, riskCount: 3 },
      { name: "Feb", projectCount: 7, taskCompletion: 82, budgetUsage: 70, riskCount: 4 },
      { name: "Mar", projectCount: 8, taskCompletion: 75, budgetUsage: 80, riskCount: 2 },
      { name: "Apr", projectCount: 12, taskCompletion: 85, budgetUsage: 85, riskCount: 1 },
      { name: "May", projectCount: 15, taskCompletion: 80, budgetUsage: 88, riskCount: 3 },
      { name: "Jun", projectCount: 10, taskCompletion: 90, budgetUsage: 90, riskCount: 2 },
    ];
    
    const chartProps = {
      data: dynamicData,
      margin: { top: 20, right: 30, left: 20, bottom: 30 },
      style: { direction: isRtl ? "rtl" : "ltr" },
    };
    
    switch (selectedChartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...chartProps}>
              {customizationOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {customizationOptions.showTooltip && <Tooltip />}
              {customizationOptions.showLegend && <Legend />}
              {selectedDataPoints.map((dataPoint, index) => (
                <Bar
                  key={dataPoint}
                  dataKey={dataPoint}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  name={t(dataPoint)}
                  animationDuration={customizationOptions.enableAnimation ? 1500 : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...chartProps}>
              {customizationOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {customizationOptions.showTooltip && <Tooltip />}
              {customizationOptions.showLegend && <Legend />}
              {selectedDataPoints.map((dataPoint, index) => (
                <Line
                  key={dataPoint}
                  type="monotone"
                  dataKey={dataPoint}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  name={t(dataPoint)}
                  activeDot={{ r: 8 }}
                  animationDuration={customizationOptions.enableAnimation ? 1500 : 0}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...chartProps}>
              {customizationOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {customizationOptions.showTooltip && <Tooltip />}
              {customizationOptions.showLegend && <Legend />}
              {selectedDataPoints.map((dataPoint, index) => (
                <Area
                  key={dataPoint}
                  type="monotone"
                  dataKey={dataPoint}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  name={t(dataPoint)}
                  fillOpacity={0.6}
                  animationDuration={customizationOptions.enableAnimation ? 1500 : 0}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        // For pie charts, we need to restructure the data
        const pieData = selectedDataPoints.map(dataPoint => ({
          name: t(dataPoint),
          value: dynamicData.reduce((sum, item) => sum + (item[dataPoint as keyof typeof item] as number), 0),
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={customizationOptions.showLabels}
                label={customizationOptions.showLabels ? renderCustomizedLabel : undefined}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                animationDuration={customizationOptions.enableAnimation ? 1500 : 0}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              {customizationOptions.showTooltip && <Tooltip />}
              {customizationOptions.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div className="p-8 text-center">Select a chart type</div>;
    }
  };
  
  // Custom label for pie chart
  const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, name 
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text
        x={x}
        y={y}
        fill={CHART_COLORS[index % CHART_COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };
  
  // Export chart as PNG
  const exportChart = () => {
    // In a real implementation, this would use html-to-image or a similar library
    // to capture the current chart and download it
    alert(t("chartExportNotImplemented"));
  };
  
  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("analytics")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("analyticsDescription")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportChart} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="preset" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="preset">{t("presetAnalytics")}</TabsTrigger>
          <TabsTrigger value="custom">{t("customAnalytics")}</TabsTrigger>
        </TabsList>
        
        {/* Preset Analytics */}
        <TabsContent value="preset">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("projectStatusDistribution")}</CardTitle>
                <CardDescription>
                  {t("projectStatusDistributionDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Project Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("projectTimeline")}</CardTitle>
                <CardDescription>
                  {t("projectTimelineDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={projectTimelineData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" name={t("completed")} fill="#10b981" />
                    <Bar dataKey="inProgress" stackId="a" name={t("inProgress")} fill="#3b82f6" />
                    <Bar dataKey="planning" stackId="a" name={t("planning")} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Budget Utilization */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("budgetUtilization")}</CardTitle>
                <CardDescription>
                  {t("budgetUtilizationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={budgetUtilizationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="department" type="category" />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="allocated" name={t("allocated")} fill="#8A1538" />
                    <Bar dataKey="utilized" name={t("utilized")} fill="#A27B7F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* User Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("userActivity")}</CardTitle>
                <CardDescription>
                  {t("userActivityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={userActivityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tasks" name={t("tasks")} stroke="#8A1538" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="changes" name={t("changes")} stroke="#63171B" />
                    <Line type="monotone" dataKey="messages" name={t("messages")} stroke="#D5A1A6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Custom Analytics */}
        <TabsContent value="custom">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Control Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{t("customizeChart")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Chart Type */}
                <div className="space-y-2">
                  <Label>{t("chartType")}</Label>
                  <Select
                    value={selectedChartType}
                    onValueChange={setSelectedChartType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectChartType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Time Range */}
                <div className="space-y-2">
                  <Label>{t("timeRange")}</Label>
                  <Select
                    value={selectedTimeRange}
                    onValueChange={setSelectedTimeRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectTimeRange")} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_RANGES.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {t(range.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Data Points */}
                <div className="space-y-2">
                  <Label>{t("dataPoints")}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="projectCount" 
                        checked={selectedDataPoints.includes("projectCount")}
                        onCheckedChange={() => toggleDataPoint("projectCount")}
                      />
                      <label
                        htmlFor="projectCount"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("projectCount")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="taskCompletion" 
                        checked={selectedDataPoints.includes("taskCompletion")}
                        onCheckedChange={() => toggleDataPoint("taskCompletion")}
                      />
                      <label
                        htmlFor="taskCompletion"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("taskCompletion")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="budgetUsage" 
                        checked={selectedDataPoints.includes("budgetUsage")}
                        onCheckedChange={() => toggleDataPoint("budgetUsage")}
                      />
                      <label
                        htmlFor="budgetUsage"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("budgetUsage")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="riskCount" 
                        checked={selectedDataPoints.includes("riskCount")}
                        onCheckedChange={() => toggleDataPoint("riskCount")}
                      />
                      <label
                        htmlFor="riskCount"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("riskCount")}
                      </label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Chart Options */}
                <div className="space-y-2">
                  <Label>{t("chartOptions")}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showGrid" 
                        checked={customizationOptions.showGrid}
                        onCheckedChange={() => toggleCustomizationOption("showGrid")}
                      />
                      <label
                        htmlFor="showGrid"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("showGrid")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showLegend" 
                        checked={customizationOptions.showLegend}
                        onCheckedChange={() => toggleCustomizationOption("showLegend")}
                      />
                      <label
                        htmlFor="showLegend"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("showLegend")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showTooltip" 
                        checked={customizationOptions.showTooltip}
                        onCheckedChange={() => toggleCustomizationOption("showTooltip")}
                      />
                      <label
                        htmlFor="showTooltip"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("showTooltip")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showLabels" 
                        checked={customizationOptions.showLabels}
                        onCheckedChange={() => toggleCustomizationOption("showLabels")}
                      />
                      <label
                        htmlFor="showLabels"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("showLabels")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="enableAnimation" 
                        checked={customizationOptions.enableAnimation}
                        onCheckedChange={() => toggleCustomizationOption("enableAnimation")}
                      />
                      <label
                        htmlFor="enableAnimation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("enableAnimation")}
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Chart Display */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{t("customAnalyticsChart")}</CardTitle>
                <CardDescription>
                  {t("customAnalyticsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDataPoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {t("noDataPointsSelected")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDataPoints(["projectCount", "taskCompletion"])}
                    >
                      {t("selectDefaultDataPoints")}
                    </Button>
                  </div>
                ) : analyticsLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-qatar-maroon" />
                  </div>
                ) : (
                  renderDynamicChart()
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}