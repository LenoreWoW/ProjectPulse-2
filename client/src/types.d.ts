import { ComponentPropsWithoutRef, ElementRef, ReactNode, HTMLAttributes } from 'react';
import { Control, FieldValues, ControllerRenderProps, UseFormReturn } from 'react-hook-form';
import { ZodType, z } from 'zod';

declare global {
  namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      variant?: string;
      size?: string;
      asChild?: boolean;
    }
  }
}

// Extend the window interface to include global properties
declare global {
  interface Window {
    __APP_STATE__: {
      user: {
        id: number;
        name: string;
        email: string;
        roles: string[];
        departmentId?: number;
        preferredLanguage?: string;
      } | null;
    };
  }
}

// Define common shadcn UI component props
declare module '@/components/ui/button' {
  export type ButtonProps = {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  } & HTMLAttributes<HTMLButtonElement>;
  
  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
}

declare module '@/components/ui/calendar' {
  export type CalendarProps = {
    mode?: 'single' | 'multiple' | 'range';
    selected?: Date | Date[] | { from: Date; to: Date };
    onSelect?: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    initialFocus?: boolean;
  } & HTMLAttributes<HTMLDivElement>;
  
  export const Calendar: React.ForwardRefExoticComponent<
    CalendarProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module '@/components/ui/form' {
  export interface FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends string = string
  > {
    name: TName;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
    control: Control<TFieldValues>;
  }

  export const Form: {
    Root: <TFieldValues extends FieldValues = FieldValues>(
      props: { 
        form: UseFormReturn<TFieldValues>;
        children: ReactNode;
      } & HTMLAttributes<HTMLFormElement>
    ) => JSX.Element;
    Field: <
      TFieldValues extends FieldValues = FieldValues,
      TName extends string = string
    >(
      props: {
        name: TName;
        control: Control<TFieldValues>;
        children: ReactNode;
      } & HTMLAttributes<HTMLDivElement>
    ) => JSX.Element;
    Item: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
    Label: React.ForwardRefExoticComponent<HTMLAttributes<HTMLLabelElement>>;
    Control: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
    Description: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>;
    Message: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>;
  };
}

// Recharts components
declare module 'recharts' {
  export function ResponsiveContainer(props: any): JSX.Element;
  export function PieChart(props: any): JSX.Element;
  export function Pie(props: any): JSX.Element;
  export function BarChart(props: any): JSX.Element;
  export function Bar(props: any): JSX.Element;
  export function Cell(props: any): JSX.Element;
  export function XAxis(props: any): JSX.Element;
  export function YAxis(props: any): JSX.Element;
  export function CartesianGrid(props: any): JSX.Element;
  export function Tooltip(props: any): JSX.Element;
  export function Legend(props: any): JSX.Element;
  export function LineChart(props: any): JSX.Element;
  export function Line(props: any): JSX.Element;
  export function AreaChart(props: any): JSX.Element;
  export function Area(props: any): JSX.Element;
} 