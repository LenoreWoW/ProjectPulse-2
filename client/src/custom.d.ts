// Define module augmentations for UI components

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { FieldValues, UseFormReturn, Path, FieldPath } from "react-hook-form";
import { ZodObject, ZodType, ZodTypeAny } from "zod";

// Define variants for UI components
declare global {
  namespace React {
    interface HTMLAttributes<T> {
      // Add variant and size props to any HTML element
      variant?: string;
      size?: string;
      asChild?: boolean;
    }
  }
}

// You can augment specific modules
declare module '@/components/ui' {
  // Button component
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
  }

  // Calendar component
  export interface CalendarProps {
    mode?: 'single' | 'multiple' | 'range';
    selected?: Date | Date[] | { from: Date; to: Date };
    onSelect?: (date: Date | Date[] | { from: Date; to: Date } | undefined) => void;
    initialFocus?: boolean;
    className?: string;
  }

  // Popover props
  export interface PopoverTriggerProps {
    asChild?: boolean;
  }
}

// React Hook Form augmentation
declare module 'react-hook-form' {
  // Allow generic control type
  interface ControllerRenderProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  > {
    value: any;
  }

  // Enhanced controller props for shadcn components
  interface ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends Path<TFieldValues> = Path<TFieldValues>
  > {
    render: (props: {
      field: any;
      fieldState: any;
      formState: any;
    }) => React.ReactNode;
  }

  // Support for form context
  interface UseFormReturn<
    TFieldValues extends FieldValues = FieldValues,
    TContext = any,
    TTransformedValues extends FieldValues | undefined = undefined
  > {
    control: any;
  }
}

// Zod augmentation
declare module 'zod' {
  interface ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
    _type: any;
    _output: any;
    _input: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
  }

  interface ZodTypeAny {
    _output: any;
    _input: any;
  }
  
  interface ZodObject<T extends ZodRawShape, UnknownKeys extends "passthrough" | "strict" | "strip" = "strip", Catchall extends ZodTypeAny = ZodTypeAny, Output = objectOutputType<T, Catchall, UnknownKeys>, Input = objectInputType<T, Catchall, UnknownKeys>> {
    _type: any;
    _output: any;
    _input: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
  }
} 