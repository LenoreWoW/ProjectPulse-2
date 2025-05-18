import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertRiskIssueSchema, Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n-new";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";

// Create a form schema that matches our API requirements
const formSchema = z.object({
  type: z.enum(["Risk", "Issue"]),
  description: z.string().min(1, "Description is required"),
  descriptionAr: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["Open", "InProgress", "Resolved", "Closed"]).default("Open"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRiskIssuePage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useI18n();
  const { user } = useAuth();
  
  // Fetch projects for the dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 60000, // 1 minute
  });
  
  // Filter projects based on user's role and department
  const userProjects = projects.filter(project => {
    if (!user) return false;
    
    if (["Administrator", "MainPMO", "Executive"].includes(user.role || "")) {
      return true; // Can select any project
    } else if (user.role === "DepartmentDirector" || user.role === "SubPMO") {
      return project.departmentId === user.departmentId; // Only department projects
    } else if (user.role === "ProjectManager") {
      return project.managerUserId === user.id || project.departmentId === user.departmentId;
    }
    
    return project.departmentId === user.departmentId; // Regular users see only department projects
  });
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Risk",
      description: "",
      descriptionAr: "",
      priority: "Medium",
      projectId: "",
      status: "Open",
    },
  });
  
  // Pre-fill projectId if provided in URL query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("projectId");
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [form]);
  
  // Create risk/issue mutation
  const createRiskIssueMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // The projectId from the form is a string, we need to convert it to a number for the API
      const projectId = Number(data.projectId);
      
      // API expects data in a specific format
      const response = await apiRequest("POST", `/api/projects/${projectId}/risks-issues`, {
        type: data.type,
        description: data.description,
        descriptionAr: data.descriptionAr,
        priority: data.priority,
        status: data.status,
        // The projectId will be added from the URL parameter in the API route
      });
      
      return response;
    },
    onSuccess: () => {
      // Success message
      toast({
        title: t("riskIssueCreated"),
        description: t("itemCreatedSuccessfully"),
      });
      // Invalidate queries and navigate back
      queryClient.invalidateQueries({ queryKey: ["/api/risks-issues"] });
      navigate("/risks-issues");
    },
    onError: (error: any) => {
      // Error message
      toast({
        title: t("error"),
        description: error.message || t("somethingWentWrong"),
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: FormValues) => {
    createRiskIssueMutation.mutate(values);
  };
  
  const isLoading = isLoadingProjects || createRiskIssueMutation.isPending;
  
  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newRiskIssue")}</CardTitle>
          <CardDescription>{t("createRiskIssueDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Type Selection */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("type")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="Risk" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {t("risk")}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="Issue" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {t("issue")}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Project Select */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("project")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectProject")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userProjects.map((project) => (
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
              
              {/* Priority Select */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectPriority")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">{t("low")}</SelectItem>
                        <SelectItem value="Medium">{t("medium")}</SelectItem>
                        <SelectItem value="High">{t("high")}</SelectItem>
                        <SelectItem value="Critical">{t("critical")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status - Only for Issues */}
              {form.watch("type") === "Issue" && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectStatus")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Open">{t("open")}</SelectItem>
                          <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                          <SelectItem value="Resolved">{t("resolved")}</SelectItem>
                          <SelectItem value="Closed">{t("closed")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enterDescription")}
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Arabic Description (optional) */}
              <FormField
                control={form.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("descriptionArabic")} ({t("optional")})</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enterDescriptionArabic")}
                        className="resize-y min-h-[100px] text-right"
                        dir="rtl"
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
                  onClick={() => navigate("/risks-issues")}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("create")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 