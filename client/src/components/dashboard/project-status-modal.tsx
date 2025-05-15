import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/hooks/use-i18n";
import { Project } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, User, Building, ChevronRight } from "lucide-react";

interface ProjectStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  projects: Project[];
  status: string;
  icon: React.ReactNode;
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

  // Map status to badge colors
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "InProgress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">{t("inProgress")}</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">{t("completed")}</Badge>;
      case "Planning":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">{t("planning")}</Badge>;
      case "OnHold":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">{t("onHold")}</Badge>;
      case "Pending":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">{t("pending")}</Badge>;
      default:
        return <Badge variant="outline">{status ? status : t("unknown")}</Badge>;
    }
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
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="rounded-lg border border-border p-4 hover:border-qatar-maroon/50 transition-colors relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate pr-4 text-lg text-foreground">
                      {project.title}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                    {project.client && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground/70" />
                        <span>{project.client}</span>
                      </div>
                    )}
                    
                    {project.managerUserId && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground/70" />
                        <span>{t("projectManager")}</span>
                      </div>
                    )}
                    
                    {project.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground/70" />
                        <span>{format(new Date(project.deadline), "PPP")}</span>
                      </div>
                    )}
                    
                    {project.departmentId && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground/70" />
                        <span>{t("department")}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/projects/${project.id}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {t("viewDetails")}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}