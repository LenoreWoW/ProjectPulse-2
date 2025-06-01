import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Goal } from "@/lib/schema-types";
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
  Building2,
} from "lucide-react";
import { Link } from "wouter";
import { PermissionGate } from "@/hooks/use-permissions";
import { usePermissions, Permission } from "@/hooks/use-permissions";

interface GoalWithProgress extends Goal {
  progress: number;
  createdByUserId?: number | null;
  status?: string | null;
  deadline?: Date | null;
}

export default function GoalsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [mainTab, setMainTab] = useState<string>("general");
  
  // Determine if user can create different types of goals based on role
  const canCreateGeneralGoal = user && user.role && ["Administrator", "MainPMO", "Executive"].includes(user.role);
  const canCreateDepartmentGoal = user && (user.role === "DepartmentDirector" || user.role === "Administrator");
  
  // Fetch general goals
  const { data: generalGoalsData, isLoading: isLoadingGeneral } = useQuery<{strategic: Goal[], annual: Goal[]}>({
    queryKey: ["/api/goals"],
  });
  
  // Fetch department goals if user is department-related
  const { data: departmentGoalsData, isLoading: isLoadingDepartment } = useQuery<{strategic: Goal[], annual: Goal[]}>({
    queryKey: ["/api/goals", { departmentOnly: true }],
    enabled: !!user?.departmentId, // Only fetch if user has department
  });
  
  // Extract goals from the response structure
  const generalGoals = generalGoalsData ? 
    [...(generalGoalsData.strategic || []), ...(generalGoalsData.annual || [])] : 
    [];
    
  const departmentGoals = departmentGoalsData ? 
    [...(departmentGoalsData.strategic || []), ...(departmentGoalsData.annual || [])] : 
    [];
  
  // Format priority badge
  const getPriorityBadge = (priority: string | null | undefined) => {
    if (!priority) return null;
    switch (priority.toLowerCase()) {
      case 'high':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full">
            {t("high")}
          </span>
        );
      case 'medium':
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
  const getGoalsWithProgress = (goals: Goal[]): GoalWithProgress[] => {
    if (!goals || !goals.length) return [];
    
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
  
  // Process data for different sections
  const generalGoalsWithProgress = getGoalsWithProgress(generalGoals);
  const departmentGoalsWithProgress = getGoalsWithProgress(departmentGoals);
  
  // Separate strategic and annual goals for each category
  const generalStrategicGoals = generalGoalsWithProgress.filter(goal => goal.isStrategic === true);
  const generalAnnualGoals = generalGoalsWithProgress.filter(goal => goal.isStrategic === false);
  
  const departmentStrategicGoals = departmentGoalsWithProgress.filter(goal => goal.isStrategic === true);
  const departmentAnnualGoals = departmentGoalsWithProgress.filter(goal => goal.isStrategic === false);
  
  // Goal card component for reuse
  const GoalCard = ({ goal }: { goal: GoalWithProgress }) => (
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
  );
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-contrast dark:text-white">{t("goals")}</h1>
        <PermissionGate permission={'canCreateGoal' as keyof Permission}>
          {permissions.canCreateGoal && (
            <Link href="/goals/new">
              <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                <Plus className="mr-2 h-4 w-4" />
                <span>{t("newGoal")}</span>
              </Button>
            </Link>
          )}
        </PermissionGate>
      </div>
      
      {/* Main Tabs */}
      <Tabs defaultValue="general" value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="flex items-center">
            <Target className="mr-2 h-4 w-4" />
            {t("generalGoals")}
          </TabsTrigger>
          <TabsTrigger 
            value="department" 
            className="flex items-center"
            disabled={!user?.departmentId}
          >
            <Building2 className="mr-2 h-4 w-4" />
            {t("departmentGoals")}
          </TabsTrigger>
        </TabsList>
        
        {/* General Goals Tab */}
        <TabsContent value="general" className="space-y-8">
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
            
            {/* Strategic Goals Sub-Tab */}
            <TabsContent value="strategic">
              {isLoadingGeneral ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-3 w-full mb-6" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generalStrategicGoals.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="pt-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t("noStrategicGoals")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    generalStrategicGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Annual Goals Sub-Tab */}
            <TabsContent value="annual">
              {isLoadingGeneral ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-3 w-full mb-6" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generalAnnualGoals.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="pt-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t("noAnnualGoals")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    generalAnnualGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Department Goals Tab */}
        <TabsContent value="department" className="space-y-8">
          {!user?.departmentId ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t("noDepartmentAccess")}</p>
              </CardContent>
            </Card>
          ) : (
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
              
              {/* Department Strategic Goals Sub-Tab */}
              <TabsContent value="strategic">
                {isLoadingDepartment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-3 w-full mb-6" />
                          <Skeleton className="h-3 w-full mb-2" />
                          <Skeleton className="h-2 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentStrategicGoals.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="pt-6 text-center">
                          <p className="text-gray-500 dark:text-gray-400">{t("noDepartmentStrategicGoals")}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      departmentStrategicGoals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Department Annual Goals Sub-Tab */}
              <TabsContent value="annual">
                {isLoadingDepartment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-3 w-full mb-6" />
                          <Skeleton className="h-3 w-full mb-2" />
                          <Skeleton className="h-2 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentAnnualGoals.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="pt-6 text-center">
                          <p className="text-gray-500 dark:text-gray-400">{t("noDepartmentAnnualGoals")}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      departmentAnnualGoals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
