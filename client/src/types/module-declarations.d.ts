// UI Component module declarations
declare module '@/components/ui/button' {
  import { ButtonProps } from '../types/ui-components';
  export const Button: React.FC<ButtonProps>;
}

declare module '@/components/ui/card' {
  import { 
    CardProps, 
    CardHeaderProps, 
    CardTitleProps, 
    CardDescriptionProps, 
    CardContentProps, 
    CardFooterProps 
  } from '../types/ui-components';
  
  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardHeaderProps>;
  export const CardTitle: React.FC<CardTitleProps>;
  export const CardDescription: React.FC<CardDescriptionProps>;
  export const CardContent: React.FC<CardContentProps>;
  export const CardFooter: React.FC<CardFooterProps>;
}

declare module '@/components/ui/form-wrapper' {
  import { FormRootProps, FormFieldProps } from '../types/ui-components';
  import { ReactNode } from 'react';
  
  export const FormRoot: React.FC<FormRootProps>;
  export const FormField: React.FC<FormFieldProps>;
  export const FormItem: React.FC<{ className?: string; children: ReactNode }>;
  export const FormLabel: React.FC<{ className?: string; children: ReactNode }>;
  export const FormControl: React.FC<{ children: ReactNode }>;
  export const FormDescription: React.FC<{ className?: string; children: ReactNode }>;
  export const FormMessage: React.FC<{ className?: string; children?: ReactNode }>;
}

declare module '@/components/ui/form' {
  import { ReactNode } from 'react';
  
  export const FormItem: React.FC<{ className?: string; children: ReactNode }>;
  export const FormLabel: React.FC<{ className?: string; children: ReactNode }>;
  export const FormControl: React.FC<{ children: ReactNode }>;
  export const FormDescription: React.FC<{ className?: string; children: ReactNode }>;
  export const FormMessage: React.FC<{ className?: string; children?: ReactNode }>;
}

declare module '@/components/ui/input' {
  import { InputProps } from '../types/ui-components';
  export const Input: React.FC<InputProps>;
}

declare module '@/components/ui/select' {
  import { 
    SelectProps, 
    SelectTriggerProps, 
    SelectValueProps, 
    SelectContentProps, 
    SelectItemProps 
  } from '../types/ui-components';
  
  export const Select: React.FC<SelectProps>;
  export const SelectTrigger: React.FC<SelectTriggerProps>;
  export const SelectValue: React.FC<SelectValueProps>;
  export const SelectContent: React.FC<SelectContentProps>;
  export const SelectItem: React.FC<SelectItemProps>;
}

declare module '@/components/ui/tabs' {
  import { 
    TabsProps, 
    TabsListProps, 
    TabsTriggerProps, 
    TabsContentProps 
  } from '../types/ui-components';
  
  export const Tabs: React.FC<TabsProps>;
  export const TabsList: React.FC<TabsListProps>;
  export const TabsTrigger: React.FC<TabsTriggerProps>;
  export const TabsContent: React.FC<TabsContentProps>;
}

declare module '@/components/ui/calendar' {
  import { CalendarProps } from '../types/ui-components';
  export const Calendar: React.FC<CalendarProps>;
}

declare module '@/components/ui/popover' {
  import { 
    PopoverProps, 
    PopoverTriggerProps, 
    PopoverContentProps 
  } from '../types/ui-components';
  
  export const Popover: React.FC<PopoverProps>;
  export const PopoverTrigger: React.FC<PopoverTriggerProps>;
  export const PopoverContent: React.FC<PopoverContentProps>;
}

declare module '@/components/ui/textarea' {
  import { ComponentPropsWithoutRef } from 'react';
  export const Textarea: React.FC<ComponentPropsWithoutRef<'textarea'>>;
}

declare module '@/components/ui/switch' {
  import { ComponentPropsWithoutRef } from 'react';
  export const Switch: React.FC<ComponentPropsWithoutRef<'button'> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }>;
}

declare module '@/components/ui/label' {
  import { ComponentPropsWithoutRef } from 'react';
  export const Label: React.FC<ComponentPropsWithoutRef<'label'>>;
}

declare module '@/components/ui/skeleton' {
  import { ReactNode } from 'react';
  export const Skeleton: React.FC<{ className?: string; children?: ReactNode }>;
}

declare module '@/components/ui/dialog' {
  import { ReactNode } from 'react';
  
  export const Dialog: React.FC<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
  }>;
  
  export const DialogTrigger: React.FC<{ asChild?: boolean; children: ReactNode }>;
  export const DialogContent: React.FC<{ className?: string; children: ReactNode }>;
  export const DialogHeader: React.FC<{ className?: string; children: ReactNode }>;
  export const DialogTitle: React.FC<{ className?: string; children: ReactNode }>;
  export const DialogDescription: React.FC<{ className?: string; children: ReactNode }>;
  export const DialogFooter: React.FC<{ className?: string; children: ReactNode }>;
}

declare module '@/components/ui/table' {
  import { ReactNode } from 'react';
  
  export const Table: React.FC<{ className?: string; children: ReactNode }>;
  export const TableHeader: React.FC<{ className?: string; children: ReactNode }>;
  export const TableBody: React.FC<{ className?: string; children: ReactNode }>;
  export const TableFooter: React.FC<{ className?: string; children: ReactNode }>;
  export const TableHead: React.FC<{ className?: string; children: ReactNode }>;
  export const TableRow: React.FC<{ className?: string; children: ReactNode }>;
  export const TableCell: React.FC<{ className?: string; children: ReactNode }>;
}

declare module '@/components/ui/toaster' {
  export const Toaster: React.FC;
}

declare module '@/components/ui/tooltip' {
  import { ReactNode } from 'react';
  export const TooltipProvider: React.FC<{ children: ReactNode }>;
}

// Hook module declarations
declare module '@/hooks/use-i18n-new' {
  import { I18nContext, I18nProviderProps } from '../types/hooks';
  export function useI18n(): I18nContext;
  export const I18nProvider: React.FC<I18nProviderProps>;
}

declare module '@/hooks/use-auth' {
  import { AuthContext, AuthProviderProps } from '../types/hooks';
  export function useAuth(): AuthContext;
  export const AuthProvider: React.FC<AuthProviderProps>;
}

declare module '@/hooks/use-toast' {
  import { ToastContext, ToastProps } from '../types/hooks';
  export function useToast(): ToastContext;
}

declare module '@/providers/theme-provider' {
  import { ThemeContext, ThemeProviderProps } from '../types/hooks';
  export function useTheme(): ThemeContext;
  export const ThemeProvider: React.FC<ThemeProviderProps>;
}

declare module '@/lib/queryClient' {
  import { QueryClient } from '@tanstack/react-query';
  
  export const queryClient: QueryClient;
  
  export function apiRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<Response>;
}

declare module '@/lib/utils' {
  export function cn(...inputs: (string | undefined | null | boolean)[]): string;
} 