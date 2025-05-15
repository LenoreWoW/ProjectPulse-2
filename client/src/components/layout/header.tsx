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
    <header className="bg-qatar-maroon dark:bg-qatar-maroon shadow-md z-10 border-b border-maroon-700 dark:border-maroon-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:bg-maroon-700 dark:text-gray-200 dark:hover:bg-maroon-800"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search Box */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder={t("search") + "..."}
              className={`w-64 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm rounded-lg bg-maroon-700/50 border-maroon-600 text-white placeholder:text-white/70 focus:border-white focus:ring-white/30`}
            />
            <Search className={`h-5 w-5 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-white/70`} />
          </div>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 rounded-lg text-white hover:bg-maroon-700 dark:text-gray-200 dark:hover:bg-maroon-800 relative"
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

          {/* User Menu (Discord Style) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 rounded-lg text-white hover:bg-maroon-700 dark:text-gray-200 dark:hover:bg-maroon-800 flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden md:inline-block">{user?.name?.split(' ')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="pb-2 border-b">{user?.name}</DropdownMenuLabel>
              
              {/* User Settings Section */}
              <div className="py-1 px-1">
                <DropdownMenuItem 
                  className="flex items-center justify-between cursor-pointer rounded-md my-1 px-2 py-2 hover:bg-maroon-50 dark:hover:bg-maroon-900/20"
                  onClick={toggleDarkMode}
                >
                  <div className="flex items-center gap-2">
                    {darkMode ? (
                      <Sun className="h-4 w-4 text-maroon-600 dark:text-maroon-300" />
                    ) : (
                      <Moon className="h-4 w-4 text-maroon-600 dark:text-maroon-300" />
                    )}
                    <span>{darkMode ? t("lightMode") : t("darkMode")}</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center justify-between cursor-pointer rounded-md my-1 px-2 py-2 hover:bg-maroon-50 dark:hover:bg-maroon-900/20"
                  onClick={toggleLanguage}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center font-bold text-xs text-maroon-600 dark:text-maroon-300">
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
                  className="flex items-center cursor-pointer rounded-md my-1 px-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
