import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useEffect, useState, useRef } from "react";
import { Redirect } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import HD Qatar landmark images directly
import landmark1 from "../assets/landmarks/hd/image_1747300730144.png"; // Qatar Islamic Cultural Center
import landmark2 from "../assets/landmarks/hd/image_1747300807633.png"; // Museum of Islamic Art
import landmark3 from "../assets/landmarks/hd/image_1747300874983.png"; // Al Zubarah Fort
import landmark4 from "../assets/landmarks/hd/image_1747300899310.png"; // Katara Cultural Village
import landmark5 from "../assets/landmarks/hd/image_1747300922286.png"; // Souq Waqif
import landmark6 from "../assets/landmarks/hd/image_1747300962058.png"; // State Grand Mosque
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
  
  // Create array of Qatar landmark images
  const qatarLandmarks = [
    landmark1, landmark2, landmark3, landmark4, landmark5, landmark6
  ];
  
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
    <div className="min-h-screen flex items-center justify-center p-0 overflow-hidden relative">
      {/* Dynamic background with Qatar landmarks */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {qatarLandmarks.map((landmark, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${landmark})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              objectFit: 'cover',
              opacity: index === currentImageIndex ? 1 : 0,
              zIndex: 1,
              transform: 'scale(1.02)' // Slight zoom for better edge coverage
            }}
          />
        ))}
        {/* Overlay for better text readability - 70% opacity for improved contrast */}
        <div className="absolute inset-0 bg-black bg-opacity-70 z-2" />
      </div>
      
      <div className="w-full max-w-md z-10">
        {/* Auth Card */}
        <Card className="w-full bg-black/50 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border-2 border-maroon-700">
          <CardHeader className="space-y-1 flex flex-col items-center pt-8 pb-6 px-6">
            <div className="flex flex-col items-center justify-center mb-4">
              <QatarLogo size="lg" className="mb-2" />
              <h2 className="text-lg font-semibold text-white">
                {t("Project Management System")}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 p-1 rounded-full overflow-hidden border border-maroon-600">
                <TabsTrigger value="login" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white text-white font-medium py-2 rounded-full">{t("login")}</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white text-white font-medium py-2 rounded-full">{t("register")}</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormControl>
                            <Input 
                              placeholder={t("username")} 
                              {...field} 
                              className="auth-input"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300 text-sm ml-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={t("password")} 
                              {...field} 
                              className="auth-input"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300 text-sm ml-2" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-maroon-700 hover:bg-maroon-800 text-white font-medium py-3 rounded-full transition-all duration-200 shadow-md border border-maroon-500"
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
                        <FormItem className="mb-3">
                          <FormControl>
                            <Input 
                              placeholder={t("name")} 
                              {...field} 
                              className="auth-input"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300 text-sm ml-2" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder={t("email")} 
                                {...field} 
                                className="auth-input"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300 text-sm ml-2" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                placeholder={t("phone")} 
                                {...field} 
                                value={field.value || ''} 
                                className="auth-input"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300 text-sm ml-2" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormControl>
                            <Input 
                              placeholder={t("username")} 
                              {...field}
                              className="auth-input"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300 text-sm ml-2" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder={t("password")} 
                                {...field}
                                className="auth-input"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300 text-sm ml-2" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder={t("confirmPassword")} 
                                {...field}
                                className="auth-input"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300 text-sm ml-2" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-6 p-4 border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-white mb-4">
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
                      <p className="text-xs text-white/70">
                        {t("documentRequirementNote")}
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-maroon-700 hover:bg-maroon-800 text-white font-medium py-3 rounded-full transition-all duration-200 shadow-md mt-6"
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
