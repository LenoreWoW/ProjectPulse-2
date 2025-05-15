import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
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
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { t, isRtl } = useI18n();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Navigation rendering logic defined below directly with PermissionGate controls

  const isActive = (path: string) => location === path;

  const renderNavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <li key={path}>
      <Link 
        href={path}
        className={`flex items-center p-2 ${
          isActive(path)
            ? "text-white bg-maroon-700 dark:bg-maroon-800 dark:text-white"
            : "text-white hover:bg-maroon-600 dark:text-gray-100 dark:hover:bg-maroon-700"
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
      } hidden md:flex flex-col bg-qatar-maroon dark:bg-qatar-maroon shadow-lg transition-all duration-300 ease-in-out z-20 shrink-0 border-r border-maroon-700 dark:border-maroon-800 h-screen`}
    >
      <div className="p-4 flex items-center justify-between border-b border-maroon-700 dark:border-maroon-800">
        <Logo hideText={collapsed} />
        <button
          className="p-1 rounded-full text-white hover:bg-maroon-700 dark:hover:bg-maroon-800"
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

          <li className="pt-4 mt-4 border-t border-maroon-700 dark:border-maroon-800">
            <PermissionGate permission="canAccessAdminSettings">
              {renderNavItem({ icon: Settings, label: t("settings"), path: "/settings" })}
            </PermissionGate>
          </li>
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-maroon-700 dark:border-maroon-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-maroon-600 text-white flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className={`${isRtl ? 'mr-3' : 'ml-3'}`}>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-300 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
