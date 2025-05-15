import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/theme-provider";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Settings, 
  Moon, 
  Sun, 
  Languages, 
  Bell, 
  Shield, 
  Lock,
  Mail,
  Users
} from "lucide-react";
import UsersManagementPage from "./users-management-page";

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");

  // Form schema for profile settings
  const profileFormSchema = z.object({
    name: z.string().min(2, {
      message: t("nameValidation"),
    }),
    email: z.string().email({
      message: t("emailValidation"),
    }),
    bio: z.string().optional(),
  });

  // Form schema for notification settings
  const notificationFormSchema = z.object({
    emailNotifications: z.boolean().default(true),
    projectUpdates: z.boolean().default(true),
    taskAssignments: z.boolean().default(true),
    systemAnnouncements: z.boolean().default(true),
  });

  // Initialize the form with react-hook-form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: "",
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      projectUpdates: true,
      taskAssignments: true,
      systemAnnouncements: true,
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    toast({
      title: t("profileUpdated"),
      description: t("profileUpdateSuccess"),
    });
    console.log(data);
  };

  // Handle notification form submission
  const onNotificationsSubmit = (data: z.infer<typeof notificationFormSchema>) => {
    toast({
      title: t("notificationSettingsUpdated"),
      description: t("notificationSettingsSuccess"),
    });
    console.log(data);
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    toast({
      title: t("languageChanged"),
      description: t("languageChangeSuccess"),
    });
  };

  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("settings")}</h1>
      </div>

      {/* Settings Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar with settings categories */}
        <div className="md:w-64 space-y-2">
          <Card>
            <CardContent className="p-0">
              <div className="w-full">
                <nav className="space-y-1">
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === "profile" 
                        ? "bg-qatar-maroon text-white" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t("profile")}
                  </button>
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === "appearance" 
                        ? "bg-qatar-maroon text-white" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setActiveTab("appearance")}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    {t("appearance")}
                  </button>
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === "notifications" 
                        ? "bg-qatar-maroon text-white" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {t("notifications")}
                  </button>
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === "language" 
                        ? "bg-qatar-maroon text-white" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setActiveTab("language")}
                  >
                    <Languages className="w-4 h-4 mr-2" />
                    {t("language")}
                  </button>
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === "security" 
                        ? "bg-qatar-maroon text-white" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {t("security")}
                  </button>
                  
                  {["Administrator", "MainPMO"].includes(user?.role || "") && (
                    <button
                      className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                        activeTab === "faculty" 
                          ? "bg-qatar-maroon text-white" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setActiveTab("faculty")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {t("faculty")}
                    </button>
                  )}
                </nav>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right content area */}
        <div className="flex-1">
          <Card>
            {activeTab === "profile" && (
              <>
              <CardHeader>
                <CardTitle>{t("profileSettings")}</CardTitle>
                <CardDescription>
                  {t("profileSettingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("yourName")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("emailAddress")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("yourEmail")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("bio")}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t("aboutYourself")} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {t("bioDescription")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                      {t("saveChanges")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              </>
            )}

            {activeTab === "appearance" && (
              <>
              <CardHeader>
                <CardTitle>{t("appearanceSettings")}</CardTitle>
                <CardDescription>
                  {t("appearanceSettingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="font-medium">{t("darkMode")}</Label>
                    <Switch 
                      id="dark-mode" 
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("darkModeDescription")}
                  </p>
                </div>
              </CardContent>
              </>
            )}

            {activeTab === "notifications" && (
              <>
              <CardHeader>
                <CardTitle>{t("notificationSettings")}</CardTitle>
                <CardDescription>
                  {t("notificationSettingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {t("emailNotifications")}
                            </FormLabel>
                            <FormDescription>
                              {t("emailNotificationsDescription")}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="projectUpdates"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t("projectUpdates")}
                            </FormLabel>
                            <FormDescription>
                              {t("projectUpdatesDescription")}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="taskAssignments"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t("taskAssignments")}
                            </FormLabel>
                            <FormDescription>
                              {t("taskAssignmentsDescription")}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="systemAnnouncements"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t("systemAnnouncements")}
                            </FormLabel>
                            <FormDescription>
                              {t("systemAnnouncementsDescription")}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                      {t("saveChanges")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              </>
            )}

            {activeTab === "language" && (
              <>
              <CardHeader>
                <CardTitle>{t("languageSettings")}</CardTitle>
                <CardDescription>
                  {t("languageSettingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${language === 'en' ? 'border-qatar-maroon bg-maroon-50 dark:bg-maroon-900/20' : ''}`}
                    onClick={() => handleLanguageChange('en')}
                  >
                    <div className="font-medium">English</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">English (United States)</div>
                  </div>
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${language === 'ar' ? 'border-qatar-maroon bg-maroon-50 dark:bg-maroon-900/20' : ''}`}
                    onClick={() => handleLanguageChange('ar')}
                  >
                    <div className="font-medium">العربية</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Arabic</div>
                  </div>
                </div>
              </CardContent>
              </>
            )}

            {activeTab === "security" && (
              <>
              <CardHeader>
                <CardTitle>{t("securitySettings")}</CardTitle>
                <CardDescription>
                  {t("securitySettingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      {t("changePassword")}
                    </h3>
                    <div className="rounded-lg border p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">{t("currentPassword")}</Label>
                        <Input id="current-password" type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">{t("newPassword")}</Label>
                        <Input id="new-password" type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                        <Input id="confirm-password" type="password" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>
                  <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                    {t("updatePassword")}
                  </Button>
                </div>
              </CardContent>
              </>
            )}
            
            {activeTab === "faculty" && (
              <UsersManagementPage />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}