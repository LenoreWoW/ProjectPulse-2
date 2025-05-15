import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface BudgetData {
  totalBudget: number;
  actualCost: number;
  remainingBudget: number;
  predictedCost: number;
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
      <Card className="mb-6">
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
    <div className="mb-6 bg-white dark:bg-darker shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("budgetOverview")}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
        <div className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("totalBudget")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totalBudget)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("acrossAllActiveProjects")}</p>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("actualSpend")}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.actualCost)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getPercentage(data.actualCost, data.totalBudget)} {t("ofTotalBudget")}
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("remaining")}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.remainingBudget)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getPercentage(data.remainingBudget, data.totalBudget)} {t("ofTotalBudget")}
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("predictedCost")}</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(data.predictedCost)}</p>
          {overspend && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {t("potentialOverspend")} {overspend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
