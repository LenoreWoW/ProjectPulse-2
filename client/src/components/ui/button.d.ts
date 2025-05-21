import { ButtonHTMLAttributes, ReactNode } from "react";

declare module '@/components/ui/button' {
  import { ComponentPropsWithoutRef } from 'react';
  
  export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }
  
  export const Button: React.FC<ButtonProps>;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
}

declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;

export { Button }; 