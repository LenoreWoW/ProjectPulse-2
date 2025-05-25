import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/hooks/use-i18n-new";
import { Project } from "@shared/schema";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, User, Building, ChevronRight, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProjectStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  projects: Project[];
  status: string;
  icon: ReactNode;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Extended project type to include properties that exist in the database
interface ExtendedProject extends Project {
  deadline?: string | null;
  client?: string | null;
  department?: string | null;
}

export function ProjectStatusModal({
  isOpen,
  onClose,
  title,
  projects,
  status,
  icon,
}: ProjectStatusModalProps) {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [projectManagers, setProjectManagers] = useState<Record<number, User>>({});

  // Fetch users to get project manager names
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOpen && projects.length > 0,
  });

  useEffect(() => {
    if (users && projects.length > 0) {
      const managersMap: Record<number, User> = {};
      projects.forEach(project => {
        if (project.managerUserId) {
          const manager = users.find(user => user.id === project.managerUserId);
          if (manager) {
            managersMap[project.id] = manager;
          }
        }
      });
      setProjectManagers(managersMap);
    }
  }, [users, projects]);

  // Map status to badge colors
  const getStatusBadge = (projectStatus: string) => {
    switch (projectStatus) {
      case "InProgress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{t("inProgress")}</Badge>;
      case "Completed":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t("completed")}</Badge>;
      case "Planning":
        return <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{t("planning")}</Badge>;
      case "OnHold":
        return <Badge variant="default" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{t("onHold")}</Badge>;
      case "Pending":
        return <Badge variant="default" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{t("pending")}</Badge>;
      default:
        return <Badge variant="secondary">{projectStatus}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("notSet");
    return new Date(dateString).toLocaleDateString();
  };

  const handleProjectClick = (projectId: number) => {
    setLocation(`/projects/${projectId}`);
    onClose();
  };

  const isOverdue = (project: ExtendedProject) => {
    if (!project.deadline || project.status === "Completed") return false;
    const deadlineDate = new Date(project.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-qatar-maroon/10 rounded-lg text-qatar-maroon">
              {icon}
            </div>
            {title}
          </DialogTitle>
          <DialogDescription>
            {status === "all" 
              ? t("allProjectsDescription") 
              : t("projectsInStatus", { status: t(status.toLowerCase()) })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {projects.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {t("noProjectsFound")}
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {projects.map((project) => {
                const extendedProject = project as ExtendedProject;
                return (
                  <div 
                    key={project.id} 
                    className="rounded-lg border border-border p-4 hover:border-qatar-maroon/50 transition-colors relative group"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold truncate pr-4 text-lg text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {getStatusBadge(project.status || "Unknown")}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                      {extendedProject.client && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground/70" />
                          <span>{extendedProject.client}</span>
                        </div>
                      )}
                      
                      {project.managerUserId && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground/70" />
                          <span>
                            {project.managerUserId && projectManagers[project.id] 
                              ? projectManagers[project.id].name 
                              : t("noManager")
                            }
                          </span>
                        </div>
                      )}
                      
                      {extendedProject.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground/70" />
                          <span>{formatDate(extendedProject.deadline)}</span>
                        </div>
                      )}
                      
                      {extendedProject.department && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground/70" />
                          <span>{extendedProject.department}</span>
                        </div>
                      )}
                    </div>

                    {isOverdue(extendedProject) && (
                      <Badge variant="destructive" className="absolute right-3 top-3 text-xs">
                        {t("overdue")}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={() => {
            setLocation("/projects");
            onClose();
          }}>
            {t("viewAllProjects")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}