declare module '@/lib/queryClient' {
  import { QueryClient } from '@tanstack/react-query';
  
  export const queryClient: QueryClient;
  
  export function apiRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<Response>;
} 