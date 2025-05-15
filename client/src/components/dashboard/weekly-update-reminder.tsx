import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Calendar, 
  Check, 
  Clock, 
  Edit, 
  Info, 
  Loader2 
} from "lucide-react";

export function WeeklyUpdateReminder() {
  const { user } = useAuth();
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get the current date info
  const today = new Date();
  const currentDay = today.getDay(); // 0-6 (Sunday-Saturday)
  const isThursday = currentDay === 4; // Thursday is day 4
  const isFriday = currentDay === 5; // Friday is day 5
  
  // Calculate the week number and week start/end dates
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  const weekNumber = getWeekNumber(today);
  const year = today.getFullYear();
  
  // Get start and end dates of the current week
  const getWeekStartEnd = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      start: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(weekStart),
      end: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(weekEnd),
      weekStart,
      weekEnd
    };
  };
  
  const weekDates = getWeekStartEnd(today);
  
  // Only fetch data if user is a Project Manager
  const isProjectManager = user?.role === "ProjectManager";
  
  // Fetch projects managed by the current user
  const { data: managedProjects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/managed"],
    enabled: isProjectManager,
  });
  
  // Fetch weekly updates for this week
  const { data: weeklyUpdates, isLoading: updatesLoading } = useQuery<any[]>({
    queryKey: ["/api/weekly-updates", weekNumber, year],
    enabled: isProjectManager,
  });
  
  // Create a weekly update
  const createUpdateMutation = useMutation({
    mutationFn: async (data: { projectId: number; week: string; comments: string }) => {
      const response = await apiRequest("POST", "/api/weekly-updates", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t("weeklyUpdateSubmitted"),
        description: t("thankYouForYourUpdate"),
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-updates"] });
      setComments("");
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("errorSubmittingUpdate"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter projects that still need updates
  const projectsNeedingUpdates = managedProjects?.filter(project => {
    // Skip completed projects
    if (project.status === "Completed") return false;
    
    // Check if there's already an update for this project this week
    const hasUpdate = weeklyUpdates?.some(
      update => update.projectId === project.id && 
               update.week === `${year}-W${weekNumber}`
    );
    
    return !hasUpdate;
  });
  
  const handleOpenDialog = (project: Project) => {
    setSelectedProject(project);
    setComments("");
    setIsDialogOpen(true);
  };
  
  const handleSubmitUpdate = () => {
    if (!selectedProject) return;
    
    createUpdateMutation.mutate({
      projectId: selectedProject.id,
      week: `${year}-W${weekNumber}`,
      comments: comments
    });
  };
  
  if (!isProjectManager || (projectsNeedingUpdates && projectsNeedingUpdates.length === 0)) {
    return null; // Don't show anything if not a PM or no updates needed
  }
  
  // Determine severity level
  const getSeverityLevel = () => {
    if (isFriday) return "high";
    if (isThursday) return "medium";
    return "low";
  };
  
  const severity = getSeverityLevel();
  
  return (
    <Card className={`
      mb-6 shadow-lg overflow-hidden
      ${severity === "high" ? "border-2 border-red-500 dark:border-red-400" : ""}
      ${severity === "medium" ? "border-2 border-amber-500 dark:border-amber-400" : ""}
      ${severity === "low" ? "border border-qatar-maroon dark:border-qatar-maroon/70" : ""}
    `}>
      <CardHeader className={`
        py-4 px-6
        ${severity === "high" ? "bg-red-500/20 dark:bg-red-950/30" : ""}
        ${severity === "medium" ? "bg-amber-500/20 dark:bg-amber-950/30" : ""}
        ${severity === "low" ? "bg-qatar-maroon/10 dark:bg-qatar-maroon/20" : ""}
      `}>
        <div className="flex items-center">
          {severity === "high" && <AlertTriangle className="mr-2 h-5 w-5 text-red-500 dark:text-red-400" />}
          {severity === "medium" && <Info className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />}
          {severity === "low" && <Clock className="mr-2 h-5 w-5 text-qatar-maroon dark:text-qatar-maroon/90" />}
          
          <CardTitle className="text-xl">
            {t("weeklyUpdateReminder")}
          </CardTitle>
        </div>
        <CardDescription>
          {t("weekDates", { start: weekDates.start, end: weekDates.end })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {projectsLoading || updatesLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-qatar-maroon" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg
              ${severity === "high" ? "bg-red-50 dark:bg-red-950/20" : ""}
              ${severity === "medium" ? "bg-amber-50 dark:bg-amber-950/20" : ""}
              ${severity === "low" ? "bg-gray-50 dark:bg-gray-900/30" : ""}
            `}>
              <div className="flex items-start">
                <Calendar className={`h-5 w-5 mt-0.5 mr-3
                  ${severity === "high" ? "text-red-500" : ""}
                  ${severity === "medium" ? "text-amber-500" : ""}
                  ${severity === "low" ? "text-qatar-maroon" : ""}
                `} />
                <div>
                  <h3 className="font-medium">
                    {isFriday 
                      ? t("weeklyUpdateDueToday") 
                      : isThursday 
                        ? t("weeklyUpdateDueTomorrow")
                        : t("weeklyUpdateDueThisWeek")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {severity === "high" 
                      ? t("weeklyUpdateOverdueMessage") 
                      : t("weeklyUpdateReminderMessage")}
                  </p>
                </div>
              </div>
            </div>
            
            <h3 className="font-medium">{t("projectsNeedingUpdates")}</h3>
            <div className="space-y-2">
              {projectsNeedingUpdates?.map(project => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{project.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("status")}: {project.status || t("inProgress")}
                    </p>
                  </div>
                  <Button 
                    variant={severity === "high" ? "destructive" : "default"}
                    size="sm"
                    className="flex items-center"
                    onClick={() => handleOpenDialog(project)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("submitUpdate")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("weeklyProjectUpdate")}</DialogTitle>
            <DialogDescription>
              {selectedProject?.title} - {t("weekDates", { start: weekDates.start, end: weekDates.end })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t("weeklyProgressNotes")}</h4>
              <Textarea
                placeholder={t("describeProgressThisWeek")}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmitUpdate}
              disabled={!comments.trim() || createUpdateMutation.isPending}
            >
              {createUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submitUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}