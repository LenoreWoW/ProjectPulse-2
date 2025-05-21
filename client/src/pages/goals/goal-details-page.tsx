import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Goal, Project, GoalWithRelationships } from "@/lib/schema-types";
import { useI18n } from "@/hooks/use-i18n-new";
import { 
  Calendar, 
  CalendarDays, 
  Check, 
  CheckCircle, 
  Clock, 
  Flag, 
  LinkIcon, 
  User 
} from "lucide-react";

export default function GoalDetailsPage() {
  // Extract the goal ID from the URL using wouter's useRoute
  const [match, params] = useRoute("/goals/:id");
  const id = params?.id;
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("details");
  
  const { data: goal, isLoading, error } = useQuery<GoalWithRelationships>({
    queryKey: [`/api/goals/${id}`],
    enabled: !!id,
  });

  // Helper function to format dates consistently
  const formatDate = (date?: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(dateObj);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">{t("error")}</CardTitle>
          <CardDescription>{t("goalNotFound")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400">{(error as Error)?.message || t("goalNotFoundDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  const getGoalTypeBadge = (isStrategic: boolean | null) => {
    if (isStrategic) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
          {t("strategic")}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          {t("annual")}
        </Badge>
      );
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    
    switch (priority) {
      case 'High':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
            {t("high")}
          </Badge>
        );
      case 'Medium':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
            {t("medium")}
          </Badge>
        );
      case 'Low':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
            {t("low")}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {t("active")}
          </Badge>
        );
      case 'Completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {t("completed")}
          </Badge>
        );
      case 'OnHold':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            {t("onHold")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Goal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{goal.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {getGoalTypeBadge(goal.isStrategic)}
            {getPriorityBadge(goal.priority)}
            {'status' in goal && getStatusBadge(goal.status as string | null)}
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-1" />
            {t("trackProgress")}
          </Button>
          <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white" size="sm">
            <Check className="h-4 w-4 mr-1" />
            {t("markAsComplete")}
          </Button>
        </div>
      </div>

      {/* Goal Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">{t("details")}</TabsTrigger>
          <TabsTrigger value="relationships">{t("relationships")}</TabsTrigger>
          <TabsTrigger value="progress">{t("progress")}</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("description")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {goal.description || t("noDescriptionProvided")}
                </p>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("details")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goal.departmentId && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("department")}</p>
                      <p className="font-medium">Department ID: {goal.departmentId}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("created")}</p>
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <span>{formatDate(goal.createdAt)}</span>
                    </div>
                  </div>
                  
                  {goal.deadline && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("deadline")}</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span>{formatDate(goal.deadline)}</span>
                      </div>
                    </div>
                  )}
                  
                  {goal.createdByUserId && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("createdBy")}</p>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span>User ID: {goal.createdByUserId}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Projects */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{t("contributesToProjects")}</CardTitle>
                <CardDescription>
                  {goal.relatedProjects?.length 
                    ? t("projectsRelatedToGoal", { count: goal.relatedProjects.length.toString() })
                    : t("noProjectsRelated")
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goal.relatedProjects?.length > 0 ? (
                  <ul className="space-y-3">
                    {goal.relatedProjects.map(({ project, weight }) => (
                      <li key={project.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {project.status && <span>{project.status}</span>}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {t("weight")}: {weight}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                    <LinkIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{t("noProjectsRelatedDescription")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Child Goals */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{t("parentTo")}</CardTitle>
                <CardDescription>
                  {goal.childGoals?.length 
                    ? t("childGoalsCount", { count: goal.childGoals.length.toString() })
                    : t("noChildGoals")
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goal.childGoals?.length > 0 ? (
                  <ul className="space-y-3">
                    {goal.childGoals.map(({ goal: childGoal, weight }) => (
                      <li key={childGoal.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{childGoal.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {childGoal.isStrategic ? t("strategic") : t("annual")}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {t("weight")}: {weight}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                    <Flag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{t("noChildGoalsDescription")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Parent Goals */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{t("childOf")}</CardTitle>
                <CardDescription>
                  {goal.parentGoals?.length 
                    ? t("parentGoalsCount", { count: goal.parentGoals.length.toString() })
                    : t("noParentGoals")
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goal.parentGoals?.length > 0 ? (
                  <ul className="space-y-3">
                    {goal.parentGoals.map(({ goal: parentGoal, weight }) => (
                      <li key={parentGoal.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{parentGoal.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {parentGoal.isStrategic ? t("strategic") : t("annual")}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {t("weight")}: {weight}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                    <Flag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{t("noParentGoalsDescription")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>{t("goalProgress")}</CardTitle>
              <CardDescription>{t("goalProgressDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">{t("progressTrackingComingSoon")}</p>
                <p>{t("progressTrackingDescription")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 