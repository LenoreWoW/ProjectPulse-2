import { useI18n } from "@/hooks/use-i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChangeRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PendingApprovalsProps {
  className?: string;
}

export function PendingApprovals({ className = "" }: PendingApprovalsProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Only show if user has appropriate role
  const canViewApprovals = user && ["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"].includes(user.role || "");
  
  const { 
    data: pendingRequests, 
    isLoading, 
    error 
  } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/change-requests/pending"],
    enabled: Boolean(canViewApprovals),
  });
  
  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'Approved' | 'Rejected' }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests/pending"] });
      toast({
        title: t("actionCompleted"),
        description: t("changeRequestUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("actionFailed"),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Format change request type
  const formatType = (type: string) => {
    switch (type) {
      case 'Schedule':
        return t('timelineExtension');
      case 'Budget':
        return t('budgetIncreaseRequest');
      case 'Closure':
        return t('projectClosure');
      default:
        return type;
    }
  };
  
  // Get background color based on request type
  const getTypeClasses = (type: string) => {
    switch (type) {
      case 'Budget':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Schedule':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Closure':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Status':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };
  
  if (!canViewApprovals) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-darker shadow rounded-lg border ${className || 'border-gray-200 dark:border-gray-700'}`}>
        <div className="p-6 border-b border-maroon-200 dark:border-maroon-800 bg-gradient-to-r from-maroon-50 to-white dark:from-maroon-900/20 dark:to-darker flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-maroon-100 dark:border-maroon-800 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
              <div className="flex mt-4 space-x-2">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !pendingRequests) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 shadow rounded-lg border border-red-200 dark:border-red-800">
        <div className="p-6 border-b border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">{t("pendingApprovals")}</h2>
        </div>
        <div className="p-6">
          <p className="text-red-600 dark:text-red-300">{t("somethingWentWrong")}</p>
          <p className="text-red-500 dark:text-red-400">{error?.message || t("tryAgain")}</p>
        </div>
      </div>
    );
  }
  
  // Take most recent 3 for dashboard
  const recentApprovals = pendingRequests.slice(0, 3);
  
  return (
    <div className={`bg-white dark:bg-darker shadow rounded-lg border ${className || 'border-gray-200 dark:border-gray-700'}`}>
      <div className="p-6 border-b border-maroon-200 dark:border-maroon-800 bg-gradient-to-r from-maroon-50 to-white dark:from-maroon-900/20 dark:to-darker flex justify-between items-center">
        <h2 className="text-lg font-semibold text-maroon-700 dark:text-maroon-300">{t("pendingApprovals")}</h2>
        {pendingRequests.length > 0 && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-maroon-100 text-maroon-800 dark:bg-maroon-900/30 dark:text-maroon-300">
            {pendingRequests.length} {t("new")}
          </span>
        )}
      </div>
      <div className="p-6 space-y-4">
        {recentApprovals.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {t("noApprovals")}
          </p>
        ) : (
          recentApprovals.map((request) => (
            <div key={request.id} className="border border-maroon-100 dark:border-maroon-800 hover:border-maroon-200 dark:hover:border-maroon-700 transition-colors rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{formatType(request.type || '')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Project ID: {request.projectId}
                  </p>
                </div>
                <span className={`${getTypeClasses(request.type || '')} text-xs px-2 py-1 rounded-full`}>
                  {request.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{request.details}</p>
              <div className="flex mt-4 space-x-2">
                <Button
                  size="sm"
                  className="bg-maroon-700 hover:bg-maroon-800"
                  onClick={() => approveMutation.mutate({ id: request.id, status: 'Approved' })}
                  disabled={approveMutation.isPending}
                >
                  {t("approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-maroon-200 text-maroon-700 hover:border-maroon-300 hover:bg-maroon-50 dark:border-maroon-800 dark:text-maroon-300 dark:hover:border-maroon-700 dark:hover:bg-maroon-900/10"
                  onClick={() => approveMutation.mutate({ id: request.id, status: 'Rejected' })}
                  disabled={approveMutation.isPending}
                >
                  {t("reject")}
                </Button>
              </div>
            </div>
          ))
        )}
        
        {pendingRequests.length > 3 && (
          <div className="text-center mt-4">
            <Button variant="link" className="text-maroon-700 dark:text-maroon-400 hover:underline">
              {t("viewAllApprovals")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
