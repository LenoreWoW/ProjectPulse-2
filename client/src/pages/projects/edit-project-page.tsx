import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
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

export default function EditProjectPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/projects/:id/edit");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load project data
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
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

  // Update form when project data loads
  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title || "",
        status: project.status || "Draft",
        priority: project.priority || "Medium",
        departmentId: project.departmentId?.toString() || "",
        managerUserId: project.managerUserId?.toString() || "",
        budget: project.budget || undefined,
        actualCost: project.actualCost || undefined,
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.deadline ? new Date(project.deadline) : new Date(),
        description: project.description || "",
        projectGoals: [{ goalId: 0, weight: 1 }], // TODO: Load actual project goals
        relatedProjects: [], // TODO: Load actual related projects
        relatedToProjects: [], // TODO: Load actual related to projects
      });
    }
  }, [project, form]);

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
  
  // Mutation for updating the project
  const updateProjectMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          departmentId: parseInt(values.departmentId),
          managerUserId: parseInt(values.managerUserId),
          startDate: values.startDate.toISOString(),
          deadline: values.endDate.toISOString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update project");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("projectUpdatedSuccessfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      navigate(`/projects/${projectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const isLoading = updateProjectMutation.isPending;
  
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    updateProjectMutation.mutate(values);
  };
  
  const getAvailableRelatedProjects = () => {
    const selectedIds = form.watch("relatedProjects")?.map(rp => rp.projectId) || [];
    return projects.filter(p => p.id !== projectId && !selectedIds.includes(p.id));
  };
  
  const getAvailableRelatedToProjects = () => {
    const selectedIds = form.watch("relatedToProjects")?.map(rtp => rtp.dependsOnProjectId) || [];
    return projects.filter(p => p.id !== projectId && !selectedIds.includes(p.id));
  };

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("projectNotFound")}</h2>
          <p className="text-gray-600 mt-2">{t("projectNotFoundDescription")}</p>
          <Button 
            onClick={() => navigate("/projects")}
            className="mt-4"
          >
            {t("backToProjects")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("editProject")}</CardTitle>
          <CardDescription>
            {t("editProjectDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormRoot 
            form={form}
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t("basicInfo")}</TabsTrigger>
                <TabsTrigger value="goals">{t("goals")}</TabsTrigger>
                <TabsTrigger value="relationships">{t("relationships")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as FormControl}
                    name="title"
                    render={({ field }: { field: FieldProps }) => (
                      <FormItem>
                        <FormLabel>{t("projectName")} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("enterProjectName")}
                            {...field}
                          />
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
                        <FormLabel>{t("department")} *</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectDepartment")} />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
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
                        <FormLabel>{t("projectManager")} *</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectProjectManager")} />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter(user => user.role === "ProjectManager" || user.role === "SubPMO" || user.role === "MainPMO")
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as FormControl}
                    name="startDate"
                    render={({ field }: { field: FieldProps }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("startDate")} *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>{t("pickDate")}</span>
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
                              disabled={(date: Date) =>
                                date < new Date("1900-01-01")
                              }
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
                        <FormLabel>{t("endDate")} *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>{t("pickDate")}</span>
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
                              disabled={(date: Date) =>
                                date < new Date("1900-01-01")
                              }
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
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="goals" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("projectGoals")}</h3>
                  {goals.length > 0 ? (
                    <div className="space-y-3">
                      {projectGoalFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4">
                          <FormField
                            control={form.control as FormControl}
                            name={`projectGoals.${index}.goalId` as FieldPath<FormValues>}
                            render={({ field }: { field: FieldProps }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="sr-only">{t("goal")}</FormLabel>
                                <Select
                                  value={field.value?.toString() || ""}
                                  onValueChange={(value: string) => field.onChange(parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectGoal")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {goals.map((goal) => (
                                      <SelectItem key={goal.id} value={goal.id.toString()}>
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
                      ))}
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
                  ) : (
                    <p className="text-gray-500">{t("noGoalsAvailable")}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="relationships" className="space-y-4">
                {/* Related Projects Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("relatedProjects")}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t("relatedProjectsDescription")}</p>
                  
                  <div className="space-y-3">
                    {relatedProjectFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4">
                        <FormField
                          control={form.control as FormControl}
                          name={`relatedProjects.${index}.projectId` as FieldPath<FormValues>}
                          render={({ field }: { field: FieldProps }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="sr-only">{t("project")}</FormLabel>
                              <Select
                                value={field.value?.toString() || ""}
                                onValueChange={(value: string) => field.onChange(parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectProject")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableRelatedProjects().map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
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
                </div>
                
                {/* Related To Projects Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("relatedToProjects")}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t("relatedToProjectsDescription")}</p>
                  
                  <div className="space-y-3">
                    {relatedToProjectFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4">
                        <FormField
                          control={form.control as FormControl}
                          name={`relatedToProjects.${index}.dependsOnProjectId` as FieldPath<FormValues>}
                          render={({ field }: { field: FieldProps }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="sr-only">{t("project")}</FormLabel>
                              <Select
                                value={field.value?.toString() || ""}
                                onValueChange={(value: string) => field.onChange(parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectProject")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableRelatedToProjects().map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                {t("cancel")}
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
                className="bg-qatar-maroon hover:bg-maroon-800 text-white"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4" />}
                {t("updateProject")}
              </Button>
            </div>
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  );
} 