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
import { insertGoalSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewGoalPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t, locale } = useI18n();

  // Create a form schema based on the insertGoalSchema
  const formSchema = insertGoalSchema
    .extend({
      targetDate: z.date(),
    });

  type FormValues = z.infer<typeof formSchema>;

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "Strategic",
      status: "NotStarted",
      priority: "Medium",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      const response = await apiRequest("POST", "/api/goals", formData);
      const data = await response.json();
      return data;
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

  const onSubmit = (values: FormValues) => {
    createGoalMutation.mutate(values);
  };

  const isLoading = createGoalMutation.isPending;

  return (
    <div className="container mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{t("newGoal")}</CardTitle>
          <CardDescription>{t("createGoalDescription")}</CardDescription>
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
                      <FormLabel>{t("title")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enterGoalTitle")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("type")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectGoalType")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Strategic">{t("strategic")}</SelectItem>
                            <SelectItem value="Annual">{t("annual")}</SelectItem>
                            <SelectItem value="Team">{t("team")}</SelectItem>
                            <SelectItem value="Personal">{t("personal")}</SelectItem>
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
                            <SelectItem value="NotStarted">{t("notStarted")}</SelectItem>
                            <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                            <SelectItem value="Completed">{t("completed")}</SelectItem>
                            <SelectItem value="OnHold">{t("onHold")}</SelectItem>
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
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("targetDate")}</FormLabel>
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
                        placeholder={t("enterGoalDescription")}
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}