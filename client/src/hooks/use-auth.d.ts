declare module '@/hooks/use-auth' {
  import { User } from '@/lib/schema-types';
  
  export interface AuthContext {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
  }
  
  export function useAuth(): AuthContext;
} 