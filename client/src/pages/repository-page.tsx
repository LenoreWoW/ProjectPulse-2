import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { Project } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  Copy,
  Calendar,
  DollarSign,
  Users,
  Building,
} from "lucide-react";

export default function RepositoryPage() {
  const { t, isRtl } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("completed");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch completed projects
  const { data: completedProjects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/completed"],
    enabled: activeTab === "completed",
  });

  // Fetch global templates
  const { data: globalTemplates, isLoading: globalTemplatesLoading } = useQuery<any[]>({
    queryKey: ["/api/templates/global"],
    enabled: activeTab === "global",
  });

  // Fetch department templates
  const { data: departmentTemplates, isLoading: departmentTemplatesLoading } = useQuery<any[]>({
    queryKey: ["/api/templates/department"],
    enabled: activeTab === "department",
  });

  // Filter data based on search query
  const filteredProjects = completedProjects?.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGlobalTemplates = globalTemplates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDepartmentTemplates = departmentTemplates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Handle template use
  const handleUseTemplate = (templateId: number) => {
    // Logic to use template
    console.log("Using template:", templateId);
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("centralRepository")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t("repositoryDescription")}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={t("search")}
            className="pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="completed" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="completed">{t("completedProjects")}</TabsTrigger>
          <TabsTrigger value="global">{t("globalTemplates")}</TabsTrigger>
          <TabsTrigger value="department">{t("departmentTemplates")}</TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          {projectsLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("project")}</TableHead>
                    <TableHead>{t("department")}</TableHead>
                    <TableHead>{t("client")}</TableHead>
                    <TableHead>{t("completionDate")}</TableHead>
                    <TableHead>{t("budget")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects && filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Department {project.departmentId}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.client || "-"}</TableCell>
                        <TableCell>{formatDate(project.updatedAt)}</TableCell>
                        <TableCell>
                          {project.budget ? `$${project.budget.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleUseTemplate(project.id)}
                            >
                              <Copy className="h-3 w-3" />
                              {t("useAsTemplate")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              {t("export")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchQuery
                          ? t("noProjectsMatchingSearch")
                          : t("noCompletedProjects")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="global">
          {globalTemplatesLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGlobalTemplates && filteredGlobalTemplates.length > 0 ? (
                filteredGlobalTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{formatDate(template.createdAt)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{t("estimatedBudget")}: ${template.estimatedBudget?.toLocaleString() || "-"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{t("recommendedTeamSize")}: {template.recommendedTeamSize || "-"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        {t("useTemplate")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  {searchQuery
                    ? t("noTemplatesMatchingSearch")
                    : t("noGlobalTemplates")}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="department">
          {departmentTemplatesLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartmentTemplates && filteredDepartmentTemplates.length > 0 ? (
                filteredDepartmentTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{t("department")}: {template.departmentName}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{formatDate(template.createdAt)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{t("estimatedBudget")}: ${template.estimatedBudget?.toLocaleString() || "-"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        {t("useTemplate")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  {searchQuery
                    ? t("noTemplatesMatchingSearch")
                    : t("noDepartmentTemplates")}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}