import { ComponentPropsWithoutRef, ReactNode } from 'react';

// General UI Component Types
export type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type Size = 'default' | 'sm' | 'lg' | 'icon';

// Button
export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

// Form components
export interface FormFieldProps<T = any> {
  control: any;
  name: string;
  render: (props: { field: any }) => ReactNode;
}

export interface FormRootProps {
  form: any;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

// Input
export interface InputProps extends ComponentPropsWithoutRef<'input'> {}

// Select
export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  children: ReactNode;
}

export interface SelectTriggerProps {
  className?: string;
  children: ReactNode;
}

export interface SelectValueProps {
  placeholder?: string;
}

export interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

// Calendar
export interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from: Date; to: Date };
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
}

// Card
export interface CardProps {
  className?: string;
  children: ReactNode;
}

export interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export interface CardTitleProps {
  className?: string;
  children: ReactNode;
}

export interface CardDescriptionProps {
  className?: string;
  children: ReactNode;
}

export interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

// Tabs
export interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
  children: ReactNode;
}

export interface TabsListProps {
  className?: string;
  children: ReactNode;
}

export interface TabsTriggerProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

// Toast
export interface ToastProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

// Popover
export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export interface PopoverTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

export interface PopoverContentProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
  children: ReactNode;
} 