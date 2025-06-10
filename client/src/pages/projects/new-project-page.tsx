import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Control, SubmitHandler, FieldPath, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Plus, Trash2, InfoIcon } from "lucide-react";
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
  FormDescription,
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
  priority: z.string().default("Medium"),
  managerUserId: z.string(),
  budget: z.coerce.number().optional(),
  startDate: z.date(),
  endDate: z.date(),
  description: z.string().optional(),
  projectPlanFile: z.instanceof(File).optional(),
  attachments: z.array(z.instanceof(File)).default([]),
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
      priority: "Medium",
      managerUserId: "",
      budget: undefined,
      startDate: new Date(),
      endDate: new Date(),
      description: "",
      projectPlanFile: undefined,
      attachments: [],
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
  
  // Create the mutation for project creation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const formData = new FormData();
      
      // Add all the project data
      formData.append('title', data.title);
      formData.append('priority', data.priority);
      formData.append('managerUserId', data.managerUserId);
      if (data.budget) formData.append('budget', data.budget.toString());
      formData.append('startDate', data.startDate.toISOString());
      formData.append('endDate', data.endDate.toISOString());
      if (data.description) formData.append('description', data.description);
      
      // Add project goals
      formData.append('projectGoals', JSON.stringify(data.projectGoals));
      
      // Add related projects
      formData.append('relatedProjects', JSON.stringify(data.relatedProjects));
      formData.append('relatedToProjects', JSON.stringify(data.relatedToProjects));
      
      // Add project plan file if provided
      if (data.projectPlanFile) {
        formData.append('projectPlanFile', data.projectPlanFile);
      }
      
      // Add additional attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      return await response.json();
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
    mutation.mutate(values);
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

  const isLoading = isLoadingDepartments || isLoadingUsers || isLoadingProjects || isLoadingGoals || mutation.isPending;

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newProject")}</CardTitle>
          <CardDescription>{t("createProjectDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormRoot form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                user.role === "ProjectManager" || 
                                user.role === "SubPMO" || 
                                user.role === "MainPMO")
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
                
                {/* Department Auto-Assignment Display */}
                {form.watch("managerUserId") && (
                  <div className="rounded-md border p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-2">
                      <InfoIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("department")}: {" "}
                        {departments?.find(dept => 
                          dept.id === users?.find(user => user.id.toString() === form.watch("managerUserId"))?.departmentId
                        )?.name || t("loading")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("departmentAutoAssigned")}
                    </p>
                  </div>
                )}
                
                                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>{t("budget")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("enterBudget")}
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value ? Number(e.target.value) : '')}
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

                            {/* Project Plan File */}
            <FormField
              control={form.control}
              name="projectPlanFile"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t("projectPlan")} <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        field.onChange(file);
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-qatar-maroon file:text-white hover:file:bg-qatar-maroon/90"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("projectPlanDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

                            {/* Additional Attachments */}
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t("additionalAttachments")}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const files = Array.from(e.target.files || []);
                        field.onChange(files);
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-qatar-maroon file:text-white hover:file:bg-qatar-maroon/90"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("additionalAttachmentsDescription")}
                  </FormDescription>
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
                                    {goals && goals.length > 0 ? goals.map((goal: Goal) => (
                                      <SelectItem
                                        key={goal.id}
                                        value={goal.id.toString()}
                                      >
                                        {goal.title}
                                      </SelectItem>
                                    )) : (
                                      <SelectItem value="0" disabled>
                                        {isLoadingGoals ? t("loading") : t("noGoalsAvailable")}
                                      </SelectItem>
                                    )}
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
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  );
}