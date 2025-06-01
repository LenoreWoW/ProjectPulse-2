import { useAuth } from "./use-auth";

export type Permission = {
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
  
  // Project manager specific permissions for owned projects
  canEditOwnProject: boolean;
  canManageOwnProjectTasks: boolean;
  canUpdateOwnProjectCosts: boolean;
  
  // Additional permissions for goals, assignments, and risks/issues
  canCreateGoal: boolean;
  canCreateAssignment: boolean;
  canCreateRiskIssue: boolean;
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
      canEditOwnProject: false,
      canManageOwnProjectTasks: false,
      canUpdateOwnProjectCosts: false,
      canCreateGoal: false,
      canCreateAssignment: false,
      canCreateRiskIssue: false,
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
    canEditOwnProject: false,
    canManageOwnProjectTasks: false,
    canUpdateOwnProjectCosts: false,
    canCreateGoal: false,
    canCreateAssignment: false,
    canCreateRiskIssue: false,
  };
  
  // Always grant project managers control over their own projects' tasks and costs
  if (role === "ProjectManager") {
    permissions.canEditOwnProject = true;
    permissions.canManageOwnProjectTasks = true;
    permissions.canUpdateOwnProjectCosts = true;
  }
  
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
      permissions.canEditOwnProject = true;
      permissions.canManageOwnProjectTasks = true;
      permissions.canUpdateOwnProjectCosts = true;
      permissions.canCreateGoal = true;
      permissions.canCreateAssignment = true;
      permissions.canCreateRiskIssue = true;
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
      permissions.canEditOwnProject = true;
      permissions.canManageOwnProjectTasks = true;
      permissions.canUpdateOwnProjectCosts = true;
      permissions.canCreateGoal = true;
      permissions.canCreateAssignment = true;
      permissions.canCreateRiskIssue = true;
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
      permissions.canEditOwnProject = true;
      permissions.canManageOwnProjectTasks = true;
      permissions.canUpdateOwnProjectCosts = true;
      permissions.canCreateGoal = true;
      permissions.canCreateAssignment = true;
      permissions.canCreateRiskIssue = true;
      break;
      
    case "ProjectManager":
      permissions.canCreateProject = true;
      permissions.canEditProject = true;
      permissions.canSubmitChangeRequest = true;
      permissions.canCreateTask = true;
      permissions.canAssignTask = true;
      permissions.canCreateGoal = true;
      permissions.canCreateAssignment = true;
      permissions.canCreateRiskIssue = true;
      break;
      
    case "Executive":
      permissions.canApproveProject = true;
      permissions.canViewAllDepartments = true;
      permissions.canViewReports = true;
      permissions.canViewAnalytics = true;
      permissions.canCreateGoal = true;
      permissions.canCreateAssignment = true;
      permissions.canCreateRiskIssue = true;
      break;
      
    case "User":
      // Regular users have minimal permissions
      permissions.canSubmitChangeRequest = true;
      permissions.canCreateGoal = false; // Users cannot create goals
      permissions.canCreateAssignment = true;
      permissions.canCreateRiskIssue = true;
      break;
  }
  
  return permissions;
}

/**
 * Hook to check if the user has ownership of a specific project
 * @param projectId The ID of the project to check
 * @param managerId The manager ID of the project
 * @returns Boolean indicating if the user owns the project
 */
export function useProjectOwnership(projectId?: number, managerId?: number | null): boolean {
  const { user } = useAuth();
  
  if (!user || !managerId) {
    return false;
  }
  
  return user.id === managerId;
}

/**
 * Higher-order component to conditionally render content based on permissions
 */
export function PermissionGate({ 
  children, 
  permission,
  roles
}: { 
  children: React.ReactNode, 
  permission?: keyof Permission,
  roles?: string[]
}) {
  const permissions = usePermissions();
  const { user } = useAuth();
  
  // Check role-based access if roles are provided
  if (roles && user?.role) {
    if (roles.includes(user.role)) {
      return <>{children}</>;
    }
    // If roles check fails, and no permission is provided, return null
    if (!permission) {
      return null;
    }
  }
  
  // If permission is provided, check it
  if (permission && !permissions[permission]) {
    return null;
  }
  
  // If we're here, either no permission and roles were provided, 
  // or the permission check passed
  return permission ? <>{children}</> : null;
}

/**
 * Higher-order component to conditionally render content based on project ownership
 */
export function ProjectOwnershipGate({ 
  children, 
  projectId,
  managerId,
  requiredPermission
}: { 
  children: React.ReactNode, 
  projectId?: number,
  managerId?: number | null,
  requiredPermission?: keyof Permission
}) {
  const isOwner = useProjectOwnership(projectId, managerId);
  const permissions = usePermissions();
  
  // If a specific permission is required in addition to ownership
  if (requiredPermission && !permissions[requiredPermission]) {
    return null;
  }
  
  if (!isOwner) {
    return null;
  }
  
  return <>{children}</>;
}