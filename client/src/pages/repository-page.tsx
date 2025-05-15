import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/use-auth';
import { 
  Search, 
  Filter, 
  Download, 
  Copy, 
  MoreHorizontal,
  ChevronDown,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Project, Department } from '@shared/schema';

export default function RepositoryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("completed");
  
  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Filter projects based on search query and selected tab
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTab === "completed") {
      return matchesSearch && project.status === "Completed";
    } else if (selectedTab === "templates") {
      // Assuming template projects have a property or tag that identifies them
      return matchesSearch && project.type === "Template";
    }
    return false;
  });

  // Get department name by ID
  const getDepartmentName = (departmentId: number) => {
    const department = departments?.find(d => d.id === departmentId);
    return department ? department.name : '';
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const handleCopyAsTemplate = (project: Project) => {
    // Logic to copy project as a template
    console.log('Copying project as template:', project.id);
  };

  const handleDownload = (project: Project) => {
    // Logic to download project
    console.log('Downloading project:', project.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t('repository')}</h1>
        <p className="text-muted-foreground">
          {t('repositoryDescription')}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Search and filter bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('searchRepositoryPlaceholder')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <DropdownMenuItem>{t('department')}</DropdownMenuItem>
              <DropdownMenuItem>{t('date')}</DropdownMenuItem>
              <DropdownMenuItem>{t('owner')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs 
          defaultValue="completed" 
          className="w-full"
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="completed">{t('completedProjects')}</TabsTrigger>
            <TabsTrigger value="templates">{t('projectTemplates')}</TabsTrigger>
          </TabsList>

          {/* Completed Projects Tab */}
          <TabsContent value="completed" className="mt-6">
            {isLoadingProjects ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-t-2 border-qatar-maroon rounded-full"></div>
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <Card key={project.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyAsTemplate(project)}>
                              <Copy className="mr-2 h-4 w-4" />
                              {t('copyAsTemplate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(project)}>
                              <Download className="mr-2 h-4 w-4" />
                              {t('download')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription>
                        {project.description ? project.description.substring(0, 120) + (project.description.length > 120 ? '...' : '') : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{project.completedAt ? format(new Date(project.completedAt), 'MMM dd, yyyy') : '-'}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{getDepartmentName(project.departmentId)}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{project.managerName || '-'}</span>
                      </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="pt-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
                          {t('completed')}
                        </Badge>
                        {project.budget && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                            ${project.budget.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? t('noCompletedProjectsFound') : t('noCompletedProjects')}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            {isLoadingProjects ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-t-2 border-qatar-maroon rounded-full"></div>
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <Card key={project.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(project)}>
                              <Download className="mr-2 h-4 w-4" />
                              {t('download')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription>
                        {project.description ? project.description.substring(0, 120) + (project.description.length > 120 ? '...' : '') : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{getDepartmentName(project.departmentId)}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{project.managerName || '-'}</span>
                      </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="pt-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800">
                          {t('template')}
                        </Badge>
                        {project.budget && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                            ${project.budget.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? t('noTemplatesFound') : t('noTemplates')}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}