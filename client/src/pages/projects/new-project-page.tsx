import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";

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
import { type Department, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  
  // Fetch departments for the select dropdown
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    staleTime: 60000, // 1 minute
  });

  // Fetch users for the manager select dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 60000, // 1 minute
  });

  // Create a form schema based on the insertProjectSchema
  const formSchema = z.object({
    title: z.string().min(1, t("required")),
    description: z.string().optional(),
    status: z.string(),
    priority: z.string(),
    budget: z.number().default(0),
    actualCost: z.number().default(0),
    startDate: z.date(),
    endDate: z.date(), // This will be converted to deadline on the server
    departmentId: z.string().min(1, t("required")),
    managerUserId: z.string().min(1, t("required")),
    client: z.string().optional(),
  }).refine((data) => data.endDate >= data.startDate, {
    message: t("endDateMustBeAfterStartDate"),
    path: ["endDate"],
  });

  type FormValues = z.infer<typeof formSchema>;

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Planning",
      priority: "Medium",
      budget: 0,
      actualCost: 0,
      departmentId: "",
      managerUserId: "",
      client: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to one month from today
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      // Convert form data to match API expectations
      const projectData = {
        ...formData,
        departmentId: Number(formData.departmentId),
        managerUserId: Number(formData.managerUserId),
      };
      const response = await apiRequest("POST", "/api/projects", projectData);
      const data = await response.json();
      return data;
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
                        <Input placeholder={t("enterProjectName")} {...field} />
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
                        >
                          <SelectTrigger>
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
                  name="departmentId"
                  render={({ field }) => (
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
                            {departments.map((department) => (
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

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("budget")}</FormLabel>
                      <FormControl>
                        <Input
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
                  name="actualCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("actualCost")}</FormLabel>
                      <FormControl>
                        <Input
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
                  name="endDate"
                  render={({ field }) => (
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
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
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