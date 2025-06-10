import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  FileBarChart, 
  PieChart as PieChartIcon,
  Table as TableIcon,
  Save,
  Share2
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Chart color palette
const COLORS = ['#8A1538', '#f97316', '#22c55e', '#3182ce', '#9333ea', '#ec4899', '#f43f5e', '#0ea5e9'];

// Data type definitions
type ChartType = 'bar' | 'pie' | 'table';
type DataCategory = 'projects' | 'tasks' | 'risks';

interface FilterOptions {
  status: string;
  priority: string;
  department: string;
  client: string;
}

interface SavedReport {
  id: string;
  name: string;
  dataCategory: DataCategory;
  chartType: ChartType;
  filters: FilterOptions;
}

interface Department {
  id: number;
  name: string;
}

interface Project {
  id: number;
  title: string;
  client: string;
  status: string;
  priority: string;
  budget: number;
  actualCost: number;
}

const CustomAnalyticsPage = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();

  // State for data selection and filtering
  const [dataCategory, setDataCategory] = useState<DataCategory>('projects');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    department: 'all',
    client: 'all'
  });
  const [reportName, setReportName] = useState('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Data state
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  // Fetch departments
  const { data: departmentsData = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Fetch clients (from projects)
  const { data: projectsData = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Get unique clients from projects
  const clients: string[] = Array.from(new Set(projectsData.map(project => project.client)));

  // Set statuses based on selected data category
  const getStatuses = () => {
    if (dataCategory === 'projects') {
      return ['Pending', 'Planning', 'InProgress', 'OnHold', 'Completed', 'Cancelled'];
    } else if (dataCategory === 'tasks') {
      return ['Todo', 'InProgress', 'Review', 'Completed', 'OnHold'];
    } else if (dataCategory === 'risks') {
      return ['Open', 'InProgress', 'Resolved', 'Closed'];
    }
    return [];
  };

  // Priorities
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  // Function to fetch data based on current selections
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      if (filters.priority !== 'all') {
        queryParams.append('priority', filters.priority);
      }
      
      if (filters.department !== 'all') {
        queryParams.append('department', filters.department);
      }
      
      if (filters.client !== 'all') {
        queryParams.append('client', filters.client);
      }
      
      // Make API request
      const response = await fetch(`/api/analytics/${dataCategory}?${queryParams.toString()}`);
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error(`Failed to fetch ${dataCategory} data:`, error);
      toast({
        title: t("Error"),
        description: t("Failed to fetch data. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save current report
  const saveReport = () => {
    if (!reportName) return;
    
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      dataCategory,
      chartType,
      filters: { ...filters }
    };
    
    setSavedReports([...savedReports, newReport]);
    setReportName('');
    
    toast({
      title: t("Report Saved"),
      description: t("Your custom report has been saved."),
    });
  };

  // Function to load a saved report
  const loadReport = (report: SavedReport) => {
    setDataCategory(report.dataCategory);
    setChartType(report.chartType);
    setFilters(report.filters);
    // Fetch data after loading the report
    fetchData();
    
    toast({
      title: t("Report Loaded"),
      description: t(`Loaded report: ${report.name}`),
    });
  };

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Transform data for charts based on data category
  const getChartData = () => {
    if (dataCategory === 'projects') {
      // Group projects by status
      const statusCounts: Record<string, number> = {};
      data.forEach(project => {
        statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
      });
      
      return Object.keys(statusCounts).map(status => ({
        name: status,
        count: statusCounts[status]
      }));
    } else if (dataCategory === 'tasks') {
      // Group tasks by status
      const statusCounts: Record<string, number> = {};
      data.forEach(task => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      });
      
      return Object.keys(statusCounts).map(status => ({
        name: status,
        count: statusCounts[status]
      }));
    } else {
      // Group risks by type and status
      const typeCounts: Record<string, number> = {};
      data.forEach(risk => {
        typeCounts[risk.type] = (typeCounts[risk.type] || 0) + 1;
      });
      
      return Object.keys(typeCounts).map(type => ({
        name: type,
        count: typeCounts[type]
      }));
    }
  };

  // Share the current report (copy URL to clipboard)
  const shareReport = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: t("Link Copied"),
          description: t("Report link copied to clipboard"),
        });
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        toast({
          title: t("Error"),
          description: t("Failed to copy link to clipboard"),
          variant: "destructive",
        });
      });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("customAnalytics")}</h1>
          <p className="text-muted-foreground">{t("customAnalyticsDescription")}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Data Selection Panel */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("dataSource")}</CardTitle>
              <CardDescription>{t("selectDataAndVisualization")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dataCategory">{t("dataCategory")}</Label>
                <Select
                  value={dataCategory}
                  onValueChange={(value: DataCategory) => setDataCategory(value)}
                >
                  <SelectTrigger id="dataCategory">
                    <SelectValue placeholder={t("selectDataCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">{t("projects")}</SelectItem>
                    <SelectItem value="tasks">{t("tasks")}</SelectItem>
                    <SelectItem value="risks">{t("risksAndIssues")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chartType">{t("visualizationType")}</Label>
                <Select
                  value={chartType}
                  onValueChange={(value: ChartType) => setChartType(value)}
                >
                  <SelectTrigger id="chartType">
                    <SelectValue placeholder={t("selectVisualization")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">{t("barChart")}</SelectItem>
                    <SelectItem value="pie">{t("pieChart")}</SelectItem>
                    <SelectItem value="table">{t("tableView")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">{t("filters")}</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="status">{t("status")}</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value: string) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder={t("allStatuses")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allStatuses")}</SelectItem>
                        {getStatuses().map(status => (
                          <SelectItem key={status} value={status}>{t(status)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">{t("priority")}</Label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value: string) => handleFilterChange('priority', value)}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder={t("allPriorities")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allPriorities")}</SelectItem>
                        {priorities.map(priority => (
                          <SelectItem key={priority} value={priority}>{t(priority)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {dataCategory === 'projects' && (
                    <>
                      <div>
                        <Label htmlFor="department">{t("department")}</Label>
                        <Select
                          value={filters.department}
                          onValueChange={(value: string) => handleFilterChange('department', value)}
                        >
                          <SelectTrigger id="department">
                            <SelectValue placeholder={t("allDepartments")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("allDepartments")}</SelectItem>
                            {departmentsData.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="client">{t("client")}</Label>
                        <Select
                          value={filters.client}
                          onValueChange={(value: string) => handleFilterChange('client', value)}
                        >
                          <SelectTrigger id="client">
                            <SelectValue placeholder={t("allClients")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("allClients")}</SelectItem>
                            {clients.map((client: string) => (
                              <SelectItem key={client} value={client}>{client}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={fetchData} className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("generateReport")}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("saveReport")}</CardTitle>
              <CardDescription>{t("saveReportDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="reportName">{t("reportName")}</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportName(e.target.value)}
                    placeholder={t("enterReportName")}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={shareReport}
                className="flex-1 mr-2"
              >
                <Share2 className="mr-2 h-4 w-4" />
                {t("shareReport")}
              </Button>
              
              <Button 
                onClick={saveReport} 
                disabled={!reportName}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {t("saveReport")}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Visualization Area */}
        <div className="w-full md:w-2/3">
          <Card className="h-[calc(100vh-230px)]">
            <CardHeader>
              <CardTitle>
                {t("visualization")}
                {chartType === 'bar' && <BarChart3 className="inline-block ml-2 h-5 w-5" />}
                {chartType === 'pie' && <PieChartIcon className="inline-block ml-2 h-5 w-5" />}
                {chartType === 'table' && <TableIcon className="inline-block ml-2 h-5 w-5" />}
              </CardTitle>
              <CardDescription>
                {data.length > 0 
                  ? t("showingDataCount", { count: data.length.toString() })
                  : t("noDataDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-120px)]">
              {isLoading ? (
                <div className="h-full flex justify-center items-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
                    <p className="mt-4 text-muted-foreground">{t("loadingData")}</p>
                  </div>
                </div>
              ) : data.length > 0 ? (
                <>
                  {chartType === 'bar' && (
                    <div className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8A1538" name={t("count")} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {chartType === 'pie' && (
                    <div className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            cx="50%"
                            cy="45%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {chartType === 'table' && (
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader>
                          {dataCategory === 'projects' && (
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>{t("title")}</TableHead>
                              <TableHead>{t("client")}</TableHead>
                              <TableHead>{t("status")}</TableHead>
                              <TableHead>{t("priority")}</TableHead>
                              <TableHead>{t("budget")}</TableHead>
                            </TableRow>
                          )}
                          
                          {dataCategory === 'tasks' && (
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>{t("title")}</TableHead>
                              <TableHead>{t("projectId")}</TableHead>
                              <TableHead>{t("status")}</TableHead>
                              <TableHead>{t("priority")}</TableHead>
                              <TableHead>{t("deadline")}</TableHead>
                            </TableRow>
                          )}
                          
                          {dataCategory === 'risks' && (
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>{t("type")}</TableHead>
                              <TableHead>{t("projectId")}</TableHead>
                              <TableHead>{t("description")}</TableHead>
                              <TableHead>{t("status")}</TableHead>
                              <TableHead>{t("priority")}</TableHead>
                            </TableRow>
                          )}
                        </TableHeader>
                        <TableBody>
                          {dataCategory === 'projects' && data.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>{project.id}</TableCell>
                              <TableCell>{project.title}</TableCell>
                              <TableCell>{project.client}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{project.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={(typeof project.priority === 'string' && (project.priority === 'High' || project.priority === 'Critical')) ? "destructive" : "outline"}>
                                  {project.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>{project.budget}</TableCell>
                            </TableRow>
                          ))}
                          
                          {dataCategory === 'tasks' && data.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>{task.id}</TableCell>
                              <TableCell>{task.title}</TableCell>
                              <TableCell>{task.projectId}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{task.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={(task.priority === 'High' || task.priority === 'Critical') ? "destructive" : "outline"}>
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>{task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}</TableCell>
                            </TableRow>
                          ))}
                          
                          {dataCategory === 'risks' && data.map((risk) => (
                            <TableRow key={risk.id}>
                              <TableCell>{risk.id}</TableCell>
                              <TableCell>{risk.type}</TableCell>
                              <TableCell>{risk.projectId}</TableCell>
                              <TableCell>{risk.description}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{risk.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={(risk.priority === 'High' || risk.priority === 'Critical') ? "destructive" : "outline"}>
                                  {risk.priority}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </>
              ) : (
                <div className="h-full flex justify-center items-center">
                  <div className="text-center">
                    <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">{t("noDataAvailable")}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("selectDataAndGenerateReport")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Reports Section */}
          {savedReports.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t("savedReports")}</CardTitle>
                <CardDescription>{t("savedReportsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedReports.map(report => (
                    <Card key={report.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => loadReport(report)}>
                      <CardContent className="p-4 flex flex-col items-center">
                        <div className="mt-2">
                          {report.chartType === 'bar' && <BarChart3 className="h-10 w-10 text-qatar-maroon" />}
                          {report.chartType === 'pie' && <PieChartIcon className="h-10 w-10 text-qatar-maroon" />}
                          {report.chartType === 'table' && <TableIcon className="h-10 w-10 text-qatar-maroon" />}
                        </div>
                        <h3 className="mt-2 font-medium text-lg">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t(report.dataCategory.charAt(0).toUpperCase() + report.dataCategory.slice(1))}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomAnalyticsPage; 