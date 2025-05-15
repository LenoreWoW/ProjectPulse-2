import { useAuth } from "./use-auth";

type Permission = {
  // General role-based permissions
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canApproveProject: boolean;
  canManageDepartments: boolean;
  canManageUsers: boolean;
  canSubmitChangeRequest: boolean;
  canApproveChangeRequest: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canViewAllDepartments: boolean;
  canViewReports: boolean;
  canViewAnalytics: boolean;
  canAccessAdminSettings: boolean;
};

/**
 * Hook that provides permission checks based on the user's role
 * @returns Object with boolean flags for various permissions
 */
export function usePermissions(): Permission {
  const { user } = useAuth();
  
  if (!user) {
    // Return all permissions as false if not authenticated
    return {
      canCreateProject: false,
      canEditProject: false,
      canDeleteProject: false,
      canApproveProject: false,
      canManageDepartments: false,
      canManageUsers: false,
      canSubmitChangeRequest: false,
      canApproveChangeRequest: false,
      canCreateTask: false,
      canAssignTask: false,
      canViewAllDepartments: false,
      canViewReports: false,
      canViewAnalytics: false,
      canAccessAdminSettings: false,
    };
  }
  
  const role = user.role;
  
  // Base permissions object
  const permissions: Permission = {
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canApproveProject: false,
    canManageDepartments: false,
    canManageUsers: false,
    canSubmitChangeRequest: false,
    canApproveChangeRequest: false,
    canCreateTask: false,
    canAssignTask: false,
    canViewAllDepartments: false,
    canViewReports: false,
    canViewAnalytics: false,
    canAccessAdminSettings: false,
  };
  
  // Set permissions based on role
  switch (role) {
    case "Administrator":
      // Admin has all permissions
      Object.keys(permissions).forEach(key => {
        permissions[key as keyof Permission] = true;
      });
      break;
      
    case "MainPMO":
      permissions.canCreateProject = true;
      permissions.canEditProject = true;
      permissions.canDeleteProject = true;
      permissions.canApproveProject = true;
      permissions.canManageDepartments = true;
      permissions.canManageUsers = true;
      permissions.canSubmitChangeRequest = true;
      permissions.canApproveChangeRequest = true;
      permissions.canCreateTask = true;
      permissions.canAssignTask = true;
      permissions.canViewAllDepartments = true;
      permissions.canViewReports = true;
      permissions.canViewAnalytics = true;
      permissions.canAccessAdminSettings = true;
      break;
      
    case "SubPMO":
      permissions.canCreateProject = true;
      permissions.canEditProject = true;
      permissions.canApproveProject = true;
      permissions.canSubmitChangeRequest = true;
      permissions.canApproveChangeRequest = true;
      permissions.canCreateTask = true;
      permissions.canAssignTask = true;
      permissions.canViewReports = true;
      permissions.canViewAnalytics = true;
      break;
      
    case "DepartmentDirector":
      permissions.canCreateProject = true;
      permissions.canEditProject = true;
      permissions.canApproveProject = true;
      permissions.canSubmitChangeRequest = true;
      permissions.canApproveChangeRequest = true;
      permissions.canCreateTask = true;
      permissions.canAssignTask = true;
      permissions.canViewReports = true;
      permissions.canViewAnalytics = true;
      break;
      
    case "ProjectManager":
      permissions.canCreateProject = true;
      permissions.canEditProject = true;
      permissions.canSubmitChangeRequest = true;
      permissions.canCreateTask = true;
      permissions.canAssignTask = true;
      break;
      
    case "Executive":
      permissions.canApproveProject = true;
      permissions.canViewAllDepartments = true;
      permissions.canViewReports = true;
      permissions.canViewAnalytics = true;
      break;
      
    case "User":
      // Regular users have minimal permissions
      permissions.canSubmitChangeRequest = true;
      break;
  }
  
  return permissions;
}

/**
 * Higher-order component to conditionally render content based on permissions
 */
export function PermissionGate({ 
  children, 
  permission 
}: { 
  children: React.ReactNode, 
  permission: keyof Permission 
}) {
  const permissions = usePermissions();
  
  if (!permissions[permission]) {
    return null;
  }
  
  return <>{children}</>;
}