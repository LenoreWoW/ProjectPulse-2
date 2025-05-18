import { useI18n } from "@/hooks/use-i18n-new";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";
import { Link, useLocation } from "wouter";
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
  X,
  Building,
  BarChart3,
  BookCopy,
  Network,
  LineChart,
  ShieldCheck,
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { t, isRtl } = useI18n();
  const { user } = useAuth();
  const permissions = usePermissions();

  // Common navigation items visible to all users
  const commonNavItems = [
    { icon: Home, label: t("dashboard"), path: "/" },
    { icon: Calendar, label: t("calendar"), path: "/calendar" },
    { icon: LayoutList, label: t("projects"), path: "/projects" },
    { icon: CheckSquare, label: t("tasks"), path: "/tasks" },
    { icon: Target, label: t("goals"), path: "/goals" },
    { icon: AlertTriangle, label: t("risksAndIssues"), path: "/risks-issues" },
    { icon: Users, label: t("assignments"), path: "/assignments" },
  ];

  // Permission-based navigation items
  const permissionNavItems = [
    { 
      icon: MessageSquare, 
      label: t("approvals"), 
      path: "/approvals",
      permission: "canApproveProject"
    },
    { 
      icon: Network, 
      label: t("dependencies"), 
      path: "/dependencies",
      permission: "canViewReports"
    },
    { 
      icon: BookCopy, 
      label: t("repository"), 
      path: "/repository",
      permission: "canViewReports" 
    },
    { 
      icon: BarChart3, 
      label: t("reports"), 
      path: "/reports",
      permission: "canViewReports" 
    },
    { 
      icon: LineChart, 
      label: t("analytics"), 
      path: "/reports/analytics",
      permission: "canViewAnalytics" 
    },
    { 
      icon: Building, 
      label: t("departments"), 
      path: "/departments",
      permission: "canViewAllDepartments" 
    },
    { 
      icon: ShieldCheck, 
      label: t("userPermissions"), 
      path: "/user-permissions",
      permission: "canManageUsers" 
    },
    { 
      icon: Settings, 
      label: t("settings"), 
      path: "/settings",
      permission: "canAccessAdminSettings" 
    },
  ];

  const isActive = (path: string) => location === path;

  if (!isOpen) return null;

  // Define the type for navigation items
  interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    permission?: string;
    onClick?: () => void;
  }

  // Render a navigation item
  const renderNavItem = ({ icon: Icon, label, path, onClick = onClose }: NavItem) => (
    <li key={path}>
      <Link href={path}>
        <a
          className={`flex items-center p-2 ${
            isActive(path)
              ? "text-maroon-700 bg-maroon-50 dark:bg-maroon-900/20 dark:text-maroon-200"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          } rounded-lg transition-colors duration-200`}
          onClick={onClick}
        >
          <Icon className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'} rtl-mirror`} />
          <span>{label}</span>
        </a>
      </Link>
    </li>
  );

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-30 bg-gray-900/80" 
        onClick={onClose}
      />

      {/* Mobile menu panel */}
      <div className="fixed inset-y-0 start-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <Logo />
            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {/* Common navigation items - always visible */}
              {commonNavItems.map(item => renderNavItem(item))}
              
              {/* Permission-based navigation items */}
              {permissionNavItems.map(item => (
                <PermissionGate key={item.path} permission={item.permission as keyof typeof permissions}>
                  {renderNavItem(item)}
                </PermissionGate>
              ))}
            </ul>
          </nav>

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
        </div>
      </div>
    </>
  );
}
