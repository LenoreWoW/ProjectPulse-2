import { User } from '@/lib/schema-types';
import { ReactNode } from 'react';

// Auth Hook Types
export interface AuthContext {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  register: (userData: any) => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

// i18n Hook Types
export interface I18nContext {
  t: (key: string, params?: Record<string, string>) => string;
  language: string;
  setLanguage: (language: string) => void;
}

export interface I18nProviderProps {
  children: ReactNode;
}

// Toast Hook Types
export interface ToastProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

export interface ToastContext {
  toast: (props: ToastProps) => void;
}

// Theme Hook Types
export interface ThemeContext {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  forcedTheme?: 'light' | 'dark' | null;
}

// Permissions Hook Types
export interface Permission {
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canApproveProject: boolean;
  canManageDepartments: boolean;
  canManageUsers: boolean;
  canSubmitChangeRequest: boolean;
  canApproveChangeRequest: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canViewAllDepartments: boolean;
  canViewReports: boolean;
  canViewAnalytics: boolean;
  canAccessAdminSettings: boolean;
  canEditOwnProject: boolean;
  canManageOwnProjectTasks: boolean;
  canUpdateOwnProjectCosts: boolean;
} 