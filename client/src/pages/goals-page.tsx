import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { Goal } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Progress 
} from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Calendar,
  Target,
  Flag,
} from "lucide-react";
import { Link } from "wouter";

interface GoalWithProgress extends Goal {
  progress: number;
}

export default function GoalsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  
  // Determine if user can create goals based on role
  const canCreateGoal = user && ["Administrator", "MainPMO", "DepartmentDirector", "Executive"].includes(user.role);
  
  const { data, isLoading, error } = useQuery<{strategic: Goal[], annual: Goal[]}>({
    queryKey: ["/api/goals"],
  });
  
  // Extract goals from the response structure
  const goals = data ? [...(data.strategic || []), ...(data.annual || [])] : [];
  
  // Format priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full">
            {t("high")}
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-xs rounded-full">
            {t("medium")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
            {t("low")}
          </span>
        );
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString));
  };
  
  // Calculate progress for each goal (in a real app, this would come from the API)
  const getGoalsWithProgress = (): GoalWithProgress[] => {
    if (!goals) return [];
    
    return goals.map(goal => {
      // Mock progress calculation (in a real app, this would be calculated based on related projects)
      // Use a deterministic approach based on goal ID to ensure consistent values
      const progress = ((goal.id * 17) % 101);
      
      return {
        ...goal,
        progress
      };
    });
  };
  
  const goalsWithProgress = getGoalsWithProgress();
  
  // Separate strategic and annual goals
  const strategicGoals = goalsWithProgress.filter(goal => goal.isStrategic === true);
  const annualGoals = goalsWithProgress.filter(goal => goal.isStrategic === false);
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("goals")}</h1>
        {canCreateGoal && (
          <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
            <Plus className="mr-2 h-4 w-4" />
            <span>{t("newGoal")}</span>
          </Button>
        )}
      </div>
      
      {/* Goals Content */}
      <Tabs defaultValue="strategic" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="strategic" className="flex items-center">
            <Target className="mr-2 h-4 w-4" />
            {t("strategicGoals")}
          </TabsTrigger>
          <TabsTrigger value="annual" className="flex items-center">
            <Flag className="mr-2 h-4 w-4" />
            {t("annualGoals")}
          </TabsTrigger>
        </TabsList>
        
        {/* Strategic Goals Tab */}
        <TabsContent value="strategic">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-300">{t("error")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-300">{t("somethingWentWrong")}</p>
                <p className="text-red-500 dark:text-red-400">{(error as Error).message || t("tryAgain")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategicGoals.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noStrategicGoals")}</p>
                  </CardContent>
                </Card>
              ) : (
                strategicGoals.map((goal) => (
                  <Card key={goal.id} className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{goal.title}</CardTitle>
                        {getPriorityBadge(goal.priority)}
                      </div>
                      {goal.deadline && (
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(goal.deadline)}</span>
                          </div>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                          {goal.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>{t("progress")}</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Annual Goals Tab */}
        <TabsContent value="annual">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {annualGoals.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noAnnualGoals")}</p>
                  </CardContent>
                </Card>
              ) : (
                annualGoals.map((goal) => (
                  <Card key={goal.id} className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{goal.title}</CardTitle>
                        {getPriorityBadge(goal.priority)}
                      </div>
                      {goal.deadline && (
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(goal.deadline)}</span>
                          </div>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                          {goal.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>{t("progress")}</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
