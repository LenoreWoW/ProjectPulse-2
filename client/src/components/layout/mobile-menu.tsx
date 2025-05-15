import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
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
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { t, isRtl } = useI18n();
  const { user } = useAuth();

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

  if (!isOpen) return null;

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
              {navItems.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <Link href={path}>
                    <a
                      className={`flex items-center p-2 ${
                        isActive(path)
                          ? "text-maroon-700 bg-maroon-50 dark:bg-maroon-900/20 dark:text-maroon-200"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      } rounded-lg transition-colors duration-200`}
                      onClick={onClose}
                    >
                      <Icon className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'} rtl-mirror`} />
                      <span>{label}</span>
                    </a>
                  </Link>
                </li>
              ))}

              <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/settings">
                  <a
                    className={`flex items-center p-2 ${
                      isActive("/settings")
                        ? "text-maroon-700 bg-maroon-50 dark:bg-maroon-900/20 dark:text-maroon-200"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    } rounded-lg transition-colors duration-200`}
                    onClick={onClose}
                  >
                    <Settings className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'} rtl-mirror`} />
                    <span>{t("settings")}</span>
                  </a>
                </Link>
              </li>
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
