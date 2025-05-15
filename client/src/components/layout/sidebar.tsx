import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
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
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { t, isRtl } = useI18n();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: Home, label: t("dashboard"), path: "/" },
    { icon: Calendar, label: t("calendar"), path: "/calendar" },
    { icon: LayoutList, label: t("projects"), path: "/projects" },
    { icon: CheckSquare, label: t("tasks"), path: "/tasks" },
    { icon: Target, label: t("goals"), path: "/goals" },
    { icon: AlertTriangle, label: t("risksAndIssues"), path: "/risks-issues" },
    { icon: Users, label: t("assignments"), path: "/assignments" },
    { icon: MessageSquare, label: t("approvals"), path: "/approvals" },
  ];

  const isActive = (path: string) => location === path;

  const renderNavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <li key={path}>
      <Link href={path}>
        <a
          className={`flex items-center p-2 ${
            isActive(path)
              ? "text-maroon-700 bg-maroon-50 dark:bg-maroon-900/20 dark:text-maroon-200"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          } rounded-lg transition-colors duration-200`}
        >
          <Icon className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'} rtl-mirror`} />
          {!collapsed && <span>{label}</span>}
        </a>
      </Link>
    </li>
  );

  return (
    <aside 
      className={`${
        collapsed ? "w-20" : "w-64"
      } hidden md:flex flex-col bg-white dark:bg-darker shadow-lg transition-all duration-300 ease-in-out z-20 shrink-0 border-r border-gray-200 dark:border-gray-700 h-screen`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <Logo hideText={collapsed} />
        <button
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
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
          {navItems.map(renderNavItem)}

          <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            {renderNavItem({ icon: Settings, label: t("settings"), path: "/settings" })}
          </li>
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-maroon-700 text-white flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className={`${isRtl ? 'mr-3' : 'ml-3'}`}>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
