import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/use-i18n-new';
import { useAuth } from '@/hooks/use-auth';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowLeftRight, 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Target,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Goal, Project } from '@shared/schema';

// Define node and link types for the visualization
interface DependencyNode {
  id: string;
  label: string;
  type: 'goal' | 'project';
  status?: string;
  priority?: string;
  isStrategic?: boolean;
  originalId: number;
}

interface DependencyLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

interface GraphData {
  nodes: DependencyNode[];
  links: DependencyLink[];
}

// Define the expanded goal type that includes relationships
interface GoalWithRelationships extends Goal {
  relatedProjects: { project: Project, weight: number }[];
  childGoals: { goal: Goal, weight: number }[];
  parentGoals: { goal: Goal, weight: number }[];
}

export default function GoalsDependenciesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const graphRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch all goals for the visualization
  const { data: goalsData, isLoading: isLoadingGoals } = useQuery<{strategic: Goal[], annual: Goal[]}>({
    queryKey: ['/api/goals'],
  });
  
  // Fetch detailed goal data for each goal
  const allGoals = goalsData ? [...(goalsData.strategic || []), ...(goalsData.annual || [])] : [];
  const goalIds = allGoals.map(goal => goal.id);
  
  // Create a query for each goal to fetch its relationships
  const goalQueries = useQuery({
    queryKey: ['/api/goals/relationships', { ids: goalIds }],
    enabled: goalIds.length > 0,
    select: (data: GoalWithRelationships[]) => {
      return data;
    }
  });
  
  // The isLoading state combines the loading state of all queries
  const isLoading = isLoadingGoals || goalQueries.isLoading;
  
  // Process the data to create the graph visualization
  useEffect(() => {
    if (!goalQueries.data) return;
    
    const goals = goalQueries.data;
    const nodes: DependencyNode[] = [];
    const links: DependencyLink[] = [];
    const processedGoals = new Set<number>();
    const processedProjects = new Set<number>();
    
    // Process each goal and its relationships
    goals.forEach((goal) => {
      if (!processedGoals.has(goal.id)) {
        // Add the goal as a node
        nodes.push({
          id: `goal-${goal.id}`,
          label: goal.title,
          type: 'goal',
          priority: goal.priority || undefined,
          isStrategic: goal.isStrategic ?? undefined,
          originalId: goal.id
        });
        processedGoals.add(goal.id);
      }
      
      // Process related projects
      goal.relatedProjects?.forEach((relation) => {
        const project = relation.project;
        if (!processedProjects.has(project.id)) {
          // Add the project as a node
          nodes.push({
            id: `project-${project.id}`,
            label: project.title,
            type: 'project',
            status: project.status || undefined,
            priority: project.priority || undefined,
            originalId: project.id
          });
          processedProjects.add(project.id);
        }
        
        // Add the link between goal and project
        links.push({
          source: `goal-${goal.id}`,
          target: `project-${project.id}`,
          value: relation.weight,
          label: t('contributesTo')
        });
      });
      
      // Process child goals
      goal.childGoals?.forEach((relation) => {
        const childGoal = relation.goal;
        if (!processedGoals.has(childGoal.id)) {
          // Add the child goal as a node
          nodes.push({
            id: `goal-${childGoal.id}`,
            label: childGoal.title,
            type: 'goal',
            priority: childGoal.priority || undefined,
            isStrategic: childGoal.isStrategic ?? undefined,
            originalId: childGoal.id
          });
          processedGoals.add(childGoal.id);
        }
        
        // Add the link between parent and child goal
        links.push({
          source: `goal-${goal.id}`,
          target: `goal-${childGoal.id}`,
          value: relation.weight,
          label: t('supportsGoal')
        });
      });
      
      // We don't need to process parent goals separately since they will be covered
      // when processing each goal in the main loop
    });
    
    setGraphData({ nodes, links });
  }, [goalQueries.data, t]);
  
  // Filter the graph data based on search query and active tab
  const filteredGraphData = React.useMemo(() => {
    if (!graphData.nodes.length) return { nodes: [], links: [] };
    
    // Filter nodes based on search and tab
    const filteredNodes = graphData.nodes.filter(node => {
      const matchesSearch = !searchQuery || 
        node.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'strategic' && node.type === 'goal' && node.isStrategic) ||
        (activeTab === 'annual' && node.type === 'goal' && !node.isStrategic) ||
        (activeTab === 'projects' && node.type === 'project');
      
      return matchesSearch && matchesTab;
    });
    
    // Get all node IDs that passed the filter
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links - only include links where both source and target nodes are included
    const filteredLinks = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, searchQuery, activeTab]);
  
  // Handle zooming in and out
  const handleZoomIn = () => {
    if (graphRef.current) {
      const newZoom = zoomLevel * 1.2;
      graphRef.current.zoom(newZoom);
      setZoomLevel(newZoom);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      const newZoom = zoomLevel / 1.2;
      graphRef.current.zoom(newZoom);
      setZoomLevel(newZoom);
    }
  };
  
  // Reset the graph view
  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
      setZoomLevel(1);
    }
  };
  
  // Handle node hover to highlight connections
  const handleNodeHover = (node: DependencyNode | null) => {
    // Reset previous highlights
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    
    if (node) {
      setHighlightNodes(new Set([node.id]));
      
      // Highlight links connected to this node
      const connectedLinks = filteredGraphData.links.filter(
        link => link.source === node.id || 
               (typeof link.source === 'object' && (link.source as any).id === node.id) ||
               link.target === node.id || 
               (typeof link.target === 'object' && (link.target as any).id === node.id)
      );
      
      setHighlightLinks(new Set(connectedLinks.map(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        return `${sourceId}-${targetId}`;
      })));
      
      // Also highlight connected nodes
      const connectedNodes = new Set<string>([node.id]);
      connectedLinks.forEach(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        
        connectedNodes.add(sourceId);
        connectedNodes.add(targetId);
      });
      
      setHighlightNodes(connectedNodes);
    }
  };
  
  // Handle node click to show details
  const handleNodeClick = (node: DependencyNode) => {
    setSelectedNode(node);
  };
  
  // Custom node painter function
  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const { id, x, y, label, type, priority } = node;
    const fontSize = 12 / globalScale;
    const isHighlighted = highlightNodes.has(id);
    const r = isHighlighted ? 8 / globalScale : 6 / globalScale;
    
    // Draw node circle
    ctx.beginPath();
    
    // Different colors for different node types
    if (type === 'goal') {
      if (node.isStrategic) {
        ctx.fillStyle = isHighlighted ? '#9333ea' : '#a855f7'; // Purple for strategic goals
      } else {
        ctx.fillStyle = isHighlighted ? '#0284c7' : '#0ea5e9'; // Blue for annual goals
      }
    } else {
      // Project nodes
      ctx.fillStyle = isHighlighted ? '#059669' : '#10b981'; // Green for projects
    }
    
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add priority indicator if available
    if (priority) {
      ctx.beginPath();
      let priorityColor;
      switch (priority) {
        case 'High':
          priorityColor = '#ef4444'; // Red
          break;
        case 'Medium':
          priorityColor = '#f59e0b'; // Amber
          break;
        case 'Low':
          priorityColor = '#65a30d'; // Lime
          break;
        default:
          priorityColor = '#94a3b8'; // Slate
      }
      
      ctx.fillStyle = priorityColor;
      ctx.arc(x + r, y - r, r / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Label
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHighlighted ? '#ffffff' : '#f8fafc';
    const maxLength = 20;
    const displayLabel = label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
    ctx.fillText(displayLabel, x, y + r + fontSize);
  };
  
  // Custom link painter function
  const paintLink = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const isHighlighted = highlightLinks.has(`${sourceId}-${targetId}`);
    
    // Draw link
    const start = link.source;
    const end = link.target;
    
    if (!start || !end) return;
    
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;
    
    // Calculate the control point for the curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Define the arrow properties
    const arrowLength = 10 / globalScale;
    const arrowWidth = 5 / globalScale;
    
    // Calculate the direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Calculate the perpendicular direction
    const perpX = -dirY;
    const perpY = dirX;
    
    // Calculate end points that don't overlap the nodes
    const nodeRadius = 6 / globalScale;
    const startX = x1 + dirX * nodeRadius;
    const startY = y1 + dirY * nodeRadius;
    const endX = x2 - dirX * nodeRadius;
    const endY = y2 - dirY * nodeRadius;
    
    // Draw the link line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Define a curve for the link
    const cpX = (startX + endX) / 2 + perpX * (link.value * 10 / globalScale);
    const cpY = (startY + endY) / 2 + perpY * (link.value * 10 / globalScale);
    
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    
    ctx.strokeStyle = isHighlighted ? '#f97316' : '#94a3b8';
    ctx.lineWidth = (isHighlighted ? 2.5 : 1.5) / globalScale;
    ctx.stroke();
    
    // Calculate a point near the end for the arrow and label
    const t = 0.9; // position along the curve for the arrow (0-1)
    const qt = 1 - t;
    const arrowX = qt * qt * startX + 2 * qt * t * cpX + t * t * endX;
    const arrowY = qt * qt * startY + 2 * qt * t * cpY + t * t * endY;
    
    // Calculate the direction at this point
    const tangentX = 2 * qt * (cpX - startX) + 2 * t * (endX - cpX);
    const tangentY = 2 * qt * (cpY - startY) + 2 * t * (endY - cpY);
    
    // Normalize the tangent vector
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    const normTangentX = tangentX / tangentLength;
    const normTangentY = tangentY / tangentLength;
    
    // Calculate the perpendicular direction
    const normPerpX = -normTangentY;
    const normPerpY = normTangentX;
    
    // Draw the arrowhead
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * normTangentX + arrowWidth * normPerpX,
      arrowY - arrowLength * normTangentY + arrowWidth * normPerpY
    );
    ctx.lineTo(
      arrowX - arrowLength * normTangentX - arrowWidth * normPerpX,
      arrowY - arrowLength * normTangentY - arrowWidth * normPerpY
    );
    ctx.closePath();
    
    ctx.fillStyle = isHighlighted ? '#f97316' : '#94a3b8';
    ctx.fill();
    
    // Add a weight indicator if the link has a value > 1
    if (link.value > 1) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      ctx.beginPath();
      ctx.arc(midX, midY, (8 * link.value / 10) / globalScale, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted ? 'rgba(249, 115, 22, 0.7)' : 'rgba(148, 163, 184, 0.7)';
      ctx.fill();
      
      ctx.font = `${10 / globalScale}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(link.value.toString(), midX, midY);
    }
  };

  // Define the details panel based on the selected node
  const DetailsPanel = () => {
    if (!selectedNode) {
      return (
        <div className="flex flex-col items-center justify-center p-4 h-full">
          <Target className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-lg text-center text-muted-foreground">
            {t('selectNodeToViewDetails')}
          </p>
        </div>
      );
    }
    
    const isGoal = selectedNode.type === 'goal';
    
    // Find the original data for the selected node
    const originalData = isGoal 
      ? allGoals.find(g => g.id === selectedNode.originalId)
      : null;
    
    // For goals, find related data
    const goalRelationships = isGoal && goalQueries.data 
      ? goalQueries.data.find(g => g.id === selectedNode.originalId)
      : null;
    
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {isGoal ? (
            <Target className="h-5 w-5 text-primary" />
          ) : (
            <Briefcase className="h-5 w-5 text-primary" />
          )}
          <h3 className="text-lg font-semibold">{selectedNode.label}</h3>
        </div>
        
        <div className="grid gap-2 mb-4">
          {selectedNode.priority && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('priority')}</span>
              <Badge variant={selectedNode.priority === 'High' ? 'destructive' : 
                           selectedNode.priority === 'Medium' ? 'secondary' : 'outline'}>
                {selectedNode.priority}
              </Badge>
            </div>
          )}
          
          {isGoal && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('type')}</span>
              <Badge variant={selectedNode.isStrategic ? 'secondary' : 'default'}>
                {selectedNode.isStrategic ? t('strategic') : t('annual')}
              </Badge>
            </div>
          )}
          
          {!isGoal && selectedNode.status && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('status')}</span>
              <Badge>{selectedNode.status}</Badge>
            </div>
          )}
        </div>
        
        {isGoal && originalData && (
          <div className="mb-4">
            {originalData.description && (
              <div className="mb-2">
                <h4 className="text-sm font-medium mb-1">{t('description')}</h4>
                <p className="text-sm text-muted-foreground">{originalData.description}</p>
              </div>
            )}
            
            {originalData.departmentId && (
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">{t('department')}</span>
                <span className="text-sm font-medium">ID: {originalData.departmentId}</span>
              </div>
            )}
            
            {originalData.deadline && (
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">{t('deadline')}</span>
                <span className="text-sm font-medium">
                  {new Date(originalData.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Goal relationships */}
        {isGoal && goalRelationships && (
          <>
            <h4 className="font-medium text-sm mb-2">{t('connections')}</h4>
            
            {goalRelationships.relatedProjects?.length > 0 && (
              <div className="mb-4">
                <h5 className="text-xs text-muted-foreground mb-1">{t('contributesToProjects')}</h5>
                <div className="space-y-1">
                  {goalRelationships.relatedProjects.map(({ project, weight }) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Briefcase className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{project.title}</span>
                      </div>
                      {weight > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {t('weight')}: {weight}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {goalRelationships.childGoals?.length > 0 && (
              <div className="mb-4">
                <h5 className="text-xs text-muted-foreground mb-1">{t('parentTo')}</h5>
                <div className="space-y-1">
                  {goalRelationships.childGoals.map(({ goal, weight }) => (
                    <div key={goal.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{goal.title}</span>
                      </div>
                      {weight > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {t('weight')}: {weight}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {goalRelationships.parentGoals?.length > 0 && (
              <div className="mb-4">
                <h5 className="text-xs text-muted-foreground mb-1">{t('childOf')}</h5>
                <div className="space-y-1">
                  {goalRelationships.parentGoals.map(({ goal, weight }) => (
                    <div key={goal.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{goal.title}</span>
                      </div>
                      {weight > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {t('weight')}: {weight}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!goalRelationships.relatedProjects?.length && 
             !goalRelationships.childGoals?.length && 
             !goalRelationships.parentGoals?.length && (
              <p className="text-sm text-muted-foreground">
                {t('noGoalConnections')}
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto pt-4 pb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main visualization panel */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{t('goalDependencies')}</h1>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder={t('searchGoalsDependenciesPlaceholder')} 
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1" /> {t('filter')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{t('goalType')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveTab('all')}>
                    {t('all')}
                    {activeTab === 'all' && ' ✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('strategic')}>
                    {t('strategic')}
                    {activeTab === 'strategic' && ' ✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('annual')}>
                    {t('annual')}
                    {activeTab === 'annual' && ' ✓'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab('projects')}>
                    {t('projects')}
                    {activeTab === 'projects' && ' ✓'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Card className="overflow-hidden border border-border">
            <CardHeader className="pb-0">
              <CardTitle>{t('goalDependencies')}</CardTitle>
              <CardDescription>{t('goalDependenciesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[600px] w-full relative bg-muted rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-t-2 border-qatar-maroon rounded-full"></div>
                  </div>
                ) : filteredGraphData.nodes.length > 0 ? (
                  <>
                    <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
                      <Button size="sm" variant="secondary" onClick={handleZoomIn}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleZoomOut}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <ForceGraph2D
                      ref={graphRef}
                      graphData={filteredGraphData}
                      nodeCanvasObject={paintNode}
                      linkCanvasObject={paintLink}
                      linkDirectionalArrowLength={3.5}
                      linkDirectionalArrowRelPos={1}
                      linkCurvature={0.25}
                      nodeRelSize={6}
                      onNodeHover={handleNodeHover}
                      onNodeClick={handleNodeClick}
                      cooldownTicks={100}
                      d3AlphaDecay={0.02}
                      d3VelocityDecay={0.1}
                      width={1000}
                      height={600}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Network className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      {searchQuery ? t('noDependenciesFound') : t('noGoalDependencies')}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                      {t('noGoalDependenciesDescription')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Legend */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">{t('legend')}</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#a855f7] mr-2"></div>
                <span className="text-sm">{t('strategicGoal')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#0ea5e9] mr-2"></div>
                <span className="text-sm">{t('annualGoal')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#10b981] mr-2"></div>
                <span className="text-sm">{t('project')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#ef4444] mr-2"></div>
                <span className="text-sm">{t('highPriority')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#f97316] mr-1"></div>
                <div className="w-3 h-3 rounded-full bg-[#f97316] mr-1"></div>
                <div className="w-4 h-4 rounded-full bg-[#f97316] mr-2"></div>
                <span className="text-sm">{t('relationshipWeight')}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('hoverOverNodesTip')}
            </p>
          </div>
        </div>
        
        {/* Details panel */}
        <div className="w-full lg:w-96">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t('goalDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailsPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 