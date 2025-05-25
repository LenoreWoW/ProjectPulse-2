import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  Menu, 
  Bell
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
  const { t, isRtl } = useI18n();
  const { user } = useAuth();

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
              className={`w-64 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm rounded-lg bg-maroon-700/50 border-maroon-600 text-white placeholder:text-white text-opacity-70 focus:border-white focus:ring-white ring-opacity-30`}
            />
            <Search className={`h-5 w-5 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-white text-opacity-70`} />
          </div>
        </div>

        <div className="flex items-center">
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
        </div>
      </div>
    </header>
  );
}
