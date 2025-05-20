import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuditLog } from "@shared/schema";
import { useI18n } from "@/hooks/use-i18n-new";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOptions {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  departmentId?: number;
}

export default function AuditLogsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({});
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  // Construct the query parameters for filtering
  const queryParams = new URLSearchParams();
  queryParams.append("limit", limit.toString());
  queryParams.append("offset", offset.toString());
  
  if (filters.userId) queryParams.append("userId", filters.userId.toString());
  if (filters.entityType) queryParams.append("entityType", filters.entityType);
  if (filters.entityId) queryParams.append("entityId", filters.entityId.toString());
  if (filters.action) queryParams.append("action", filters.action);
  if (filters.startDate) queryParams.append("startDate", filters.startDate.toISOString());
  if (filters.endDate) queryParams.append("endDate", filters.endDate.toISOString());
  if (filters.departmentId) queryParams.append("departmentId", filters.departmentId.toString());

  // Fetch audit logs with filters
  const { data, isLoading, error } = useQuery<AuditLog[]>({
    queryKey: [`/api/audit-logs?${queryParams.toString()}`],
  });

  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Update filter state
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Entity type options for filtering
  const entityTypes = [
    { value: "Project", label: t("project") },
    { value: "Task", label: t("task") },
    { value: "User", label: t("user") },
    { value: "ChangeRequest", label: t("changeRequest") },
    { value: "Goal", label: t("goal") },
    { value: "RiskIssue", label: t("riskIssue") },
  ];

  // Action types options for filtering
  const actionTypes = [
    { value: "Create", label: t("created") },
    { value: "Update", label: t("updated") },
    { value: "Delete", label: t("deleted") },
    { value: "Login", label: t("loggedIn") },
    { value: "Logout", label: t("loggedOut") },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("auditLogs")}</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
          <CardDescription>{t("filterAuditLogsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("entityType")}</label>
              <Select
                value={filters.entityType || ""}
                onValueChange={(value) => handleFilterChange("entityType", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allEntityTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("allEntityTypes")}</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("action")}</label>
              <Select
                value={filters.action || ""}
                onValueChange={(value) => handleFilterChange("action", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allActions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("allActions")}</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("entityId")}</label>
              <Input
                type="number"
                value={filters.entityId || ""}
                onChange={(e) => handleFilterChange("entityId", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={t("enterEntityId")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("startDate")}</label>
              <DatePicker
                date={filters.startDate}
                onChange={(date) => handleFilterChange("startDate", date)}
                placeholder={t("selectStartDate")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("endDate")}</label>
              <DatePicker
                date={filters.endDate}
                onChange={(date) => handleFilterChange("endDate", date)}
                placeholder={t("selectEndDate")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("userId")}</label>
              <Input
                type="number"
                value={filters.userId || ""}
                onChange={(e) => handleFilterChange("userId", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={t("enterUserId")}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearFilters} className="mr-2">
              {t("clearFilters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("auditLogsResults")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-36 ml-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
              {t("errorLoadingAuditLogs")}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              {t("noAuditLogsFound")}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("id")}</TableHead>
                      <TableHead>{t("timestamp")}</TableHead>
                      <TableHead>{t("user")}</TableHead>
                      <TableHead>{t("action")}</TableHead>
                      <TableHead>{t("entityType")}</TableHead>
                      <TableHead>{t("entityId")}</TableHead>
                      <TableHead>{t("details")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>{log.userId}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            log.action === "Create" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                            log.action === "Update" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                            log.action === "Delete" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell>{log.entityId}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {log.details ? JSON.stringify(log.details) : "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("showing")} {offset + 1} - {Math.min(offset + limit, offset + data.length)} {t("ofTotal")}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={data.length < limit}
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
} 