import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChangeRequest } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar,
  Clock,
  User,
  Check,
  X,
  CheckCircle,
  XCircle,
  FileText,
  AlertOctagon,
  CalendarClock,
  ArrowRightLeft,
  Users
} from "lucide-react";

export default function ApprovalsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Fetch pending change requests
  const { 
    data: pendingRequests, 
    isLoading, 
    error 
  } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/change-requests/pending"],
  });
  
  // Handle approve/reject
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
      setIsApproveDialogOpen(false);
      setIsRejectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("actionFailed"),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Format change request type and get icon
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'Schedule':
        return {
          label: t('timelineExtension'),
          icon: <CalendarClock className="h-5 w-5" />,
          bgClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
        };
      case 'Budget':
        return {
          label: t('budgetIncreaseRequest'),
          icon: <FileText className="h-5 w-5" />,
          bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        };
      case 'Scope':
        return {
          label: t('scopeChange'),
          icon: <ArrowRightLeft className="h-5 w-5" />,
          bgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
        };
      case 'Status':
        return {
          label: t('statusChange'),
          icon: <AlertOctagon className="h-5 w-5" />,
          bgClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
        };
      case 'Closure':
        return {
          label: t('projectClosure'),
          icon: <CheckCircle className="h-5 w-5" />,
          bgClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        };
      case 'AdjustTeam':
        return {
          label: t('adjustTeam'),
          icon: <Users className="h-5 w-5" />,
          bgClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
        };
      default:
        return {
          label: type,
          icon: <FileText className="h-5 w-5" />,
          bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };
  
  // Check if user is allowed to see this page
  const hasAccessRights = user && ["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"].includes(user.role);
  
  if (!hasAccessRights) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="rounded-lg bg-red-100 dark:bg-red-900/20 p-5 m-5 max-w-md">
          <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">{t("accessDenied")}</h2>
          <p className="text-red-600 dark:text-red-300">
            {t("noPermissionMessage")}
          </p>
        </div>
      </div>
    );
  }
  
  // Handle request approval
  const handleApprove = (request: ChangeRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  };
  
  // Handle request rejection
  const handleReject = (request: ChangeRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("approvals")}</h1>
      </div>
      
      {/* Approvals Content */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            {t("pendingApprovals")}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            {t("processedRequests")}
          </TabsTrigger>
        </TabsList>
        
        {/* Pending Tab */}
        <TabsContent value="pending">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/3 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <div className="space-x-2">
                      <Skeleton className="h-10 w-24 inline-block" />
                      <Skeleton className="h-10 w-24 inline-block" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-300">{t("error")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-300">{t("somethingWentWrong")}</p>
                <p className="text-red-500 dark:text-red-400">{(error as Error).message || t("tryAgain")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {!pendingRequests || pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noApprovals")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const { label, icon, bgClass } = getTypeInfo(request.type);
                    
                    return (
                      <Card key={request.id} className="hover:border-maroon-200 dark:hover:border-maroon-800 transition-all">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl flex items-center">
                              Project ID: {request.projectId}
                            </CardTitle>
                            <span className={`flex items-center px-3 py-1 rounded-full text-sm ${bgClass}`}>
                              {icon}
                              <span className="ml-1">{label}</span>
                            </span>
                          </div>
                          <CardDescription>
                            {t("requestType")}: {request.type}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                            <p className="text-gray-700 dark:text-gray-300">
                              {request.details}
                            </p>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              <span>{t("requestedBy")}: {request.requestedByUserId}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(request.requestedAt)}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-3">
                          <span className="text-xs text-maroon-700 dark:text-maroon-400">
                            {t("awaitingYourDecision")}
                          </span>
                          <div className="space-x-2">
                            <Button 
                              className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                              onClick={() => handleApprove(request)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {t("approve")}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
                              onClick={() => handleReject(request)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              {t("reject")}
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        {/* Processed Tab */}
        <TabsContent value="processed">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t("processedRequestsHistory")}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t("comingSoon")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmApproval")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("approveRequestConfirmation")} <br />
              {selectedRequest && (
                <span className="font-medium text-maroon-700 dark:text-maroon-400">
                  {getTypeInfo(selectedRequest.type).label}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-qatar-maroon hover:bg-maroon-800 text-white"
              onClick={() => selectedRequest && approveMutation.mutate({ id: selectedRequest.id, status: 'Approved' })}
            >
              {approveMutation.isPending ? (
                <Clock className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {t("approve")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 dark:text-red-400">{t("confirmRejection")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("rejectRequestConfirmation")} <br />
              {selectedRequest && (
                <span className="font-medium text-maroon-700 dark:text-maroon-400">
                  {getTypeInfo(selectedRequest.type).label}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => selectedRequest && approveMutation.mutate({ id: selectedRequest.id, status: 'Rejected' })}
            >
              {approveMutation.isPending ? (
                <Clock className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {t("reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
