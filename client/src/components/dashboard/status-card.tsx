import { ReactNode, useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { ProjectStatusModal } from "@/components/dashboard/project-status-modal";
import { Project } from "@shared/schema";
import { ChevronRight } from "lucide-react";

interface StatusCardProps {
  icon: ReactNode;
  title: string;
  count: number;
  status: string;
  projects: Project[];
  color?: "default" | "blue" | "green" | "amber" | "red" | "purple";
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

  // Define color classes based on the color prop
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
      default:
        return "bg-black/20 text-white dark:bg-white/10 dark:text-white";
    }
  };

  const iconBgClass = getColorClasses();

  return (
    <>
      <div 
        className="bg-black/20 backdrop-filter backdrop-blur-sm rounded-xl p-5 flex flex-col transition-all hover:bg-black/30 group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center mb-3">
          <div className={`p-2 rounded-lg mr-3 ${iconBgClass}`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-white text-opacity-90">{title}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-2xl font-bold text-white">{count}</span>
          <span className="text-xs text-white/80 group-hover:text-white/90 transition-colors flex items-center">
            {t("viewAll")}
            <ChevronRight className="h-3 w-3 ml-1" />
          </span>
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