import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, PlusCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertProjectSchema, type Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { MultiSelect } from "@/components/ui";
import { Badge } from "@/components/ui/badge";

export default function NewProjectPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  
  // Fetch departments for reference
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["/api/departments"],
    staleTime: 60000, // 1 minute
  });

  // Fetch users for the manager select dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
    staleTime: 60000, // 1 minute
  });

  // Create a form schema based on the insertProjectSchema
  const formSchema = z.object({
    title: z.string().min(1, t("titleRequired")),
    description: z.string().min(1, t("descriptionRequired")),
    departmentId: z.string().min(1, t("departmentRequired")),
    managerUserId: z.string().min(1, t("projectManagerRequired")),
    client: z.string().min(1, t("clientRequired")),
    budget: z.number({
      required_error: t("budgetRequired"),
      invalid_type_error: t("budgetMustBeNumber"),
    }),
    priority: z.string().min(1, t("priorityRequired")),
    startDate: z.date({
      required_error: t("startDateRequired"),
    }),
    deadline: z.date({
      required_error: t("deadlineRequired"),
    }),
    status: z.string().min(1, t("statusRequired")),
    actualCost: z.number({
      required_error: t("actualCostRequired"),
      invalid_type_error: t("costMustBeNumber"),
    }),
    teamMembers: z.array(z.string()).optional(),
  }).refine((data) => data.deadline >= data.startDate, {
    message: t("deadlineMustBeAfterStartDate"),
    path: ["deadline"],
  });

  type FormValues = z.infer<typeof formSchema>;

  // Default values for the form
  const defaultValues: Partial<FormValues> = {
    title: "",
    description: "",
    departmentId: user?.departmentId?.toString() || "",
    managerUserId: user?.role === "ProjectManager" ? user.id.toString() : "",
    client: "",
    budget: 0,
    priority: "Medium",
    status: "Planning",
    actualCost: 0,
    teamMembers: [],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Handle user/department changes
  const handleManagerChange = (managerId: string) => {
    if (!managerId || !users) return;
    
    const manager = users.find(u => u.id.toString() === managerId);
    if (manager && manager.departmentId) {
      form.setValue("departmentId", manager.departmentId.toString());
      
      // Update team members select options
      const deptUsers = users.filter(u => u.departmentId === manager.departmentId);
      setDepartmentUsers(deptUsers);
    }
  };

  // Watch for manager changes to update department
  const managerId = form.watch("managerUserId");
  useEffect(() => {
    if (managerId) {
      handleManagerChange(managerId);
    }
  }, [managerId]);

  // Handle team member selection
  const handleTeamMemberChange = (selectedValues: string[]) => {
    setSelectedTeamMembers(selectedValues);
    form.setValue("teamMembers", selectedValues);
  };

  const createProjectMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      // Find the manager to get their department if not already set
      let departmentId = formData.departmentId;
      if (!departmentId && formData.managerUserId && users) {
        const manager = users.find((user) => user.id.toString() === formData.managerUserId);
        if (manager && manager.departmentId) {
          departmentId = manager.departmentId.toString();
        }
      }

      if (!departmentId) {
        throw new Error(t("noDepartmentFound"));
      }
      
      // Convert form data to match API expectations - ensure proper typing
      const projectData = {
        title: formData.title,
        description: formData.description,
        departmentId: parseInt(departmentId),
        managerUserId: parseInt(formData.managerUserId),
        client: formData.client,
        budget: formData.budget,
        priority: formData.priority,
        startDate: formData.startDate instanceof Date ? formData.startDate.toISOString() : formData.startDate,
        deadline: formData.deadline instanceof Date ? formData.deadline.toISOString() : formData.deadline,
        status: formData.status,
        actualCost: formData.actualCost,
        teamMembers: formData.teamMembers?.map(id => parseInt(id)) || []
      };
      
      try {
        console.log("Sending project data:", JSON.stringify(projectData, null, 2));
        const response = await apiRequest("POST", "/api/projects", projectData);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Project creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: t("projectCreated"),
        description: t("projectCreatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate("/projects");
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createProjectMutation.mutate(values);
  };

  const isLoading = isLoadingDepartments || isLoadingUsers || createProjectMutation.isPending;

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newProject")}</CardTitle>
          <CardDescription>{t("createProjectDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projectName")}</FormLabel>
                      <FormControl>
                        <Input id="project-title" placeholder={t("enterProjectName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          name="status"
                        >
                          <SelectTrigger id="project-status">
                            <SelectValue placeholder={t("selectStatus")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planning">{t("planning")}</SelectItem>
                            <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                            <SelectItem value="OnHold">{t("onHold")}</SelectItem>
                            <SelectItem value="Completed">{t("completed")}</SelectItem>
                            <SelectItem value="Cancelled">{t("cancelled")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("priority")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          name="priority"
                        >
                          <SelectTrigger id="project-priority">
                            <SelectValue placeholder={t("selectPriority")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">{t("low")}</SelectItem>
                            <SelectItem value="Medium">{t("medium")}</SelectItem>
                            <SelectItem value="High">{t("high")}</SelectItem>
                            <SelectItem value="Critical">{t("critical")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("client")}</FormLabel>
                      <FormControl>
                        <Input id="project-client" placeholder={t("enterClientName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managerUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projectManager")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoadingUsers}
                          name="managerUserId"
                        >
                          <SelectTrigger id="project-manager">
                            <SelectValue placeholder={t("selectProjectManager")} />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter((user: any) => 
                                user.role === "ProjectManager" || 
                                user.role === "SubPMO" || 
                                user.role === "MainPMO")
                              .map((user: any) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("budget")}</FormLabel>
                      <FormControl>
                        <Input
                          id="project-budget"
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("startDate")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              id="project-start-date"
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("selectDate")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("deadline")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              id="project-deadline"
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("selectDate")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Team Members Multi-Select */}
                {form.watch("departmentId") && (
                  <FormField
                    control={form.control}
                    name="teamMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel id="project-team-members-label">{t("teamMembers")}</FormLabel>
                        <FormControl>
                          <div>
                            <MultiSelect
                              options={departmentUsers.map(user => ({
                                label: user.name,
                                value: user.id.toString()
                              }))}
                              selected={selectedTeamMembers}
                              onChange={handleTeamMemberChange}
                              placeholder={t("selectTeamMembers")}
                              id="project-team-members"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        id="project-description"
                        placeholder={t("enterProjectDescription")}
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/projects")}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("createProject")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}