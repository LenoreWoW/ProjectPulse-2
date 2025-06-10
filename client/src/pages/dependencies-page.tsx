import { useState, useEffect, useRef } from 'react';
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
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@shared/schema';

interface DependencyNode {
  id: string;
  label: string;
  type: 'project' | 'department' | 'user';
  status?: string;
  priority?: string;
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

export default function DependenciesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const graphRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch projects for the dependency graph
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Create graph data from projects
  useEffect(() => {
    if (!projects) return;
    
    // Convert projects to graph nodes
    const nodes: DependencyNode[] = projects.map(project => ({
      id: `project-${project.id}`,
      label: project.title,
      type: 'project',
      status: project.status || undefined,
      priority: project.priority || undefined,
      originalId: project.id
    }));
    
    // Create links between projects based on dependencies
    // This is a simplification; real data would come from a dedicated dependencies API
    const links: DependencyLink[] = [];
    
    // For demo purposes, create some random connections
    projects.forEach((project, i) => {
      if (i % 3 === 0 && i < projects.length - 1) {
        links.push({
          source: `project-${project.id}`,
          target: `project-${projects[i + 1].id}`,
          value: 1,
          label: 'Depends on'
        });
      }
      
      if (i % 4 === 0 && i < projects.length - 2) {
        links.push({
          source: `project-${project.id}`,
          target: `project-${projects[i + 2].id}`,
          value: 2,
          label: 'Blocked by'
        });
      }
    });
    
    setGraphData({ nodes, links });
  }, [projects]);

  // Filter graph based on search
  const filteredGraphData = {
    nodes: graphData.nodes.filter(node => 
      !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    links: graphData.links.filter(link => {
      const sourceNode = graphData.nodes.find(n => n.id === link.source);
      const targetNode = graphData.nodes.find(n => n.id === link.target);
      
      return (!searchQuery || 
        (sourceNode && sourceNode.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (targetNode && targetNode.label.toLowerCase().includes(searchQuery.toLowerCase())));
    })
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    if (graphRef.current) {
      setZoomLevel(prev => {
        const newZoom = prev * 1.2;
        graphRef.current.zoom(newZoom);
        return newZoom;
      });
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      setZoomLevel(prev => {
        const newZoom = prev * 0.8;
        graphRef.current.zoom(newZoom);
        return newZoom;
      });
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.centerAt();
      graphRef.current.zoom(1);
      setZoomLevel(1);
    }
  };

  // Download graph as image
  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'dependencies-graph.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  // Handle node hover
  const handleNodeHover = (node: DependencyNode | null) => {
    // Reset previous highlights
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    
    if (node) {
      setHighlightNodes(new Set([node.id]));
      
      // Highlight links connected to this node
      const connectedLinks = graphData.links.filter(
        link => link.source === node.id || link.target === node.id
      );
      
      setHighlightLinks(new Set(connectedLinks.map(link => `${link.source}-${link.target}`)));
      
      // Also highlight connected nodes
      const connectedNodes = new Set<string>([node.id]);
      connectedLinks.forEach(link => {
        if (typeof link.source === 'object' && link.source !== null) {
          connectedNodes.add((link.source as any).id);
        } else {
          connectedNodes.add(link.source as string);
        }
        
        if (typeof link.target === 'object' && link.target !== null) {
          connectedNodes.add((link.target as any).id);
        } else {
          connectedNodes.add(link.target as string);
        }
      });
      
      setHighlightNodes(connectedNodes);
    }
  };

  // Handle node click
  const handleNodeClick = (node: DependencyNode) => {
    setSelectedNode(node);
  };

  // Custom node paint function for highlighting and coloring based on status
  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const { x, y, id, label, status } = node;
    
    // Different colors based on status
    let color = '#8A1538'; // Qatar maroon (default)
    if (status === 'Completed') color = '#10B981'; // Green for completed
    if (status === 'InProgress') color = '#3B82F6'; // Blue for in progress
    if (status === 'OnHold') color = '#F59E0B'; // Amber for on hold
    if (status === 'Pending') color = '#6B7280'; // Gray for pending
    
    const isHighlighted = highlightNodes.has(id);
    const size = isHighlighted ? 8 : 6;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    if (isHighlighted) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    // Draw labels for nodes
    ctx.fillStyle = '#ffffff';
    ctx.font = `${isHighlighted ? '12px' : '10px'} Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 15);
  };

  // Custom link paint function
  const paintLink = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    
    const isHighlighted = highlightLinks.has(`${link.source.id}-${link.target.id}`);
    
    // Draw link with appropriate color and width
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = isHighlighted ? '#ffffff' : '#686c7180';
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();
    
    // Draw arrow at the end
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    
    const arrowLength = 10;
    const arrowWidth = 6;
    
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
      end.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
    );
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
      end.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
    );
    ctx.fillStyle = isHighlighted ? '#ffffff' : '#686c7180';
    ctx.fill();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t('dependencies')}</h1>
        <p className="text-muted-foreground">
          {t('dependenciesDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchDependenciesPlaceholder')}
                className="pl-9"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t('filter')}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>{t('filterBy')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{t('status')}</DropdownMenuItem>
                <DropdownMenuItem>{t('department')}</DropdownMenuItem>
                <DropdownMenuItem>{t('priority')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('exportGraph')}
            </Button>
          </div>

          <Card className="overflow-hidden border border-border">
            <CardHeader className="pb-0">
              <CardTitle>{t('projectDependencies')}</CardTitle>
              <CardDescription>{t('projectDependenciesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[600px] w-full relative bg-muted rounded-lg overflow-hidden">
                {isLoadingProjects ? (
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
                      {searchQuery ? t('noDependenciesFound') : t('noDependencies')}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                      {t('noDependenciesDescription')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{selectedNode.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedNode.type === 'project' ? t('project') : 
                       selectedNode.type === 'department' ? t('department') : t('user')}
                    </p>
                  </div>

                  {selectedNode.status && (
                    <div>
                      <div className="text-sm font-medium mb-1">{t('status')}</div>
                      <Badge 
                        variant="outline" 
                        className={
                          selectedNode.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          selectedNode.status === 'InProgress' ? 'bg-blue-50 text-blue-700' :
                          selectedNode.status === 'OnHold' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-50 text-gray-700'
                        }
                      >
                        {selectedNode.status}
                      </Badge>
                    </div>
                  )}

                  {selectedNode.priority && (
                    <div>
                      <div className="text-sm font-medium mb-1">{t('priority')}</div>
                      <Badge 
                        variant="outline" 
                        className={
                          selectedNode.priority === 'High' ? 'bg-red-50 text-red-700' :
                          selectedNode.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }
                      >
                        {selectedNode.priority}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium mb-2">{t('connections')}</div>
                    <div className="space-y-2">
                      {(() => {
                        // Get all links for this node
                        const nodeLinks = graphData.links.filter(
                          link => link.source === selectedNode.id || link.target === selectedNode.id
                        );

                        if (nodeLinks.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground">
                              {t('noDependencyConnections')}
                            </p>
                          );
                        }

                        return nodeLinks.map((link, i) => {
                          const isSource = link.source === selectedNode.id;
                          const connectedNodeId = isSource ? link.target : link.source;
                          const connectedNode = graphData.nodes.find(
                            n => n.id === connectedNodeId
                          );

                          if (!connectedNode) return null;

                          return (
                            <div key={i} className="flex items-center text-sm p-2 bg-muted rounded-md">
                              {!isSource && <span>{connectedNode.label}</span>}
                              <ArrowLeftRight className="h-3 w-3 mx-2 text-muted-foreground" />
                              {isSource && <span>{connectedNode.label}</span>}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t('selectNodeToViewDetails')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('legend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#8A1538]"></span>
                  <span className="text-sm">{t('defaultNode')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#10B981]"></span>
                  <span className="text-sm">{t('completed')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#3B82F6]"></span>
                  <span className="text-sm">{t('inProgress')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#F59E0B]"></span>
                  <span className="text-sm">{t('onHold')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#6B7280]"></span>
                  <span className="text-sm">{t('pending')}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-sm font-medium">{t('tip')}: </span>
                  <span className="text-sm text-muted-foreground">
                    {t('hoverOverNodesTip')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}