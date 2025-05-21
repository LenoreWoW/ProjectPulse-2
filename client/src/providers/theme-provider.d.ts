declare module '@/providers/theme-provider' {
  export interface ThemeContext {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
  }
  
  export function useTheme(): ThemeContext;
} 