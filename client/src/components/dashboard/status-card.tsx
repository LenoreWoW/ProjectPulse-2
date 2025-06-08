import { ReactNode, useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { ProjectStatusModal } from "@/components/dashboard/project-status-modal";
import { Project } from "@shared/schema";
import { ChevronRight } from "lucide-react";
import { getProjectColorConfig } from "@/lib/project-colors";

interface StatusCardProps {
  icon: ReactNode;
  title: string;
  count: number;
  status: string;
  projects: Project[];
  color?: "default" | "blue" | "green" | "amber" | "red" | "purple" | "pink" | "orange";
}

export function StatusCard({
  icon,
  title,
  count,
  status,
  projects,
  color = "default"
}: StatusCardProps) {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Define color classes based on the new project color system
  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return "bg-blue-400/20 text-blue-100 dark:bg-blue-500/20 dark:text-blue-300";
      case "green":
        return "bg-green-400/20 text-green-100 dark:bg-green-500/20 dark:text-green-300";
      case "amber":
        return "bg-amber-400/20 text-amber-100 dark:bg-amber-500/20 dark:text-amber-300";
      case "red":
        return "bg-red-400/20 text-red-100 dark:bg-red-500/20 dark:text-red-300";
      case "purple":
        return "bg-purple-400/20 text-purple-100 dark:bg-purple-500/20 dark:text-purple-300";
      case "pink":
        return "bg-pink-400/20 text-pink-100 dark:bg-pink-500/20 dark:text-pink-300";
      case "orange":
        return "bg-orange-400/20 text-orange-100 dark:bg-orange-500/20 dark:text-orange-300";
      default:
        return "bg-black/20 text-white dark:bg-white/10 dark:text-white";
    }
  };

  const iconBgClass = getColorClasses();

  // Get appropriate gradient based on color
  const getGradientClass = () => {
    switch (color) {
      case "blue":
        return "from-blue-500 to-blue-600";
      case "green":
        return "from-green-500 to-green-600";
      case "amber":
        return "from-amber-500 to-amber-600";
      case "red":
        return "from-red-500 to-red-600";
      case "purple":
        return "from-purple-500 to-purple-600";
      case "pink":
        return "from-pink-500 to-pink-600";
      case "orange":
        return "from-orange-500 to-orange-600";
      default:
        return "from-qatar-maroon to-qatar-maroon/80";
    }
  };

  return (
    <>
      <div
        className={`relative bg-gradient-to-br ${getGradientClass()} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 overflow-hidden`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-6 translate-x-6"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-4 -translate-x-4"></div>
        
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${iconBgClass}`}>
              {icon}
            </div>
            <ChevronRight className="h-5 w-5 opacity-60" />
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold leading-none">
              {count}
            </div>
            <div className="text-sm font-medium opacity-90 leading-tight">
              {title}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs opacity-75">
              <span>{t("totalProjects")}</span>
              <span>{count}</span>
            </div>
          </div>
        </div>
      </div>

      <ProjectStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        projects={projects}
        status={status}
        icon={icon}
      />
    </>
  );
}