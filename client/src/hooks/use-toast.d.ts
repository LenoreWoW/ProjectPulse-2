declare module '@/hooks/use-toast' {
  export interface ToastProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    variant?: 'default' | 'destructive';
  }
  
  export interface ToastContext {
    toast: (props: ToastProps) => void;
  }
  
  export function useToast(): ToastContext;
} 