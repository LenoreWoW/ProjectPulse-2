import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/ui/logo";
import { QatarLogo } from "@/components/ui/qatar-logo";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { t, isRtl } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("login");

  // If the user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  // Login form schema
  const loginSchema = z.object({
    username: z.string().min(1, { message: t("usernameRequired") }),
    password: z.string().min(1, { message: t("passwordRequired") }),
  });

  // Registration form schema
  const registerSchema = insertUserSchema.extend({
    confirmPassword: z.string().min(1, { message: t("confirmPasswordRequired") }),
  }).refine(data => data.password === data.confirmPassword, {
    message: t("passwordsDontMatch"),
    path: ["confirmPassword"],
  });

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "User",
      status: "Pending",
      departmentId: 1, // Default department
      preferredLanguage: "en",
    },
  });

  // Handle login form submission
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Handle registration form submission
  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    // Remove confirmPassword as it's not part of the user model
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Top border with Qatar flag colors */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-maroon-700 via-maroon-700 to-maroon-700"></div>
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side: Auth forms */}
        <Card className="w-full border-maroon-200 dark:border-maroon-800 shadow-lg">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center justify-center mb-4">
              <QatarLogo size="lg" />
            </div>
            <CardTitle className="text-2xl text-center text-maroon-800 dark:text-maroon-200">
              {activeTab === "login" ? t("login") : t("register")}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? t("enterCredentials") 
                : t("createAccount")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white">{t("login")}</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white">{t("register")}</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("username")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("password")}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={t("password")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-maroon-700 hover:bg-maroon-800"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("login")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Registration Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("name")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("email")}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder={t("email")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("phone")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("phone")} {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("username")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("password")}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder={t("password")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("confirmPassword")}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder={t("confirmPassword")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-maroon-700 hover:bg-maroon-800"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("register")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right side: Qatar-themed hero section with description and features */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="relative overflow-hidden p-8 bg-maroon-700 text-white rounded-lg shadow-xl">
            {/* Qatar flag-inspired decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-white opacity-10 transform rotate-45"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -mb-6 -ml-6 bg-white opacity-10 transform rotate-45"></div>
            
            {/* Qatar national symbol - stylized */}
            <div className="absolute top-4 right-4 opacity-20">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50,10 C65,10 80,25 80,50 C80,75 65,90 50,90 C35,90 20,75 20,50 C20,25 35,10 50,10 Z M50,30 C60,30 65,40 65,50 C65,60 60,70 50,70 C40,70 35,60 35,50 C35,40 40,30 50,30 Z" />
              </svg>
            </div>
            
            <h1 className={`text-3xl font-bold mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t("projectManagementSystem")}
            </h1>
            <p className="mb-6 text-white/90">
              {t("pmSystemDescription")}
            </p>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-white text-maroon-700 mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/95">{t("featureProjectTracking")}</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-white text-maroon-700 mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/95">{t("featureBudgetManagement")}</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-white text-maroon-700 mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/95">{t("featureTaskAssignment")}</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-white text-maroon-700 mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/95">{t("featureApprovalWorkflows")}</p>
              </div>
            </div>
            
            {/* Qatar-inspired decorative pattern at bottom */}
            <div className="mt-8 pt-6 border-t border-white/20 text-center text-white/60">
              <p className="text-sm">قطر • Qatar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
