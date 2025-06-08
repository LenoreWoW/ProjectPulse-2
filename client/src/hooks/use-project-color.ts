import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import { 
  getProjectColorConfig, 
  getProjectColorBasic,
  ProjectColorConfig,
  ProjectColorContext 
} from '@/lib/project-colors';

interface UseProjectColorOptions {
  enableAsyncChecks?: boolean;
  project: Project;
}

interface UseProjectColorReturn {
  colorConfig: ProjectColorConfig;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get project color configuration with optional async checks
 */
export function useProjectColor({ 
  project, 
  enableAsyncChecks = false 
}: UseProjectColorOptions): UseProjectColorReturn {
  const [colorConfig, setColorConfig] = useState<ProjectColorConfig>(
    getProjectColorBasic(project)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Query for missed weekly updates
  const { data: weeklyUpdateData } = useQuery<{ hasMissedUpdate: boolean }>({
    queryKey: [`/api/projects/${project.id}/missed-weekly-update`],
    enabled: enableAsyncChecks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for milestones
  const { data: milestones } = useQuery<Array<{ id: number; deadline?: string; status: string }>>({
    queryKey: [`/api/projects/${project.id}/milestones`],
    enabled: enableAsyncChecks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!enableAsyncChecks) {
      // Use basic color calculation for performance
      const isOverdue = project.deadline ? 
        new Date() > new Date(project.deadline) && project.status !== 'Completed' : 
        false;
      
      setColorConfig(getProjectColorBasic(project, isOverdue));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate comprehensive color with all checks
      let hasMissedWeeklyUpdate = false;
      let hasMissedMilestoneDeadline = false;
      let isOverdue = false;

      // Check weekly updates
      if (weeklyUpdateData) {
        hasMissedWeeklyUpdate = weeklyUpdateData.hasMissedUpdate;
      }

      // Check overdue status
      if (project.deadline) {
        const deadline = new Date(project.deadline);
        const today = new Date();
        isOverdue = today > deadline && project.status !== 'Completed';
      }

      // Check milestone deadlines
      if (milestones) {
        const today = new Date();
        hasMissedMilestoneDeadline = milestones.some((milestone: any) => {
          if (!milestone.deadline) return false;
          const deadline = new Date(milestone.deadline);
          return today > deadline && milestone.status !== 'Completed';
        });
      }

      const context: ProjectColorContext = {
        project,
        hasMissedWeeklyUpdate,
        hasMissedMilestoneDeadline,
        isOverdue
      };

      setColorConfig(getProjectColorConfig(context));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate project color'));
      // Fallback to basic color
      setColorConfig(getProjectColorBasic(project));
    } finally {
      setIsLoading(false);
    }
  }, [project, weeklyUpdateData, milestones, enableAsyncChecks]);

  return {
    colorConfig,
    isLoading,
    error
  };
}

/**
 * Simple hook for basic project colors (no async checks)
 */
export function useProjectColorBasic(project: Project): ProjectColorConfig {
  const isOverdue = project.deadline ? 
    new Date() > new Date(project.deadline) && project.status !== 'Completed' : 
    false;
    
  return getProjectColorBasic(project, isOverdue);
} 