import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  FormRoot,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-wrapper";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, User } from "@/lib/schema-types";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Create form schema based on task requirements
const formSchema = z.object({
  projectId: z.string({
    required_error: "Project is required",
  }),
  title: z.string().min(1, {
    message: "Task title is required",
  }),
  description: z.string().optional(),
  assignedUserId: z.string().optional(),
  deadline: z.date({
    required_error: "Deadline is required",
  }),
  priority: z.enum(["Low", "Medium", "High", "Critical"], {
    required_error: "Priority is required",
  }),
  status: z.enum(["Todo", "InProgress", "Review", "Completed"], {
    required_error: "Status is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTaskPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Fetch projects for dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch users for assignee dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get team members for the selected project
  const { data: projectTeamMembers = [], isLoading: isLoadingTeam } = useQuery<User[]>({
    queryKey: ["/api/projects", selectedProject, "team"],
    enabled: !!selectedProject,
  });

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      assignedUserId: "",
      status: "Todo",
      priority: "Medium",
    },
  });

  // Watch for project changes to update team members
  const watchProjectId = form.watch("projectId");
  if (watchProjectId !== selectedProject) {
    setSelectedProject(watchProjectId);
  }

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert form data to match API expectations
      const taskData = {
        ...data,
        projectId: Number(data.projectId),
        assignedUserId: data.assignedUserId ? Number(data.assignedUserId) : null,
        createdByUserId: user?.id,
        deadline: data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline,
      };

      console.log("Submitting task data:", taskData);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Task creation failed:", response.status, errorData);
        throw new Error(errorData.message || `Failed to create task (${response.status})`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("taskCreated"),
        description: t("taskCreatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      navigate("/tasks");
    },
    onError: (error: Error) => {
      console.error("Task creation error:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createTaskMutation.mutate(values);
  };

  const isLoading = isLoadingProjects || isLoadingUsers || isLoadingTeam || createTaskMutation.isPending;

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newTask")}</CardTitle>
          <CardDescription>{t("createTaskDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormRoot form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t("project")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoadingProjects}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectProject")} />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={project.id.toString()}
                            >
                              {project.title}
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
                name="title"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t("taskTitle")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enterTaskTitle")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedUserId"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t("assignTo")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedProject || isLoadingTeam}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectAssignee")} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProject ? (
                            projectTeamMembers.length > 0 ? (
                              projectTeamMembers.map((member) => (
                                <SelectItem
                                  key={member.id}
                                  value={member.id.toString()}
                                >
                                  {member.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-team-members" disabled>
                                {t("noTeamMembers")}
                              </SelectItem>
                            )
                          ) : (
                            <SelectItem value="select-project-first" disabled>
                              {t("selectProjectFirst")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todo">{t("todo")}</SelectItem>
                          <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                          <SelectItem value="Review">{t("review")}</SelectItem>
                          <SelectItem value="Completed">{t("completed")}</SelectItem>
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
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
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
                name="deadline"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("deadline")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("enterTaskDescription")}
                      className="resize-y min-h-32"
                      {...field}
                      value={field.value || ""}
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
                onClick={() => navigate("/tasks")}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("createTask")}
              </Button>
            </div>
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  );
} 