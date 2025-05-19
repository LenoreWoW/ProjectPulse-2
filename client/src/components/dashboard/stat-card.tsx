import { ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n-new";

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  cardBorder?: string;
}

export function StatCard({ title, value, icon, iconBgColor, iconTextColor, cardBorder }: StatCardProps) {
  const { isRtl } = useI18n();
  
  return (
    <div className={`bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden border-l-4 ${cardBorder || 'border-qatar-maroon'}`}>
      <div className="flex flex-col p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
          <div className={`p-2 rounded-lg ${iconBgColor} ${iconTextColor}`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
