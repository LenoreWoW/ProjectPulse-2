import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n-new";
import { useEffect, useState, useRef } from "react";
import { Redirect } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldValues, ControllerRenderProps, FieldPath } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";

// Import Qatar landmark images from the existing index file
import { qatarLandmarks } from "../assets/landmarks";
import {
  FormRoot,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-wrapper";
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
  const { t, isRtl, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("login");

  // If the user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Set up image rotation timer (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % qatarLandmarks.length);
    }, 30000); // 30 seconds interval
    
    return () => clearInterval(interval);
  }, []);

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
  }).refine((data: any) => data.password === data.confirmPassword, {
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
      preferredLanguage: "ar", // Default to Arabic language
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

  // Get current Qatar landmark image
  const currentLandmarkImage = qatarLandmarks[currentImageIndex];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative p-4" style={{
      backgroundImage: `url(${currentLandmarkImage})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }}>
      {/* Single background overlay */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Auth Card - positioned above overlay */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full bg-gray-900/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border-2 border-qatar-maroon">
          <CardHeader className="space-y-1 flex flex-col items-center pt-8 pb-6 px-6">
            <div className="flex flex-col items-center justify-center mb-4">
              <QatarLogo size="lg" className="mb-2" />
              <h2 className="text-lg font-semibold text-white">
                {t("Project Management System")}
              </h2>
            </div>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-qatar-maroon/20 rounded-lg">
                <TabsTrigger 
                  value="login" 
                  className="text-white data-[state=active]:bg-qatar-maroon data-[state=active]:text-white rounded-md"
                >
                  {t("login")}
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="text-white data-[state=active]:bg-qatar-maroon data-[state=active]:text-white rounded-md"
                >
                  {t("register")}
                </TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <FormRoot 
                  form={loginForm}
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className="text-qatar-white">{t("username")}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="auth-input"
                              placeholder={t("enterUsername")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }: any) => (
                        <FormItem className="mb-6">
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              className="auth-input"
                              placeholder={t("enterPassword")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-qatar-maroon hover:bg-opacity-90 text-white font-semibold py-3 rounded-full transition-colors"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("loggingIn")}
                        </>
                      ) : (
                        t("login")
                      )}
                    </Button>
                </FormRoot>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <FormRoot 
                  form={registerForm}
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-3"
                >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }: any) => (
                        <FormItem className="mb-3">
                          <FormControl>
                            <Input 
                              {...field} 
                              className="auth-input"
                              placeholder={t("fullName")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }: any) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                className="auth-input"
                                placeholder={t("email")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }: any) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                {...field} 
                                className="auth-input"
                                placeholder={t("phone")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }: any) => (
                        <FormItem className="mb-3">
                          <FormControl>
                            <Input 
                              {...field} 
                              className="auth-input"
                              placeholder={t("username")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }: any) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="auth-input"
                                placeholder={t("password")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }: any) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="auth-input"
                                placeholder={t("confirmPassword")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* File Upload Section */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="passportImageFile"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormControl>
                                <FileUpload
                                  id="passportUpload"
                                  onChange={(file: File | null) => field.onChange(file)}
                                  accept="image/*"
                                  label={t("passportImage")}
                                  value={field.value}
                                  className="auth-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="idCardImageFile"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormControl>
                                <FileUpload
                                  id="idCardUpload"
                                  onChange={(file: File | null) => field.onChange(file)}
                                  accept="image/*"
                                  label={t("idCardImage")}
                                  value={field.value}
                                  className="auth-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-qatar-maroon hover:bg-opacity-90 text-white font-semibold py-3 rounded-full transition-colors mt-4"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("registering")}
                        </>
                      ) : (
                        t("register")
                      )}
                    </Button>
                </FormRoot>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
