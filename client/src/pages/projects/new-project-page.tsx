import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Control, SubmitHandler, FieldPath, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FormRoot,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form-wrapper";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { Department, Goal, Project, User } from "@/lib/schema-types";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import React from "react";

// Define interfaces
interface ProjectGoal {
  goalId: number;
  weight: number;
}

interface RelatedProject {
  projectId: number;
}

interface RelatedToProject {
  dependsOnProjectId: number;
}

interface FormField {
  id: string;
}

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, {
    message: "Project name is required",
  }),
  status: z.string().default("Draft"),
  priority: z.string().default("Medium"),
  departmentId: z.string(),
  managerUserId: z.string(),
  budget: z.coerce.number().optional(),
  actualCost: z.coerce.number().optional(),
  startDate: z.date(),
  endDate: z.date(),
  description: z.string().optional(),
  projectGoals: z.array(
    z.object({
      goalId: z.number(),
      weight: z.number().min(1).max(10),
    })
  ).default([{ goalId: 0, weight: 1 }]),
  relatedProjects: z.array(
    z.object({
      projectId: z.number(),
    })
  ).default([]),
  relatedToProjects: z.array(
    z.object({
      dependsOnProjectId: z.number(),
    })
  ).default([]),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Use z.infer to extract the type from the schema
type FormValues = z.infer<typeof formSchema>;

// A type for rendering form field components
type FormControl = Control<FormValues, any>;
type FieldProps = {
  value: any;
  onChange: (...event: any[]) => void;
  onBlur: () => void;
  name: string;
  ref: React.RefObject<any>;
};

export default function NewProjectPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load departments, users, projects, and goals for selection dropdowns
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
  
  // Form state
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      status: "Draft",
      priority: "Medium",
      departmentId: "",
      managerUserId: "",
      budget: undefined,
      actualCost: undefined,
      startDate: new Date(),
      endDate: new Date(),
      description: "",
      projectGoals: [{ goalId: 0, weight: 1 }],
      relatedProjects: [],
      relatedToProjects: [],
    },
  });

  // Field arrays for dynamic form elements
  const { fields: projectGoalFields, append: appendProjectGoal, remove: removeProjectGoal } = 
    useFieldArray({
      control: form.control as FormControl,
      name: "projectGoals",
    });
  
  const { fields: relatedProjectFields, append: appendRelatedProject, remove: removeRelatedProject } = 
    useFieldArray({
      control: form.control as FormControl,
      name: "relatedProjects",
    });
  
  const { fields: relatedToProjectFields, append: appendRelatedToProject, remove: removeRelatedToProject } = 
    useFieldArray({
      control: form.control as FormControl,
      name: "relatedToProjects",
    });
  
  // Mutation for creating a new project
  const createProjectMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          departmentId: parseInt(values.departmentId),
          managerUserId: parseInt(values.managerUserId),
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: t("success"),
        description: t("projectCreatedSuccess"),
      });
      navigate("/projects");
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    createProjectMutation.mutate(values);
  };
  
  // Filter projects for selection dropdown (exclude already selected)
  const getAvailableRelatedProjects = () => {
    const selectedIds = form.watch("relatedProjects").map(item => item.projectId);
    return projects.filter((project: Project) => !selectedIds.includes(project.id));
  };
  
  const getAvailableRelatedToProjects = () => {
    const selectedIds = form.watch("relatedToProjects").map(item => item.dependsOnProjectId);
    return projects.filter((project: Project) => !selectedIds.includes(project.id));
  };

  const isLoading = isLoadingDepartments || isLoadingUsers || isLoadingProjects || isLoadingGoals || createProjectMutation.isPending;

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newProject")}</CardTitle>
          <CardDescription>{t("createProjectDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormRoot form={form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control as FormControl}
                  name="title"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>{t("projectName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enterProjectName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control as FormControl}
                  name="status"
                  render={({ field }: { field: FieldProps }) => (
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
                            <SelectItem value="Draft">{t("draft")}</SelectItem>
                            <SelectItem value="Pending">{t("pending")}</SelectItem>
                            <SelectItem value="Approved">{t("approved")}</SelectItem>
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
                  control={form.control as FormControl}
                  name="priority"
                  render={({ field }: { field: FieldProps }) => (
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
                  control={form.control as FormControl}
                  name="departmentId"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>{t("department")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoadingDepartments}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectDepartment")} />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((department: Department) => (
                              <SelectItem
                                key={department.id}
                                value={department.id.toString()}
                              >
                                {department.name}
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
                  control={form.control as FormControl}
                  name="managerUserId"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>{t("projectManager")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoadingUsers}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectProjectManager")} />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter((user) => 
                                (user.roles && user.roles.includes("ProjectManager")) || 
                                (user.roles && user.roles.includes("SubPMO")) || 
                                (user.roles && user.roles.includes("MainPMO")))
                              .map((user) => (
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
                  control={form.control as FormControl}
                  name="budget"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>{t("budget")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control as FormControl}
                  name="actualCost"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>{t("actualCost")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control as FormControl}
                  name="startDate"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("startDate")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
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
                  control={form.control as FormControl}
                  name="endDate"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("endDate")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
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
              </div>

              <FormField
                control={form.control as FormControl}
                name="description"
                render={({ field }: { field: FieldProps }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("enterProjectDescription")}
                        className="min-h-32"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Goals Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{t("projectGoals")}</h3>
                  <p className="text-sm text-gray-500">{t("linkProjectToGoals")}</p>
                </div>
                
                {isLoadingGoals ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="mr-2 h-4 w-4" />
                    <span>{t("loadingGoals")}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectGoalFields.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        {t("noGoalsSelected")}
                      </div>
                    ) : (
                      projectGoalFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4">
                          <FormField
                            control={form.control as FormControl}
                            name={`projectGoals.${index}.goalId` as FieldPath<FormValues>}
                            render={({ field }: { field: FieldProps }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="sr-only">{t("goal")}</FormLabel>
                                <Select
                                  value={field.value?.toString()}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectGoal")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {goals.map((goal: Goal) => (
                                      <SelectItem
                                        key={goal.id}
                                        value={goal.id.toString()}
                                      >
                                        {goal.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control as FormControl}
                            name={`projectGoals.${index}.weight` as FieldPath<FormValues>}
                            render={({ field }: { field: FieldProps }) => (
                              <FormItem className="w-24">
                                <FormLabel className="sr-only">{t("weight")}</FormLabel>
                                <Input
                                  type="number"
                                  placeholder={t("weight")}
                                  min="1"
                                  max="100"
                                  value={field.value || ""}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeProjectGoal(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendProjectGoal({ goalId: 0, weight: 50 })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addGoal")}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Related Projects Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{t("relatedProjects")}</h3>
                  <p className="text-sm text-gray-500">{t("linkToExistingProjects")}</p>
                </div>
                
                {relatedProjectFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4">
                    <FormField
                      control={form.control as FormControl}
                      name={`relatedProjects.${index}.projectId` as FieldPath<FormValues>}
                      render={({ field }: { field: FieldProps }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{index === 0 && t("thisProjectDependsOn")}</FormLabel>
                          <Select
                            value={(field.value ?? 0).toString()}
                            onValueChange={(value: string) => field.onChange(Number(value))}
                            disabled={isLoadingProjects}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectProject")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableRelatedProjects().map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="self-end"
                      onClick={() => removeRelatedProject(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendRelatedProject({ projectId: 0 })}
                  disabled={
                    getAvailableRelatedProjects().length === 0 || 
                    relatedProjectFields.length >= projects.length
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addRelatedProject")}
                </Button>
              </div>
              
              {/* Reverse Related Projects Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{t("projectsRelatedToThis")}</h3>
                  <p className="text-sm text-gray-500">{t("projectsThatDependOnThis")}</p>
                </div>
                
                {relatedToProjectFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4">
                    <FormField
                      control={form.control as FormControl}
                      name={`relatedToProjects.${index}.dependsOnProjectId` as FieldPath<FormValues>}
                      render={({ field }: { field: FieldProps }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{index === 0 && t("projectThatDependsOnThis")}</FormLabel>
                          <Select
                            value={(field.value ?? 0).toString()}
                            onValueChange={(value: string) => field.onChange(Number(value))}
                            disabled={isLoadingProjects}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectProject")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableRelatedToProjects().map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="self-end"
                      onClick={() => removeRelatedToProject(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendRelatedToProject({ dependsOnProjectId: 0 })}
                  disabled={
                    getAvailableRelatedToProjects().length === 0 || 
                    relatedToProjectFields.length >= projects.length
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addRelatedToProject")}
                </Button>
              </div>

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
                  disabled={isLoading}
                  className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4" />}
                  {t("createProject")}
                </Button>
              </div>
            </form>
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  );
}