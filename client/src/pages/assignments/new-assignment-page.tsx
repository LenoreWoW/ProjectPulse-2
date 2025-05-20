import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Assignment, priorityEnum, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Assignment name is required",
  }),
  description: z.string().optional(),
  assignedToUserId: z.number({
    required_error: "Please select an assignee",
  }),
  priority: z.enum(["Low", "Medium", "High", "Critical"], {
    required_error: "Please select a priority",
  }),
  deadline: z.date({
    required_error: "Please select a deadline",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewAssignmentPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch users for assignee dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Form setup with react-hook-form and zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
    },
  });

  // Create assignment mutation
  const createAssignment = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Submitting assignment data:", {
        ...data,
        assignedByUserId: user!.id,
      });
      
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          assignedByUserId: user!.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Assignment creation failed:", response.status, errorData);
        throw new Error(errorData.message || `Failed to create assignment (${response.status})`);
      }
      
      const createdAssignment = await response.json();
      
      // Create notification for assignee
      try {
        // Create notification for the assignee
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.assignedToUserId,
            relatedEntity: 'Assignment',
            relatedEntityId: createdAssignment.id,
            message: `You have been assigned a new assignment: "${data.title}" by ${user?.name}`,
          }),
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't fail the whole operation if notification creation fails
      }
      
      return createdAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      setLocation("/assignments");
    },
    onError: (error) => {
      console.error("Assignment creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    createAssignment.mutate(data);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("newAssignment")}</h1>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t("createNewAssignment")}</CardTitle>
          <CardDescription>{t("fillDetailsBelow")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Assignment Name */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assignmentName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enterAssignmentName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        className="min-h-32" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignee */}
                <FormField
                  control={form.control}
                  name="assignedToUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("assignee")}</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectAssignee")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>{t("loading")}</SelectItem>
                          ) : (
                            users?.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Priority */}
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
                
                {/* Deadline */}
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
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation("/assignments")}
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                  disabled={createAssignment.isPending}
                >
                  {createAssignment.isPending ? t("creating") : t("createAssignment")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
} 