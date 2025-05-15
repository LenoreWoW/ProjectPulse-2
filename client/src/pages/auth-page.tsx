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
import { FileUpload } from "@/components/ui/file-upload";
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

  // Registration form schema with file upload fields
  const registerSchema = insertUserSchema.extend({
    confirmPassword: z.string().min(1, { message: t("confirmPasswordRequired") }),
    passportImageFile: z.instanceof(File, { message: t("passportRequired") }).optional(),
    idCardImageFile: z.instanceof(File, { message: t("idCardRequired") }).optional(),
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
      passportImageFile: undefined,
      idCardImageFile: undefined,
    },
  });

  // Handle login form submission
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Handle registration form submission
  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    // Remove confirmPassword and file fields as they need special handling
    const { confirmPassword, passportImageFile, idCardImageFile, ...userData } = values;
    
    // Convert file data to base64 strings for storage
    const processFiles = async () => {
      try {
        // Function to convert file to base64
        const fileToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        };
        
        // Process passport file if provided
        if (passportImageFile) {
          const passportBase64 = await fileToBase64(passportImageFile);
          userData.passportImage = passportBase64;
        }
        
        // Process ID card file if provided
        if (idCardImageFile) {
          const idCardBase64 = await fileToBase64(idCardImageFile);
          userData.idCardImage = idCardBase64;
        }
        
        // Now submit the user data with file data encoded as base64
        registerMutation.mutate(userData);
      } catch (error) {
        console.error("Error processing file uploads:", error);
      }
    };
    
    processFiles();
  }

  return (
    <div className="min-h-screen bg-maroon-700 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-maroon-700 to-maroon-800">
      {/* Top border with white color */}
      <div className="fixed top-0 left-0 w-full h-3 bg-white"></div>
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side: Auth forms */}
        <Card className="w-full bg-white border-2 border-maroon-700 shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="space-y-1 flex flex-col items-center bg-white border-b-2 border-maroon-700 py-6">
            <div className="flex items-center justify-center mb-6">
              <QatarLogo size="lg" />
            </div>
            <CardTitle className="text-2xl text-center text-maroon-700 font-bold">
              {activeTab === "login" ? t("login") : t("register")}
            </CardTitle>
            <CardDescription className="text-center text-maroon-500 font-medium">
              {activeTab === "login" 
                ? t("enterCredentials") 
                : t("createAccount")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-8">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white border-2 border-maroon-700 p-1 rounded-md">
                <TabsTrigger value="login" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white text-maroon-700 font-bold p-3 rounded">{t("login")}</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white text-maroon-700 font-bold p-3 rounded">{t("register")}</TabsTrigger>
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
                    
                    <div className="mt-6 p-4 border border-maroon-200 dark:border-maroon-800 rounded-md bg-maroon-50 dark:bg-maroon-900/20">
                      <h3 className="text-lg font-semibold text-maroon-700 dark:text-maroon-300 mb-4">
                        {t("requiredDocuments")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                        <FormField
                          control={registerForm.control}
                          name="passportImageFile"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <FileUpload
                                  id="passportUpload"
                                  label={t("passportUpload")}
                                  accept="image/*,.pdf"
                                  required={true}
                                  onChange={field.onChange}
                                  value={field.value}
                                  errorMessage={registerForm.formState.errors.passportImageFile?.message}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="idCardImageFile"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <FileUpload
                                  id="idCardUpload"
                                  label={t("idCardUpload")}
                                  accept="image/*,.pdf"
                                  required={true}
                                  onChange={field.onChange}
                                  value={field.value}
                                  errorMessage={registerForm.formState.errors.idCardImageFile?.message}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("documentRequirementNote")}
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-maroon-700 hover:bg-maroon-800 mt-6"
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
          <div className="relative overflow-hidden p-8 bg-white text-maroon-700 rounded-lg shadow-xl border border-maroon-700">
            {/* Maroon and white decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-maroon-700 opacity-10 transform rotate-45"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -mb-6 -ml-6 bg-maroon-700 opacity-10 transform rotate-45"></div>
            
            <h1 className={`text-3xl font-bold mb-4 ${isRtl ? 'text-right' : 'text-left'} text-maroon-700`}>
              {t("projectManagementSystem")}
            </h1>
            <p className="mb-6 text-maroon-700/90 font-medium">
              {t("pmSystemDescription")}
            </p>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-maroon-700 text-white mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-maroon-700 font-medium">{t("featureProjectTracking")}</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-maroon-700 text-white mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-maroon-700 font-medium">{t("featureBudgetManagement")}</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-maroon-700 text-white mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-maroon-700 font-medium">{t("featureTaskAssignment")}</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 rounded-full bg-maroon-700 text-white mr-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-maroon-700 font-medium">{t("featureApprovalWorkflows")}</p>
              </div>
            </div>
            
            {/* Decorative pattern at bottom */}
            <div className="mt-8 pt-6 border-t border-maroon-700/20 flex justify-center">
              <div className="h-1 w-12 bg-maroon-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
