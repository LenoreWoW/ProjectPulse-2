import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormRoot,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form-wrapper";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, Project } from "@/lib/schema-types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// Define types for the field arrays
type ProjectFieldType = {
  id: string;
  projectId: number;
  weight: number;
};

type GoalFieldType = {
  id: string;
  goalId: number;
  weight: number;
};

// Extended schema for the form that includes related projects and goals
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  deadline: z.date().optional(),
  isStrategic: z.boolean().default(false),
  isAnnual: z.boolean().default(true),
  departmentId: z.number().optional(),
  relatedProjects: z.array(
    z.object({
      projectId: z.number(),
      weight: z.number().min(1).max(10),
    })
  ).optional(),
  relatedGoals: z.array(
    z.object({
      goalId: z.number(),
      weight: z.number().min(1).max(10),
    })
  ).optional(),
});

// Updated type for FormValues
type FormValues = z.infer<typeof formSchema>;

export default function NewGoalPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [isDepartmentGoal, setIsDepartmentGoal] = useState(false);
  
  // Parse URL search params manually since wouter doesn't have useSearchParams
  const isTypeParam = location.includes("type=department");

  // Fetch departments for the select dropdown
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["/api/departments"],
    staleTime: 60000, // 1 minute
  });

  // Fetch projects for relationship selection with proper typing
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 60000, // 1 minute
  });

  // Fetch goals for relationship selection
  const { data: goalsData, isLoading: isLoadingGoals } = useQuery<{strategic: Goal[], annual: Goal[]}>({
    queryKey: ["/api/goals"],
    staleTime: 60000, // 1 minute
  });
  
  // Combine strategic and annual goals
  const goals: Goal[] = goalsData ? 
    [...(goalsData.strategic || []), ...(goalsData.annual || [])] : 
    [];

  // Check if user has permission to create department goals
  const canCreateDepartmentGoal = user?.role === "DepartmentDirector" || user?.role === "Administrator";
  
  // Set department goal flag based on URL parameter
  useEffect(() => {
    if (isTypeParam && canCreateDepartmentGoal) {
      setIsDepartmentGoal(true);
    }
  }, [isTypeParam, canCreateDepartmentGoal]);
  
  // Initialize the form with proper typing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      isStrategic: false,
      isAnnual: true,
      departmentId: user?.departmentId || undefined,
      relatedProjects: [],
      relatedGoals: [],
    },
  });

  // Update departmentId when isDepartmentGoal changes
  useEffect(() => {
    if (isDepartmentGoal) {
      if (user?.role === "DepartmentDirector" && user?.departmentId) {
        // Department directors can only use their own department
        form.setValue("departmentId", user.departmentId);
      } else if (user?.role === "Administrator") {
        // For administrators, don't automatically set a department
        // They will select one from the dropdown
        if (!form.getValues().departmentId) {
          form.setValue("departmentId", undefined);
        }
      }
    } else {
      // Make sure departmentId is undefined, not null
      form.setValue("departmentId", undefined);
    }
  }, [isDepartmentGoal, user?.role, user?.departmentId, form]);

  // Set up field arrays for related projects and goals
  const { 
    fields: projectFields, 
    append: appendProject, 
    remove: removeProject 
  } = useFieldArray<FormValues, "relatedProjects", "id">({
    control: form.control,
    name: "relatedProjects",
  });

  const { 
    fields: goalFields, 
    append: appendGoal, 
    remove: removeGoal 
  } = useFieldArray<FormValues, "relatedGoals", "id">({
    control: form.control,
    name: "relatedGoals",
  });

  const createGoalMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      try {
        const response = await apiRequest("POST", "/api/goals", formData);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create goal");
        }
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to create goal");
      }
    },
    onSuccess: () => {
      toast({
        title: t("goalCreated"),
        description: t("goalCreatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      navigate("/goals");
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update the onSubmit function with SubmitHandler
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    // Filter out invalid projects and goals before submission
    const cleanedValues = {
      ...values,
      createdByUserId: user?.id || 0,
      relatedProjects: values.relatedProjects?.filter((p: any) => p.projectId > 0) || [],
      relatedGoals: values.relatedGoals?.filter((g: any) => g.goalId > 0) || []
    };
    createGoalMutation.mutate(cleanedValues);
  };

  const isLoading = isLoadingDepartments || isLoadingProjects || isLoadingGoals || createGoalMutation.isPending;

  // Filter projects for selection dropdown (exclude already selected)
  const getAvailableProjects = () => {
    const selectedIds = (projectFields as ProjectFieldType[]).map(field => field.projectId);
    return projects.filter(project => !selectedIds.includes(project.id));
  };

  // Filter goals for selection dropdown (exclude already selected and self-references)
  const getAvailableGoals = () => {
    const selectedIds = (goalFields as GoalFieldType[]).map(field => field.goalId);
    return goals.filter(goal => !selectedIds.includes(goal.id));
  };

  // Get project name by ID
  const getProjectName = (id: number) => {
    const project = projects.find(p => p.id === id);
    return project ? project.title : "";
  };

  // Get goal title by ID
  const getGoalTitle = (id: number) => {
    const goal = goals.find(g => g.id === id);
    return goal ? goal.title : "";
  };

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newGoal")}</CardTitle>
          <CardDescription>{t("createGoalDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormRoot form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Goal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enterTitle")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                render={({ field }: any) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("deadline")}</FormLabel>
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
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isStrategic"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t("strategicGoal")}
                        </FormLabel>
                        <FormDescription>
                          {t("strategicGoalDescription")}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAnnual"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t("annualGoal")}
                        </FormLabel>
                        <FormDescription>
                          {t("annualGoalDescription")}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Department Goal Section */}
            {canCreateDepartmentGoal && (
              <div className="rounded-md border p-4">
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={isDepartmentGoal}
                      onCheckedChange={(value) => setIsDepartmentGoal(!!value)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("departmentGoals")}</FormLabel>
                    <FormDescription>
                      {t("departmentGoalNote")}
                    </FormDescription>
                  </div>
                </FormItem>
              </div>
            )}

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("enterDescription")}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Related Projects Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("relatedProjects")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendProject({ 
                    projectId: projects.length > 0 ? projects[0].id : 0, 
                    weight: 1 
                  })}
                  disabled={getAvailableProjects().length === 0}
                >
                  <Plus className="mr-1 h-4 w-4" /> {t("addRelatedProject")}
                </Button>
              </div>

              {projectFields.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noRelatedProjects")}</p>
              ) : (
                <div className="space-y-3">
                  {projectFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3 rounded-md border p-3">
                      <div className="flex-1">
                        <Select
                          value={(field as ProjectFieldType).projectId.toString()}
                          onValueChange={(value: string) => {
                            const updatedProjects = [...form.getValues().relatedProjects || []];
                            updatedProjects[index] = {
                              ...updatedProjects[index],
                              projectId: parseInt(value)
                            };
                            form.setValue("relatedProjects", updatedProjects);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {(field as ProjectFieldType).projectId ? getProjectName((field as ProjectFieldType).projectId) : t("selectProject")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableProjects().map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title}
                              </SelectItem>
                            ))}
                            {/* Keep the current selection even if not in available projects */}
                            {(field as ProjectFieldType).projectId && !getAvailableProjects().some(p => p.id === (field as ProjectFieldType).projectId) && (
                              <SelectItem value={(field as ProjectFieldType).projectId.toString()}>
                                {getProjectName((field as ProjectFieldType).projectId)}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <FormItem className="mb-0">
                          <FormLabel className="text-xs">{t("weight")}</FormLabel>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={(field as ProjectFieldType).weight}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const updatedProjects = [...form.getValues().relatedProjects || []];
                              updatedProjects[index] = {
                                ...updatedProjects[index],
                                weight: parseInt(e.target.value)
                              };
                              form.setValue("relatedProjects", updatedProjects);
                            }}
                          />
                        </FormItem>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProject(index)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Goals Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("relatedGoals")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendGoal({ 
                    goalId: goals.length > 0 ? goals[0].id : 0, 
                    weight: 1 
                  })}
                  disabled={getAvailableGoals().length === 0}
                >
                  <Plus className="mr-1 h-4 w-4" /> {t("addRelatedGoal")}
                </Button>
              </div>

              {goalFields.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noRelatedGoals")}</p>
              ) : (
                <div className="space-y-3">
                  {goalFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3 rounded-md border p-3">
                      <div className="flex-1">
                        <Select
                          value={(field as GoalFieldType).goalId.toString()}
                          onValueChange={(value: string) => {
                            const updatedGoals = [...form.getValues().relatedGoals || []];
                            updatedGoals[index] = {
                              ...updatedGoals[index],
                              goalId: parseInt(value)
                            };
                            form.setValue("relatedGoals", updatedGoals);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {(field as GoalFieldType).goalId ? getGoalTitle((field as GoalFieldType).goalId) : t("selectGoal")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableGoals().map((goal) => (
                              <SelectItem key={goal.id} value={goal.id.toString()}>
                                {goal.title}
                              </SelectItem>
                            ))}
                            {/* Keep the current selection even if not in available goals */}
                            {(field as GoalFieldType).goalId && !getAvailableGoals().some(g => g.id === (field as GoalFieldType).goalId) && (
                              <SelectItem value={(field as GoalFieldType).goalId.toString()}>
                                {getGoalTitle((field as GoalFieldType).goalId)}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <FormItem className="mb-0">
                          <FormLabel className="text-xs">{t("weight")}</FormLabel>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={(field as GoalFieldType).weight}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const updatedGoals = [...form.getValues().relatedGoals || []];
                              updatedGoals[index] = {
                                ...updatedGoals[index],
                                weight: parseInt(e.target.value)
                              };
                              form.setValue("relatedGoals", updatedGoals);
                            }}
                          />
                        </FormItem>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGoal(index)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/goals")}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("createGoal")}
              </Button>
            </div>
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  );
}