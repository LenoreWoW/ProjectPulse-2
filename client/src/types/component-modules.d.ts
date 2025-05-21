// Component modules declarations
import React from 'react';
import { ButtonProps } from './ui-components';
import { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from './ui-components';
import { FormFieldProps, FormRootProps, FormItemProps, FormLabelProps, FormControlProps, FormDescriptionProps, FormMessageProps } from './ui-components';
import { InputProps } from './ui-components';
import { SelectProps, SelectTriggerProps, SelectValueProps, SelectContentProps, SelectItemProps } from './ui-components';
import { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from './ui-components';
import { CalendarProps } from './ui-components';
import { PopoverProps, PopoverTriggerProps, PopoverContentProps } from './ui-components';
import { DialogProps, DialogTriggerProps, DialogContentProps, DialogHeaderProps, DialogFooterProps, DialogTitleProps, DialogDescriptionProps } from './ui-components';
import { ToastProps, ToastActionProps } from './ui-components';
import { SkeletonProps } from './ui-components';
import { TableProps, TableHeaderProps, TableBodyProps, TableFooterProps, TableHeadProps, TableRowProps, TableCellProps } from './ui-components';
import { SwitchProps } from './ui-components';
import { LabelProps } from './ui-components';
import { TextareaProps } from './ui-components';

// Button Component
declare module '@/components/ui/button' {
  export const Button: React.FC<ButtonProps>;
  export default Button;
}

// Card Components
declare module '@/components/ui/card' {
  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardHeaderProps>;
  export const CardTitle: React.FC<CardTitleProps>;
  export const CardDescription: React.FC<CardDescriptionProps>;
  export const CardContent: React.FC<CardContentProps>;
  export const CardFooter: React.FC<CardFooterProps>;
}

// Form Components
declare module '@/components/ui/form' {
  export const FormControl: React.FC<FormControlProps>;
  export const FormDescription: React.FC<FormDescriptionProps>;
  export const FormField: React.FC<FormFieldProps>;
  export const FormItem: React.FC<FormItemProps>;
  export const FormLabel: React.FC<FormLabelProps>;
  export const FormMessage: React.FC<FormMessageProps>;
}

declare module '@/components/ui/form-wrapper' {
  export const FormRoot: React.FC<FormRootProps>;
  export const FormField: React.FC<FormFieldProps>;
}

// Input Components
declare module '@/components/ui/input' {
  export const Input: React.FC<InputProps>;
  export default Input;
}

// Select Components
declare module '@/components/ui/select' {
  export const Select: React.FC<SelectProps>;
  export const SelectTrigger: React.FC<SelectTriggerProps>;
  export const SelectValue: React.FC<SelectValueProps>;
  export const SelectContent: React.FC<SelectContentProps>;
  export const SelectItem: React.FC<SelectItemProps>;
}

// Tabs Components
declare module '@/components/ui/tabs' {
  export const Tabs: React.FC<TabsProps>;
  export const TabsList: React.FC<TabsListProps>;
  export const TabsTrigger: React.FC<TabsTriggerProps>;
  export const TabsContent: React.FC<TabsContentProps>;
}

// Calendar Component
declare module '@/components/ui/calendar' {
  export const Calendar: React.FC<CalendarProps>;
  export default Calendar;
}

// Popover Components
declare module '@/components/ui/popover' {
  export const Popover: React.FC<PopoverProps>;
  export const PopoverTrigger: React.FC<PopoverTriggerProps>;
  export const PopoverContent: React.FC<PopoverContentProps>;
}

// Textarea Component
declare module '@/components/ui/textarea' {
  export const Textarea: React.FC<TextareaProps>;
  export default Textarea;
}

// Switch Component
declare module '@/components/ui/switch' {
  export const Switch: React.FC<SwitchProps>;
  export default Switch;
}

// Label Component
declare module '@/components/ui/label' {
  export const Label: React.FC<LabelProps>;
  export default Label;
}

// Skeleton Component
declare module '@/components/ui/skeleton' {
  export const Skeleton: React.FC<SkeletonProps>;
  export default Skeleton;
}

// Dialog Components
declare module '@/components/ui/dialog' {
  export const Dialog: React.FC<DialogProps>;
  export const DialogTrigger: React.FC<DialogTriggerProps>;
  export const DialogContent: React.FC<DialogContentProps>;
  export const DialogHeader: React.FC<DialogHeaderProps>;
  export const DialogFooter: React.FC<DialogFooterProps>;
  export const DialogTitle: React.FC<DialogTitleProps>;
  export const DialogDescription: React.FC<DialogDescriptionProps>;
}

// Table Components
declare module '@/components/ui/table' {
  export const Table: React.FC<TableProps>;
  export const TableHeader: React.FC<TableHeaderProps>;
  export const TableBody: React.FC<TableBodyProps>;
  export const TableFooter: React.FC<TableFooterProps>;
  export const TableHead: React.FC<TableHeadProps>;
  export const TableRow: React.FC<TableRowProps>;
  export const TableCell: React.FC<TableCellProps>;
}

// Toast Component
declare module '@/components/ui/toast' {
  export const Toaster: React.FC;
  export const Toast: React.FC<ToastProps>;
  export const ToastAction: React.FC<ToastActionProps>;
}

// Tooltip Component
declare module '@/components/ui/tooltip' {
  export const TooltipProvider: React.FC;
  export const Tooltip: React.FC;
  export const TooltipTrigger: React.FC;
  export const TooltipContent: React.FC;
} 