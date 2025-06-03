import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, Briefcase } from "lucide-react";

interface BudgetData {
  totalBudget: number;
  actualCost: number;
  remainingBudget: number;
  predictedCost: number;
  // Planning projects data (separate from main budget)
  planningBudget: number;
  planningCount: number;
  activeProjectsCount: number;
}

export function BudgetOverview() {
  const { t } = useI18n();
  
  const { data, isLoading, error } = useQuery<BudgetData>({
    queryKey: ["/api/budget-summary"],
  });

  // Format currency (QAR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-QA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + " QAR";
  };
  
  // Calculate percentage
  const getPercentage = (amount: number, total: number) => {
    return total > 0 ? ((amount / total) * 100).toFixed(1) + "%" : "0%";
  };
  
  // Check if we have potential overspend
  const getOverspend = (predicted: number, total: number) => {
    return predicted > total ? formatCurrency(predicted - total) : null;
  };
  
  if (isLoading) {
    return (
      <div className="mb-8 space-y-4">
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle>{t("budgetOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardHeader className="border-b border-red-200 dark:border-red-800">
          <CardTitle className="text-red-700 dark:text-red-300">{t("budgetOverview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-300">{t("somethingWentWrong")}</p>
          <p className="text-red-500 dark:text-red-400">{error?.message || t("tryAgain")}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Potential overspend
  const overspend = getOverspend(data.predictedCost, data.totalBudget);
  
  return (
    <div className="mb-8 space-y-4">
      {/* Main Active Projects Budget */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-maroon-200 dark:border-maroon-800 hover:border-maroon-300 dark:hover:border-maroon-700 transition-colors overflow-hidden">
        <div className="p-6 border-b border-maroon-200 dark:border-maroon-800 bg-gradient-to-r from-maroon-100 to-white dark:from-maroon-900/30 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-maroon-800 dark:text-maroon-200">{t("activeBudgetOverview")}</h2>
            <div className="flex items-center text-sm text-maroon-600 dark:text-maroon-400">
              <Briefcase className="h-4 w-4 mr-1" />
              <span>{data.activeProjectsCount} {t("activeProjects")}</span>
            </div>
          </div>
          <p className="text-sm text-maroon-600 dark:text-maroon-400 mt-1">{t("excludingPlanningProjects")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-maroon-100 dark:divide-maroon-800">
          <div className="p-6 flex flex-col items-center text-center hover:bg-maroon-50 dark:hover:bg-maroon-900/10 transition-colors">
            <p className="text-sm font-medium text-maroon-600 dark:text-maroon-400 mb-2 uppercase tracking-wider">{t("totalBudget")}</p>
            <p className="text-3xl font-extrabold text-maroon-800 dark:text-maroon-200">{formatCurrency(data.totalBudget)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("activeProjectsOnly")}</p>
          </div>
          <div className="p-6 flex flex-col items-center text-center hover:bg-maroon-50 dark:hover:bg-maroon-900/10 transition-colors">
            <p className="text-sm font-medium text-maroon-600 dark:text-maroon-400 mb-2 uppercase tracking-wider">{t("actualSpend")}</p>
            <p className="text-3xl font-extrabold text-maroon-800 dark:text-maroon-200">{formatCurrency(data.actualCost)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center">
              <span className="inline-block px-2 py-1 bg-maroon-100 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200 rounded-full mr-1 font-medium">
                {getPercentage(data.actualCost, data.totalBudget)}
              </span> 
              {t("ofTotalBudget")}
            </p>
          </div>
          <div className="p-6 flex flex-col items-center text-center hover:bg-maroon-50 dark:hover:bg-maroon-900/10 transition-colors">
            <p className="text-sm font-medium text-maroon-600 dark:text-maroon-400 mb-2 uppercase tracking-wider">{t("remaining")}</p>
            <p className="text-3xl font-extrabold text-maroon-800 dark:text-maroon-200">{formatCurrency(data.remainingBudget)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center">
              <span className="inline-block px-2 py-1 bg-maroon-100 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200 rounded-full mr-1 font-medium">
                {getPercentage(data.remainingBudget, data.totalBudget)}
              </span>
              {t("ofTotalBudget")}
            </p>
          </div>
          <div className="p-6 flex flex-col items-center text-center hover:bg-maroon-50 dark:hover:bg-maroon-900/10 transition-colors">
            <p className="text-sm font-medium text-maroon-600 dark:text-maroon-400 mb-2 uppercase tracking-wider">{t("predictedCost")}</p>
            <p className="text-3xl font-extrabold text-maroon-800 dark:text-maroon-200">{formatCurrency(data.predictedCost)}</p>
            {overspend && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                {t("potentialOverspend")} 
                <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full ml-1">
                  {overspend}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Planning Projects Budget (Separate) */}
      {data.planningCount > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {t("planningProjects")}
              </CardTitle>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {data.planningCount} {data.planningCount === 1 ? t("project") : t("projects")}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{t("totalPlanningBudget")}</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(data.planningBudget)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-500 dark:text-blue-400">{t("notIncludedInMainBudget")}</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{t("willBeIncludedWhenActive")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
