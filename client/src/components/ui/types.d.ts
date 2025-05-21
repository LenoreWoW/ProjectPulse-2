// Type declarations for UI components

// Button
import { ButtonProps } from './button';

// Calendar
import { CalendarProps } from './calendar';

// Shared types for variant props
type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';

// Ensure all components that use variant have proper types
declare module '@/components/ui/button' {
  export interface ButtonProps {
    variant?: Variant;
    size?: Size;
    asChild?: boolean;
  }
}

declare module '@/components/ui/popover' {
  export interface PopoverTriggerProps {
    asChild?: boolean;
  }
}

// React Hook Form Field prop typing
declare namespace JSX {
  interface IntrinsicAttributes {
    // Allow spreading field props
    field?: any;
    form?: any;
  }
}

// Common interfaces for form components
interface FormFieldProps {
  control?: any;
  name: string;
  render: (props: { field: any }) => React.ReactNode;
} 