import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";
import { Redirect } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRoles,
  requiredPermissions,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRoles?: string[];
  requiredPermissions?: Array<keyof ReturnType<typeof usePermissions>>;
}) {
  const { user, isLoading } = useAuth();
  const permissions = usePermissions();

  // Return a Route component that will be rendered at the specified path
  return (
    <Route path={path}>
      {() => {
        // Show loading spinner while checking authentication
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-qatar-maroon" />
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check if the user has one of the required roles
        const userRole = user.role || '';
        if (requiredRoles && !requiredRoles.includes(userRole)) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/20 p-5 m-5 max-w-md">
                <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                <p className="text-red-600 dark:text-red-300">
                  You don't have permission to access this page. This page requires one of the following roles: {requiredRoles.join(', ')}.
                </p>
              </div>
            </div>
          );
        }
        
        // Check if the user has all required permissions
        if (requiredPermissions && requiredPermissions.some(perm => !permissions[perm])) {
          const missingPermissions = requiredPermissions.filter(perm => !permissions[perm]).join(', ');
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/20 p-5 m-5 max-w-md">
                <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                <p className="text-red-600 dark:text-red-300">
                  You don't have the required permissions to access this page. Missing permissions: {missingPermissions}.
                </p>
              </div>
            </div>
          );
        }

        // If authenticated and has required role, render the component
        return <Component />;
      }}
    </Route>
  );
}
