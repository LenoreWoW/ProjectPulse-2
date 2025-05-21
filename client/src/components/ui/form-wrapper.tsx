// This is a wrapper for form components to avoid TypeScript errors 
// with the react-hook-form and shadcn/ui integration

import React from 'react';
import { FormProvider, UseFormReturn, FieldValues, Controller } from 'react-hook-form';

import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

// A simplified form root component to replace Form
export function FormRoot({
  form,
  children,
  onSubmit,
  className,
  ...props
}: {
  form: any; // Use any type to avoid complex generics issues
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'>) {
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      onSubmit(e);
    } else {
      e.preventDefault();
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleFormSubmit}
        className={className}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}

// A simplified form field component
export function FormField(props: any) {
  const { control, name, render } = props;
  
  return (
    <Controller
      control={control}
      name={name}
      render={render}
    />
  );
}

// A placeholder form component that warns about using FormRoot instead
export function Form(props: any) {
  console.warn("The Form component should be replaced with FormRoot. This is a placeholder.");
  return <div>{props.children}</div>;
}

// Re-export the other form components
export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}; 