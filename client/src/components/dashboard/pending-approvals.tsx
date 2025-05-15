import { useI18n } from "@/hooks/use-i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChangeRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Clock, 
  BarChart3, 
  CalendarClock, 
  CheckSquare, 
  AlertTriangle, 
  Briefcase,
  ArrowRight
} from "lucide-react";

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
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg border ${className || 'border-gray-200 dark:border-gray-700'}`}>
        <div className="p-6 border-b border-maroon-200 dark:border-maroon-800 bg-gradient-to-r from-maroon-50 to-white dark:from-maroon-900/20 dark:to-gray-800 flex justify-between items-center">
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
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg border ${className || 'border-maroon-200 dark:border-maroon-800'}`}>
      <div className="p-6 border-b border-maroon-200 dark:border-maroon-800 bg-gradient-to-r from-maroon-100 to-white dark:from-maroon-900/30 dark:to-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-maroon-800 dark:text-maroon-200">{t("pendingApprovals")}</h2>
        {pendingRequests.length > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-maroon-100 text-maroon-800 dark:bg-maroon-900/30 dark:text-maroon-300 shadow-sm">
            {pendingRequests.length} {t("new")}
          </span>
        )}
      </div>
      <div className="p-6 space-y-4">
        {recentApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="h-16 w-16 text-maroon-300 dark:text-maroon-500 opacity-50">
              <Clock className="h-full w-full" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t("noApprovals")}
            </p>
          </div>
        ) : (
          recentApprovals.map((request) => (
            <div key={request.id} 
              className="border border-maroon-200 dark:border-maroon-800 hover:border-maroon-300 dark:hover:border-maroon-700 
                bg-white dark:bg-gray-900 hover:bg-maroon-50/50 dark:hover:bg-maroon-900/10 
                transition-all shadow-sm hover:shadow rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <div className={`${getTypeClasses(request.type || '')} p-2 rounded-lg mr-3 shadow-sm`}>
                    {request.type === 'Budget' && <BarChart3 className="h-5 w-5" />}
                    {request.type === 'Schedule' && <CalendarClock className="h-5 w-5" />}
                    {request.type === 'Closure' && <CheckSquare className="h-5 w-5" />}
                    {request.type === 'Status' && <AlertTriangle className="h-5 w-5" />}
                    {!['Budget', 'Schedule', 'Closure', 'Status'].includes(request.type || '') && <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{formatType(request.type || '')}</h3>
                    <div className="flex items-center text-sm text-maroon-600 dark:text-maroon-400 mt-1">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                      <span>Project #{request.projectId}</span>
                    </div>
                  </div>
                </div>
                <span className={`${getTypeClasses(request.type || '')} text-xs px-3 py-1 rounded-full font-bold shadow-sm`}>
                  {request.type}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
                {request.details}
              </p>
              <div className="flex mt-4 space-x-3">
                <Button
                  size="sm"
                  className="bg-maroon-700 hover:bg-maroon-800 shadow-sm"
                  onClick={() => approveMutation.mutate({ id: request.id, status: 'Approved' })}
                  disabled={approveMutation.isPending}
                >
                  {t("approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-maroon-200 text-maroon-700 hover:border-maroon-300 hover:bg-maroon-50 
                    dark:border-maroon-800 dark:text-maroon-300 dark:hover:border-maroon-700 dark:hover:bg-maroon-900/10
                    shadow-sm"
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
          <div className="text-center pt-3 border-t border-maroon-100 dark:border-maroon-800 mt-6">
            <Button 
              variant="link" 
              className="text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 hover:underline font-medium flex mx-auto items-center gap-1.5"
            >
              {t("viewAllApprovals")} 
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
