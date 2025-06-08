import { Project } from '@shared/schema';

export interface ProjectColorContext {
  project: Project;
  hasMissedWeeklyUpdate?: boolean;
  hasMissedMilestoneDeadline?: boolean;
  isOverdue?: boolean;
}

export type ProjectColorVariant = 
  | 'blue'      // Completed
  | 'red'       // Overdue  
  | 'orange'    // On hold, missed milestone deadline, missed weekly updates
  | 'green'     // In progress
  | 'purple'    // Planning
  | 'pink';     // Waiting for approval

export interface ProjectColorConfig {
  variant: ProjectColorVariant;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  lightBgClass: string;
  description: string;
}

/**
 * Determines the appropriate color variant for a project based on its status and conditions
 */
export function getProjectColorVariant(context: ProjectColorContext): ProjectColorVariant {
  const { project, hasMissedWeeklyUpdate, hasMissedMilestoneDeadline, isOverdue } = context;
  
  // Priority order for color determination:
  
  // 1. Red - Overdue projects (highest priority)
  if (isOverdue) {
    return 'red';
  }
  
  // 2. Orange - Projects with issues (second priority)
  if (project.status === 'OnHold' || hasMissedWeeklyUpdate || hasMissedMilestoneDeadline) {
    return 'orange';
  }
  
  // 3. Status-based colors (when no issues)
  switch (project.status) {
    case 'Completed':
      return 'blue';
    case 'InProgress':
      return 'green';
    case 'Planning':
      return 'purple';
    case 'Pending':
      return 'pink';
    case 'Cancelled':
      return 'red';
    default:
      return 'green'; // Default to green for unknown statuses
  }
}

/**
 * Gets the complete color configuration for a project
 */
export function getProjectColorConfig(context: ProjectColorContext): ProjectColorConfig {
  const variant = getProjectColorVariant(context);
  
  const configs: Record<ProjectColorVariant, ProjectColorConfig> = {
    blue: {
      variant: 'blue',
      bgClass: 'bg-blue-600',
      textClass: 'text-blue-600',
      borderClass: 'border-blue-500',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      lightBgClass: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Completed'
    },
    red: {
      variant: 'red',
      bgClass: 'bg-red-600',
      textClass: 'text-red-600',
      borderClass: 'border-red-500',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      lightBgClass: 'bg-red-50 dark:bg-red-900/20',
      description: 'Overdue'
    },
    orange: {
      variant: 'orange',
      bgClass: 'bg-orange-600',
      textClass: 'text-orange-600',
      borderClass: 'border-orange-500',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      lightBgClass: 'bg-orange-50 dark:bg-orange-900/20',
      description: 'Issues Detected'
    },
    green: {
      variant: 'green',
      bgClass: 'bg-green-600',
      textClass: 'text-green-600',
      borderClass: 'border-green-500',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      lightBgClass: 'bg-green-50 dark:bg-green-900/20',
      description: 'In Progress'
    },
    purple: {
      variant: 'purple',
      bgClass: 'bg-purple-600',
      textClass: 'text-purple-600',
      borderClass: 'border-purple-500',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      lightBgClass: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Planning'
    },
    pink: {
      variant: 'pink',
      bgClass: 'bg-pink-600',
      textClass: 'text-pink-600',
      borderClass: 'border-pink-500',
      badgeClass: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      lightBgClass: 'bg-pink-50 dark:bg-pink-900/20',
      description: 'Waiting for Approval'
    }
  };
  
  return configs[variant];
}

/**
 * Hook-like function to get project color information with additional checks
 */
export async function getProjectColorWithChecks(project: Project): Promise<ProjectColorConfig> {
  let hasMissedWeeklyUpdate = false;
  let hasMissedMilestoneDeadline = false;
  let isOverdue = false;
  
  try {
    // Check for missed weekly updates
    const weeklyUpdateResponse = await fetch(`/api/projects/${project.id}/missed-weekly-update`);
    if (weeklyUpdateResponse.ok) {
      const data = await weeklyUpdateResponse.json();
      hasMissedWeeklyUpdate = data.hasMissedUpdate;
    }
  } catch (error) {
    console.warn('Failed to check weekly update status:', error);
  }
  
  try {
    // Check for overdue status based on deadline
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      const today = new Date();
      isOverdue = today > deadline && project.status !== 'Completed';
    }
  } catch (error) {
    console.warn('Failed to check overdue status:', error);
  }
  
  try {
    // Check for missed milestone deadlines
    const milestonesResponse = await fetch(`/api/projects/${project.id}/milestones`);
    if (milestonesResponse.ok) {
      const milestones = await milestonesResponse.json();
      const today = new Date();
      
      hasMissedMilestoneDeadline = milestones.some((milestone: any) => {
        if (!milestone.deadline) return false;
        const deadline = new Date(milestone.deadline);
        return today > deadline && milestone.status !== 'Completed';
      });
    }
  } catch (error) {
    console.warn('Failed to check milestone deadlines:', error);
  }
  
  return getProjectColorConfig({
    project,
    hasMissedWeeklyUpdate,
    hasMissedMilestoneDeadline,
    isOverdue
  });
}

/**
 * Simpler version for immediate use without async checks (for performance)
 */
export function getProjectColorBasic(project: Project, isOverdue?: boolean): ProjectColorConfig {
  return getProjectColorConfig({
    project,
    isOverdue
  });
} 