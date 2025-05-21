declare module '@/hooks/use-i18n-new' {
  export interface I18nContext {
    t: (key: string, params?: Record<string, string>) => string;
    language: string;
    setLanguage: (language: string) => void;
  }
  
  export function useI18n(): I18nContext;
} 