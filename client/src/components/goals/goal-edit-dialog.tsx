import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n-new";
import { Goal, Project, GoalRelationship, ProjectGoal } from "@/lib/schema-types";
import { Flag, Plus, X, LinkIcon } from "lucide-react";

interface GoalEditDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalEditDialog({ goal, open, onOpenChange }: GoalEditDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Fetch goal relationships
  const { data: goalRelationships = [] } = useQuery<GoalRelationship[]>({
    queryKey: [`/api/goals/${goal.id}/relationships`],
    enabled: open,
  });

  // Fetch project relationships
  const { data: projectGoals = [] } = useQuery<ProjectGoal[]>({
    queryKey: [`/api/goals/${goal.id}/projects`],
    enabled: open,
  });

  // Fetch all goals for linking
  const { data: allGoals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: open,
  });

  // Fetch all projects for linking
  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: open,
  });

  // Get goal details for relationships
  const goalIds = goalRelationships.map(rel => rel.childGoalId);
  const { data: linkedGoals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals", { ids: goalIds }],
    enabled: open && goalIds.length > 0,
    queryFn: async () => {
      const goals = await Promise.all(
        goalIds.map(id => 
          fetch(`/api/goals/${id}`).then(res => res.json())
        )
      );
      return goals.filter(Boolean);
    },
  });

  // Get project details for relationships
  const projectIds = projectGoals.map(pg => pg.projectId);
  const { data: linkedProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", { ids: projectIds }],
    enabled: open && projectIds.length > 0,
    queryFn: async () => {
      const projects = await Promise.all(
        projectIds.map(id => 
          fetch(`/api/projects/${id}`).then(res => res.json())
        )
      );
      return projects.filter(Boolean);
    },
  });

  // Link goal to another goal
  const linkToGoalMutation = useMutation({
    mutationFn: async (childGoalId: number) => {
      const response = await fetch(`/api/goals/${goal.id}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childGoalId, weight: 1 }),
      });
      if (!response.ok) throw new Error("Failed to link goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goal.id}/relationships`] });
      toast({ title: t("goalLinkedToGoal") });
      setSelectedGoalId("");
    },
    onError: () => {
      toast({ title: t("failedToLinkGoalToGoal"), variant: "destructive" });
    },
  });

  // Unlink goal from another goal
  const unlinkFromGoalMutation = useMutation({
    mutationFn: async (relationshipId: number) => {
      const response = await fetch(`/api/goal-relationships/${relationshipId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to unlink goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goal.id}/relationships`] });
      toast({ title: t("goalUnlinkedFromGoal") });
    },
    onError: () => {
      toast({ title: t("failedToUnlinkGoalFromGoal"), variant: "destructive" });
    },
  });

  // Link goal to project
  const linkToProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await fetch(`/api/projects/${projectId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id, weight: 1 }),
      });
      if (!response.ok) throw new Error("Failed to link project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goal.id}/projects`] });
      toast({ title: t("goalLinkedToProject") });
      setSelectedProjectId("");
    },
    onError: () => {
      toast({ title: t("failedToLinkGoalToProject"), variant: "destructive" });
    },
  });

  // Unlink goal from project
  const unlinkFromProjectMutation = useMutation({
    mutationFn: async (projectGoalId: number) => {
      const response = await fetch(`/api/project-goals/${projectGoalId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to unlink project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goal.id}/projects`] });
      toast({ title: t("goalUnlinkedFromProject") });
    },
    onError: () => {
      toast({ title: t("failedToUnlinkGoalFromProject"), variant: "destructive" });
    },
  });

  const handleLinkToGoal = () => {
    if (selectedGoalId) {
      linkToGoalMutation.mutate(parseInt(selectedGoalId));
    }
  };

  const handleUnlinkFromGoal = (relationshipId: number) => {
    unlinkFromGoalMutation.mutate(relationshipId);
  };

  const handleLinkToProject = () => {
    if (selectedProjectId) {
      linkToProjectMutation.mutate(parseInt(selectedProjectId));
    }
  };

  const handleUnlinkFromProject = (projectGoalId: number) => {
    unlinkFromProjectMutation.mutate(projectGoalId);
  };

  // Filter out already linked goals and the current goal
  const availableGoals = allGoals.filter(g => 
    g.id !== goal.id && 
    !goalRelationships.some(rel => rel.childGoalId === g.id)
  );

  // Filter out already linked projects
  const availableProjects = allProjects.filter(p => 
    !projectGoals.some(pg => pg.projectId === p.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editGoalRelationships")}</DialogTitle>
          <DialogDescription>
            {t("manageRelationships")} for "{goal.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goal Relationships */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              <h3 className="text-lg font-semibold">{t("linkedGoals")}</h3>
            </div>

            {/* Currently linked goals */}
            {linkedGoals.length > 0 ? (
              <div className="space-y-2">
                {linkedGoals.map((linkedGoal) => {
                  const relationship = goalRelationships.find(rel => rel.childGoalId === linkedGoal.id);
                  return (
                    <div key={linkedGoal.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{linkedGoal.title}</p>
                        <p className="text-sm text-gray-500">
                          {linkedGoal.isStrategic ? t("strategic") : t("annual")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => relationship && handleUnlinkFromGoal(relationship.id)}
                        disabled={unlinkFromGoalMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("noLinkedGoals")}</p>
            )}

            {/* Link new goal */}
            {availableGoals.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("selectGoalToLink")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGoals.map((availableGoal) => (
                      <SelectItem key={availableGoal.id} value={availableGoal.id.toString()}>
                        {availableGoal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleLinkToGoal}
                  disabled={!selectedGoalId || linkToGoalMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Project Relationships */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              <h3 className="text-lg font-semibold">{t("linkedProjects")}</h3>
            </div>

            {/* Currently linked projects */}
            {linkedProjects.length > 0 ? (
              <div className="space-y-2">
                {linkedProjects.map((linkedProject) => {
                  const projectGoal = projectGoals.find(pg => pg.projectId === linkedProject.id);
                  return (
                    <div key={linkedProject.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{linkedProject.title}</p>
                        <p className="text-sm text-gray-500">
                          {linkedProject.status}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => projectGoal && handleUnlinkFromProject(projectGoal.id)}
                        disabled={unlinkFromProjectMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("noLinkedProjects")}</p>
            )}

            {/* Link new project */}
            {availableProjects.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("selectProjectToLink")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((availableProject) => (
                      <SelectItem key={availableProject.id} value={availableProject.id.toString()}>
                        {availableProject.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleLinkToProject}
                  disabled={!selectedProjectId || linkToProjectMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 