import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/hooks/use-i18n-new";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/theme-provider";
import { PermissionGate } from "@/hooks/use-permissions";
import { Logo } from "@/components/ui/logo";
import {
  Calendar,
  Home,
  LayoutList,
  CheckSquare,
  Target,
  AlertTriangle,
  Users,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  BarChart3,
  BookCopy,
  Network,
  LineChart,
  ShieldCheck,
  Plus,
  Moon,
  Sun,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { t, language, setLanguage, isRtl } = useI18n();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    setLanguage(newLanguage);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation rendering logic defined below directly with PermissionGate controls

  const isActive = (path: string) => location === path;

  const renderNavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <li key={path}>
      <Link 
        href={path}
        className={`flex items-center p-2 ${
          isActive(path)
            ? "text-white bg-primary/90"
            : "text-white hover:bg-primary/80"
        } rounded-lg transition-colors duration-200`}
      >
        <Icon className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'} rtl-mirror`} />
        {!collapsed && <span>{label}</span>}
      </Link>
    </li>
  );

  return (
    <aside 
      className={`${
        collapsed ? "w-20" : "w-64"
      } hidden md:flex flex-col bg-sidebar shadow-lg transition-all duration-300 ease-in-out z-20 shrink-0 border-r border-sidebar-border h-screen`}
    >
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <Logo hideText={collapsed} />
        <button
          className="p-1 rounded-full text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {isRtl ? (
            collapsed ? <ChevronLeft className="rtl-mirror" /> : <ChevronRight className="rtl-mirror" />
          ) : (
            collapsed ? <ChevronRight /> : <ChevronLeft />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {/* Always visible items */}
          {renderNavItem({ icon: Home, label: t("dashboard"), path: "/" })}
          {renderNavItem({ icon: Calendar, label: t("calendar"), path: "/calendar" })}
          {renderNavItem({ icon: LayoutList, label: t("projects"), path: "/projects" })}
          {renderNavItem({ icon: CheckSquare, label: t("tasks"), path: "/tasks" })}
          {renderNavItem({ icon: Target, label: t("goals"), path: "/goals" })}
          {renderNavItem({ icon: AlertTriangle, label: t("risksAndIssues"), path: "/risks-issues" })}
          {renderNavItem({ icon: Users, label: t("assignments"), path: "/assignments" })}
          
          {/* Permission-based items */}
          <PermissionGate permission="canApproveProject">
            {renderNavItem({ icon: MessageSquare, label: t("approvals"), path: "/approvals" })}
          </PermissionGate>
          
          <PermissionGate
            roles={["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]}
          >
            {renderNavItem({ icon: ClipboardList, label: t("auditLogs"), path: "/audit-logs" })}
          </PermissionGate>
          
          <PermissionGate permission="canViewReports">
            {renderNavItem({ icon: Network, label: t("dependencies"), path: "/dependencies" })}
            {renderNavItem({ icon: BookCopy, label: t("repository"), path: "/repository" })}
            {renderNavItem({ icon: BarChart3, label: t("reports"), path: "/reports" })}
          </PermissionGate>
          
          <PermissionGate permission="canViewAnalytics">
            {renderNavItem({ icon: LineChart, label: t("analytics"), path: "/reports/analytics" })}
          </PermissionGate>
          
          <PermissionGate permission="canViewAllDepartments">
            {renderNavItem({ icon: Building, label: t("departments"), path: "/departments" })}
          </PermissionGate>

          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <PermissionGate permission="canManageUsers">
              {renderNavItem({ icon: ShieldCheck, label: t("userPermissions"), path: "/user-permissions" })}
            </PermissionGate>
            <PermissionGate permission="canAccessAdminSettings">
              {renderNavItem({ icon: Settings, label: t("settings"), path: "/settings" })}
            </PermissionGate>
          </div>
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-2 border-t border-sidebar-border">
          {/* Discord-style user settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full text-start flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors duration-200 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className={`${isRtl ? 'mr-3' : 'ml-3'} flex-1`}>
                  <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
                <div className="flex space-x-1 rtl:space-x-reverse">
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-bold text-muted-foreground">
                    {language === "en" ? "EN" : "AR"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "end" : "start"} side="top" className="w-56">
              <DropdownMenuLabel className="pb-2 border-b">{user?.name}</DropdownMenuLabel>
              
              {/* User Settings Section */}
              <div className="py-1 px-1">
                <DropdownMenuItem 
                  className="flex items-center justify-between cursor-pointer rounded-md my-1 px-2 py-2"
                  onClick={toggleTheme}
                >
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span>{theme === "dark" ? t("lightMode") : t("darkMode")}</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center justify-between cursor-pointer rounded-md my-1 px-2 py-2"
                  onClick={toggleLanguage}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">
                      {language === "en" ? "AR" : "EN"}
                    </span>
                    <span>{language === "en" ? t("arabicLanguage") : t("englishLanguage")}</span>
                  </div>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* User Actions */}
              <div className="py-1 px-1">
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer rounded-md my-1 px-2 py-2 text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
