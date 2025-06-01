import React from "react";
import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { RiskIssue } from "@/lib/schema-types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Clock,
  User
} from "lucide-react";
import { PermissionGate } from "@/hooks/use-permissions";

interface RisksIssuesData {
  risks: RiskIssue[];
  issues: RiskIssue[];
}

export default function RisksIssuesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data, isLoading, error } = useQuery<RisksIssuesData>({
    queryKey: ["/api/risks-issues"],
  });
  
  // Can user create risks/issues?
  const canCreate = user && user.role && ["Administrator", "MainPMO", "SubPMO", "DepartmentDirector", "ProjectManager"].includes(user.role);
  
  // Apply filters
  const filterItems = (items: RiskIssue[] = []) => {
    return items.filter((item) => {
      // Filter by status
      if (filterStatus && filterStatus !== "all-statuses" && item.status !== filterStatus) {
        return false;
      }
      
      // Filter by priority
      if (filterPriority && filterPriority !== "all-priorities" && item.priority !== filterPriority) {
        return false;
      }
      
      // Search by description
      if (searchQuery && !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  const filteredRisks = data?.risks ? filterItems(data.risks) : [];
  const filteredIssues = data?.issues ? filterItems(data.issues) : [];
  
  // Format priority badge
  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return (
      <div className="flex items-center text-green-600 dark:text-green-400">
        <Clock className="w-4 h-4 mr-1" />
        <span className="text-xs">{t("low")}</span>
      </div>
    );
    switch (priority) {
      case 'Critical':
        return (
          <div className="flex items-center text-red-700 dark:text-red-400">
            <AlertOctagon className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("critical")}</span>
          </div>
        );
      case 'High':
        return (
          <div className="flex items-center text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("high")}</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("medium")}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("low")}</span>
          </div>
        );
    }
  };
  
  // Format status badge
  const getStatusBadge = (status: string | null) => {
    if (!status) return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
        {t("unknown")}
      </span>
    );
    switch (status) {
      case 'Open':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full">
            {t("open")}
          </span>
        );
      case 'InProgress':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
            {t("inProgress")}
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
            {t("resolved")}
          </span>
        );
      case 'Closed':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
            {t("closed")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
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
      day: 'numeric' 
    }).format(new Date(dateString));
  };
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-contrast dark:text-white">{t("risksAndIssues")}</h1>
        <PermissionGate permission="canCreateRiskIssue">
          {canCreate && (
            <Link href="/risks-issues/new">
              <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                <Plus className="mr-2 h-4 w-4" />
                <span>{t("newRiskIssue")}</span>
              </Button>
            </Link>
          )}
        </PermissionGate>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="grid gap-1.5 flex-1">
            <label htmlFor="search" className="text-sm font-medium leading-none">{t("search")}</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="search"
                type="search"
                placeholder={t("searchRisksIssues")}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-1.5 w-full md:w-40">
            <label htmlFor="status" className="text-sm font-medium leading-none">{t("status")}</label>
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">{t("allStatuses")}</SelectItem>
                <SelectItem value="Open">{t("open")}</SelectItem>
                <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                <SelectItem value="Resolved">{t("resolved")}</SelectItem>
                <SelectItem value="Closed">{t("closed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-1.5 w-full md:w-40">
            <label htmlFor="priority" className="text-sm font-medium leading-none">{t("priority")}</label>
            <Select 
              value={filterPriority} 
              onValueChange={setFilterPriority}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder={t("allPriorities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">{t("allPriorities")}</SelectItem>
                <SelectItem value="Critical">{t("critical")}</SelectItem>
                <SelectItem value="High">{t("high")}</SelectItem>
                <SelectItem value="Medium">{t("medium")}</SelectItem>
                <SelectItem value="Low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Risks & Issues Content */}
      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="risks" className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t("risks")}
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center">
            <AlertOctagon className="mr-2 h-4 w-4" />
            {t("issues")}
          </TabsTrigger>
        </TabsList>
        
        {/* Risks Tab */}
        <TabsContent value="risks">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRisks.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noRisks")}</p>
                  </CardContent>
                </Card>
              ) : (
                filteredRisks.map((risk) => (
                  <Card 
                    key={risk.id} 
                    className={`hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer ${
                      risk.priority === 'Critical' ? 'border-red-300 dark:border-red-700' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            Project ID: {risk.projectId}
                          </span>
                        </CardTitle>
                        {getPriorityBadge(risk.priority)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {risk.description}
                      </p>
                      <div className="flex justify-between items-center">
                        {getStatusBadge(risk.status)}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(risk.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <User className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {t("reportedBy")}: {risk.createdByUserId}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Issues Tab */}
        <TabsContent value="issues">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIssues.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noIssues")}</p>
                  </CardContent>
                </Card>
              ) : (
                filteredIssues.map((issue) => (
                  <Card 
                    key={issue.id} 
                    className={`hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer ${
                      issue.priority === 'Critical' ? 'border-red-300 dark:border-red-700' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            Project ID: {issue.projectId}
                          </span>
                        </CardTitle>
                        {getPriorityBadge(issue.priority)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {issue.description}
                      </p>
                      <div className="flex justify-between items-center">
                        {getStatusBadge(issue.status)}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(issue.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <User className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {t("reportedBy")}: {issue.createdByUserId}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
