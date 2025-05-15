import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import { Project, Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ZoomIn,
  ZoomOut,
  Minimize,
  MoveHorizontal,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type DependencyNode = {
  id: string;
  label: string;
  type: "project" | "goal";
  status?: string;
  priority?: string;
  originalId: number;
};

type DependencyLink = {
  source: string;
  target: string;
  value: number;
  label?: string;
};

export default function DependenciesPage() {
  const { t } = useI18n();
  const [view, setView] = useState<"project-to-project" | "project-to-goal">(
    "project-to-project"
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Fetch projects data
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch goals data
  const { data: goals, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Fetch departments data
  const { data: departments, isLoading: departmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch project dependencies data
  const { data: projectDependencies, isLoading: projectDependenciesLoading } = useQuery<any[]>({
    queryKey: ["/api/projects/dependencies"],
  });

  // Fetch project-goal relationships data
  const { data: projectGoals, isLoading: projectGoalsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects/goals"],
  });

  const isLoading = projectsLoading || goalsLoading || departmentsLoading || 
                   projectDependenciesLoading || projectGoalsLoading;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Completed":
        return "#10b981"; // green
      case "InProgress":
        return "#3b82f6"; // blue
      case "Planning":
        return "#8b5cf6"; // purple
      case "OnHold":
        return "#f59e0b"; // amber
      case "Pending":
        return "#6b7280"; // gray
      default:
        return "#6b7280"; // gray
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "Critical":
        return "#ef4444"; // red
      case "High":
        return "#f59e0b"; // amber
      case "Medium":
        return "#3b82f6"; // blue
      case "Low":
        return "#10b981"; // green
      default:
        return "#6b7280"; // gray
    }
  };

  // Filter and transform data based on selected department and view
  const getGraphData = () => {
    if (!projects || !goals || !projectDependencies || !projectGoals) {
      return { nodes: [], links: [] };
    }

    let filteredProjects = selectedDepartmentId
      ? projects.filter(project => project.departmentId.toString() === selectedDepartmentId)
      : projects;

    let nodes: DependencyNode[] = [];
    let links: DependencyLink[] = [];

    if (view === "project-to-project") {
      // Add project nodes
      nodes = filteredProjects.map(project => ({
        id: `p-${project.id}`,
        label: project.title,
        type: "project",
        status: project.status,
        priority: project.priority,
        originalId: project.id
      }));

      // Add project dependency links
      projectDependencies.forEach(dep => {
        const sourceProject = filteredProjects.find(p => p.id === dep.projectId);
        const targetProject = filteredProjects.find(p => p.id === dep.dependsOnProjectId);
        
        if (sourceProject && targetProject) {
          links.push({
            source: `p-${dep.projectId}`,
            target: `p-${dep.dependsOnProjectId}`,
            value: 1,
            label: "depends on"
          });
        }
      });
    } else {
      // Add project nodes
      nodes = filteredProjects.map(project => ({
        id: `p-${project.id}`,
        label: project.title,
        type: "project",
        status: project.status,
        priority: project.priority,
        originalId: project.id
      }));

      // Add goal nodes
      goals.forEach(goal => {
        nodes.push({
          id: `g-${goal.id}`,
          label: goal.title,
          type: "goal",
          priority: goal.priority,
          originalId: goal.id
        });
      });

      // Add project-goal links
      projectGoals.forEach(pg => {
        const project = filteredProjects.find(p => p.id === pg.projectId);
        
        if (project) {
          links.push({
            source: `p-${pg.projectId}`,
            target: `g-${pg.goalId}`,
            value: pg.weight || 1,
            label: `weight: ${pg.weight || 1}`
          });
        }
      });
    }

    return { nodes, links };
  };

  // Prepare graph data
  const graphData = getGraphData();

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, 3));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.3));
  };

  // Handle reset view
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle mouse move for panning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Simple force simulation (in a real app, you'd use D3.js or a similar library)
  const simulateForceDirected = () => {
    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    const nodePositions: Record<string, {x: number, y: number}> = {};
    
    // Position nodes in a circle
    graphData.nodes.forEach((node, index) => {
      const angle = (index / graphData.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions[node.id] = { x, y };
    });
    
    return nodePositions;
  };
  
  const nodePositions = simulateForceDirected();

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("dependencies")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t("dependenciesDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">{t("viewType")}</label>
              <Select
                value={view}
                onValueChange={(value) => setView(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectViewType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project-to-project">{t("projectToProject")}</SelectItem>
                  <SelectItem value="project-to-goal">{t("projectToGoal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">{t("department")}</label>
              <Select
                value={selectedDepartmentId || ""}
                onValueChange={(value) => setSelectedDepartmentId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allDepartments")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("allDepartments")}</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                title={t("zoomIn")}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                title={t("zoomOut")}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetView}
                title={t("resetView")}
              >
                <Minimize className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t("refresh")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-qatar-maroon mr-2"></div>
                <span className="text-sm">{t("project")}</span>
              </div>
              {view === "project-to-goal" && (
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">{t("goal")}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {t("completed")}
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {t("inProgress")}
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  {t("onHold")}
                </Badge>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("noDataFound")}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {view === "project-to-project"
                  ? t("noProjectDependenciesFound")
                  : t("noProjectGoalRelationsFound")}
                {selectedDepartmentId && t("tryChangingDepartmentFilter")}
              </p>
            </div>
          ) : (
            <div 
              className="relative min-h-[500px] border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 1000 600"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                  transition: isPanning ? "none" : "transform 0.3s ease",
                }}
              >
                {/* Draw connection lines first so they appear behind nodes */}
                {graphData.links.map((link, index) => {
                  const source = nodePositions[link.source];
                  const target = nodePositions[link.target];
                  
                  if (!source || !target) return null;
                  
                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2;
                  
                  return (
                    <g key={`link-${index}`}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={view === "project-to-project" ? "#666" : "#888"}
                        strokeWidth={link.value * 2}
                        strokeOpacity={0.6}
                      />
                      {link.label && (
                        <text
                          x={midX}
                          y={midY}
                          dy={-5}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#888"
                          className="select-none"
                        >
                          {link.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                
                {/* Draw nodes */}
                {graphData.nodes.map((node) => {
                  const position = nodePositions[node.id];
                  if (!position) return null;
                  
                  const fillColor = node.type === "goal" 
                    ? "#3b82f6" // blue for goals
                    : getStatusColor(node.status as string);
                  
                  const strokeColor = node.priority
                    ? getPriorityColor(node.priority as string)
                    : "#888";
                  
                  return (
                    <g key={node.id}>
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={node.type === "goal" ? 20 : 25}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={3}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <text
                        x={position.x}
                        y={position.y + (node.type === "goal" ? 35 : 40)}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#333"
                        className="font-medium select-none dark:fill-gray-200"
                      >
                        {node.label.length > 20 
                          ? node.label.substring(0, 20) + "..." 
                          : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 mr-3 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-300">
              {t("dependenciesNote")}
            </h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
              {t("dependenciesExplanation")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}