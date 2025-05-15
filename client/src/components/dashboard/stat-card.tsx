import { ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n";

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
    <div className={`bg-white dark:bg-darker shadow rounded-lg p-6 transition-colors border ${cardBorder || 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBgColor} ${iconTextColor} ${isRtl ? 'ml-4' : 'mr-4'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
