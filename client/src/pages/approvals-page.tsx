import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ApprovalsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState<'ProjectManager' | 'SubPMO'>('ProjectManager');
  
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
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason, 
      returnTo 
    }: { 
      id: number, 
      status: 'Approved' | 'Rejected' | 'PendingMainPMO', 
      rejectionReason?: string,
      returnTo?: 'ProjectManager' | 'SubPMO'
    }) => {
      const payload: any = { status };
      
      if (status === 'Rejected') {
        payload.rejectionReason = rejectionReason;
        payload.returnTo = returnTo;
      }
      
      const res = await apiRequest("PUT", `/api/change-requests/${id}`, payload);
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
      case 'Faculty':
        return {
          label: t('facultyChange'),
          icon: <Users className="h-5 w-5" />,
          bgClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
        };
      default:
        return {
          label: type,
          icon: <FileText className="h-5 w-5" />,
          bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
    }
  };
  
  // Get status badge based on request status
  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
            {t("pending")}
          </span>
        );
      case 'PendingMainPMO':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {t("pendingMainPMO")}
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
            {t("approved")}
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full">
            {t("rejected")}
          </span>
        );
      case 'ReturnedToProjectManager':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            {t("returnedToProjectManager")}
          </span>
        );
      case 'ReturnedToSubPMO':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            {t("returnedToSubPMO")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };
  
  // Check if user is allowed to see this page
  const hasAccessRights = user && user.role && ["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"].includes(user.role);
  
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
    setRejectionReason('');
    setRejectionTarget('ProjectManager'); // Default to Project Manager
    setIsRejectDialogOpen(true);
  };
  
  // Handle reject confirmation
  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: t("rejectionReasonRequired"),
        description: t("pleaseProvideRejectionReason"),
        variant: "destructive",
      });
      return;
    }

    if (selectedRequest) {
      // For SubPMO users, always return to Project Manager
      const targetUser = user?.role === 'MainPMO' ? rejectionTarget : 'ProjectManager';
      
      approveMutation.mutate({ 
        id: selectedRequest.id, 
        status: 'Rejected',
        rejectionReason: rejectionReason,
        returnTo: targetUser
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-contrast dark:text-white">{t("approvals")}</h1>
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
                    
                    // Show rejection reason for returned requests
                    const showRejectionReason = request.status === 'ReturnedToProjectManager' || 
                                                request.status === 'ReturnedToSubPMO';
                    
                    // Check if this returned request requires action from current user
                    const requiresUserAction = 
                      (request.status === 'ReturnedToProjectManager' && 
                       request.requestedByUserId === user?.id) || 
                      (request.status === 'ReturnedToSubPMO' && 
                       user?.role === 'SubPMO');
                    
                    return (
                      <Card 
                        key={request.id} 
                        className={`hover:border-maroon-200 dark:hover:border-maroon-800 transition-all
                          ${requiresUserAction ? 'border-l-4 border-l-orange-500' : ''}`}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl flex items-center">
                              Project ID: {request.projectId}
                            </CardTitle>
                            <div className="flex gap-2 items-center">
                              {getStatusBadge(request.status)}
                              <span className={`flex items-center px-3 py-1 rounded-full text-sm ${bgClass}`}>
                                {icon}
                                <span className="ml-1">{label}</span>
                              </span>
                            </div>
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
                          
                          {/* Show rejection reason if available */}
                          {showRejectionReason && request.rejectionReason && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                              <h4 className="font-medium text-red-800 dark:text-red-300 mb-1">
                                {t("rejectionReason")}:
                              </h4>
                              <p className="text-red-700 dark:text-red-400">
                                {request.rejectionReason}
                              </p>
                            </div>
                          )}
                          
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
                          {/* Show different button sets based on request status */}
                          {(request.status === 'Pending' || request.status === 'PendingMainPMO') ? (
                            <>
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
                            </>
                          ) : requiresUserAction ? (
                            <>
                              <span className="text-xs text-orange-700 dark:text-orange-400">
                                {t("actionRequired")}
                              </span>
                              <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => window.location.href = `/projects/${request.projectId}?tab=change-requests&edit=${request.id}`}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {t("editRequest")}
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-full text-center">
                              {t("awaitingRevisions")}
                            </span>
                          )}
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
              {selectedRequest && (
                <div className="mt-2 text-sm">
                  {selectedRequest.type === 'Faculty' ? (
                    <p className="italic text-green-600 dark:text-green-400">
                      Faculty change requests only require SubPMO approval. Once approved, the changes will be implemented immediately.
                    </p>
                  ) : user?.role === 'SubPMO' ? (
                    <p className="italic text-blue-600 dark:text-blue-400">
                      Your approval will send this request to Main PMO for final approval.
                    </p>
                  ) : (
                    <p className="italic text-maroon-600 dark:text-maroon-400">
                      Your approval will implement the requested changes immediately.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-qatar-maroon hover:bg-maroon-800 text-white"
              onClick={() => {
                if (selectedRequest) {
                  // For Faculty changes, directly approve with no pending state
                  let newStatus: 'Approved' | 'Rejected' | 'PendingMainPMO' = 'Approved';
                  
                  // For non-Faculty change requests, SubPMO approval sets status to PendingMainPMO
                  if (selectedRequest.type !== 'Faculty' && 
                      user?.role === 'SubPMO') {
                    newStatus = 'PendingMainPMO';
                  }
                  
                  approveMutation.mutate({ 
                    id: selectedRequest.id, 
                    status: newStatus 
                  });
                }
              }}
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
        <AlertDialogContent className="max-w-md">
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
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-red-700 dark:text-red-400">
                {t("rejectionReason")} <span className="text-red-500">*</span>
              </Label>
              <Textarea 
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("enterRejectionReason")}
                className="resize-none h-24"
              />
              {rejectionReason.trim() === '' && (
                <p className="text-xs text-red-500">{t("rejectionReasonRequired")}</p>
              )}
            </div>
            
            {/* Only show return to options for MainPMO */}
            {user?.role === 'MainPMO' && (
              <div className="space-y-2">
                <Label htmlFor="returnTo" className="text-gray-700 dark:text-gray-300">
                  {t("returnRequestTo")}
                </Label>
                <RadioGroup 
                  value={rejectionTarget} 
                  onValueChange={(value) => setRejectionTarget(value as 'ProjectManager' | 'SubPMO')}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ProjectManager" id="projectManager" />
                    <Label htmlFor="projectManager" className="font-normal">
                      {t("projectManager")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SubPMO" id="subPmo" />
                    <Label htmlFor="subPmo" className="font-normal">
                      {t("subPMO")}
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {rejectionTarget === 'ProjectManager' 
                    ? t("returnToProjectManagerHint") 
                    : t("returnToSubPMOHint")}
                </p>
              </div>
            )}
            
            {user?.role === 'SubPMO' && (
              <div className="mt-2 text-xs italic text-blue-600 dark:text-blue-400">
                {t("subPMORejectHint")}
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectConfirm}
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
    </div>
  );
}
