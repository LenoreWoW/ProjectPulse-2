import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  Menu, 
  Moon, 
  Sun, 
  Bell, 
  User,
  LogOut
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
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { t, language, setLanguage, isRtl } = useI18n();
  const { user, logoutMutation } = useAuth();
  const [darkMode, setDarkMode] = useState(() => 
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    setLanguage(newLanguage);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white dark:bg-darker shadow-sm z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search Box */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder={t("search") + "..."}
              className={`w-64 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm rounded-lg`}
            />
            <Search className={`h-5 w-5 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-gray-400`} />
          </div>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleLanguage}
          >
            <span className="text-xs font-medium">
              {language === "en" ? "EN" : "AR"}
            </span>
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("notificationsTitle")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                <div className="py-2 px-3 text-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {t("noNotifications")}
                  </p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
