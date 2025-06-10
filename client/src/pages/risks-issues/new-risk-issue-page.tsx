import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormRoot,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-wrapper";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/lib/schema-types";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  type: z.enum(["Risk", "Issue"], {
    required_error: "Type is required",
  }),
  projectId: z.string({
    required_error: "Project is required",
  }),
  priority: z.enum(["Low", "Medium", "High", "Critical"], {
    required_error: "Priority is required",
  }),
  status: z.enum(["Open", "InProgress", "Resolved", "Closed"], {
    required_error: "Status is required",
  }).optional(),
  title: z.string().min(1, {
    message: "Title is required",
  }),
  description: z.string().min(1, {
    message: "Description is required",
  }),
  descriptionAr: z.string().optional(),
  impact: z.string().optional(),
  mitigation: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRiskIssuePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch projects for dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Risk",
      projectId: "",
      priority: "Medium",
      status: "Open",
      title: "",
      description: "",
      descriptionAr: "",
      impact: "",
      mitigation: "",
    },
  });

  // Create risk or issue mutation
  const createRiskIssueMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert form data to match API expectations
      const riskIssueData = {
        ...data,
        projectId: Number(data.projectId),
        createdByUserId: user?.id,
      };

      console.log("Submitting risk/issue data:", riskIssueData);

      const response = await fetch(`/api/projects/${riskIssueData.projectId}/risks-issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(riskIssueData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Risk/Issue creation failed:", response.status, errorData);
        throw new Error(errorData.message || `Failed to create ${data.type.toLowerCase()} (${response.status})`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.type === "Risk" ? t("riskCreated") : t("issueCreated"),
        description: variables.type === "Risk" ? t("riskCreatedDescription") : t("issueCreatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risks-issues"] });
      navigate("/risks-issues");
    },
    onError: (error: Error) => {
      console.error("Risk/Issue creation error:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createRiskIssueMutation.mutate(values);
  };

  const isLoading = isLoadingProjects || createRiskIssueMutation.isPending;

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{form.watch("type") === "Risk" ? t("newRisk") : t("newIssue")}</CardTitle>
          <CardDescription>{form.watch("type") === "Risk" ? t("createRiskDescription") : t("createIssueDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormRoot form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: any }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t("type")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Risk" id="risk" />
                        <label htmlFor="risk" className="flex items-center cursor-pointer">
                          <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
                          <span>{t("risk")}</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Issue" id="issue" />
                        <label htmlFor="issue" className="flex items-center cursor-pointer">
                          <AlertCircle className="h-4 w-4 mr-1 text-red-600" />
                          <span>{t("issue")}</span>
                        </label>
                      </div>
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

            {/* Priority Select */}
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

            {form.watch("type") === "Issue" && (
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
                          <SelectItem value="Open">{t("open")}</SelectItem>
                          <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                          <SelectItem value="Resolved">{t("resolved")}</SelectItem>
                          <SelectItem value="Closed">{t("closed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("enterDescription")}
                      className="min-h-[100px]"
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
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>{t("descriptionAr")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("enterDescriptionAr")}
                      className="min-h-[100px] dir-rtl"
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
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  );
} 