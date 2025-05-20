import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(response: Response) {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        console.log("API Error:", errorData);
        
        // Enhanced error handling for validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorDetails = errorData.errors.map((err: any) => 
            `${err.path}: ${err.message}`
          ).join(', ');
          
          throw new Error(`${response.status}: ${errorData.message}. Details: ${errorDetails}`);
        }
        
        throw new Error(`${response.status}: ${errorData.message || 'Unknown error'}`);
      } catch (e) {
        if (e instanceof Error) {
          throw e; // Rethrow the error we just created
        }
        throw new Error(`${response.status}: Failed to parse error response`);
      }
    } else {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
  }
  return response;
}

export async function apiRequest(method: string, url: string, data?: any) {
  console.log(`Making API request: ${method} ${url}`);
  if (data) {
    console.log("Request data:", JSON.stringify(data, null, 2));
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    // Check response without trying to parse JSON first
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      console.error(`API Error: ${response.status} ${response.statusText}`);
      
      // Log headers in a simpler way to avoid Iterator compatibility issues
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.error(`Response headers:`, headers);
      
      // Only try to parse as JSON if the content type is application/json
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.error("API Error details:", errorData);
          
          // Enhanced error handling for validation errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorDetails = errorData.errors.map((err: any) => 
              `${err.path}: ${err.message}`
            ).join(', ');
            
            throw new Error(`${response.status}: ${errorData.message}. Details: ${errorDetails}`);
          }
          
          throw new Error(`${response.status}: ${errorData.message || 'Unknown error'}`);
        } catch (e) {
          if (e instanceof Error && e.message.includes(':')) {
            throw e; // Rethrow the error we just created
          }
          
          // Try to get response text as fallback
          try {
            const text = await response.clone().text();
            console.error("Response text:", text);
            throw new Error(`${response.status}: ${text || response.statusText}`);
          } catch {
            throw new Error(`${response.status}: Failed to parse error response`);
          }
        }
      } else {
        // For non-JSON responses, try to get the response text
        try {
          const text = await response.text();
          console.error("Non-JSON error response:", text);
          throw new Error(`${response.status}: ${text || response.statusText}`);
        } catch {
          // If we can't get the text, just use statusText
          throw new Error(`${response.status}: ${response.statusText}`);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetching when window regains focus
      staleTime: 1000 * 60 * 5, // 5 minutes instead of infinite
      retry: true, // Enable retries
      retryDelay: 1000, // 1 second between retries
    },
    mutations: {
      retry: true, // Enable retries for mutations
      retryDelay: 1000, // 1 second between retries
    },
  },
});
