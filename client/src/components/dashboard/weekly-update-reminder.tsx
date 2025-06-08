import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/hooks/use-i18n-new';
import { useAuth } from '@/hooks/use-auth';
import { format, addDays, getISOWeek, getYear } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CalendarClock, Check, ArrowRight, Clock } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import { Project } from '@shared/schema';

interface WeeklyUpdateFormData {
  achievements: string;
  challenges: string;
  nextSteps: string;
  risksIssues: string;
  managerComment: string;
}

export function WeeklyUpdateReminder() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [formData, setFormData] = useState<WeeklyUpdateFormData>({
    achievements: '',
    challenges: '',
    nextSteps: '',
    risksIssues: '',
    managerComment: ''
  });
  
  // Calculate due date (Friday of current week)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
  const dueDate = addDays(today, daysUntilFriday);
  const isOverdue = today.getDay() === 6 || today.getDay() === 0; // Saturday or Sunday
  
  // Fetch projects that need weekly updates
  const { data: projectsNeedingUpdates, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/weekly-updates-needed'],
    enabled: user?.role === "ProjectManager",
  });

  // Create weekly update mutation
  const createWeeklyUpdateMutation = useMutation({
    mutationFn: async (data: { projectId: number; updateData: WeeklyUpdateFormData }) => {
      const response = await fetch(`/api/projects/${data.projectId}/weekly-updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create weekly update');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refetch projects needing updates
      queryClient.invalidateQueries({ queryKey: ['/api/projects/weekly-updates-needed'] });
      // Reset form
      setFormData({
        achievements: '',
        challenges: '',
        nextSteps: '',
        risksIssues: '',
        managerComment: ''
      });
      setSelectedProject(null);
    },
  });

  // Handle form field changes
  const handleFieldChange = (field: keyof WeeklyUpdateFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle submit update
  const handleSubmitUpdate = async () => {
    if (!selectedProject || !formData.managerComment.trim()) return;
    
    createWeeklyUpdateMutation.mutate({
      projectId: selectedProject,
      updateData: formData
    });
  };

  // Check if form is valid
  const isFormValid = selectedProject && formData.managerComment.trim();

  // If user is not a Project Manager or no projects need updates, don't show this component
  if (!user || user.role !== "ProjectManager" || (!isLoading && (!projectsNeedingUpdates || projectsNeedingUpdates.length === 0))) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{t('weeklyUpdateReminder')}</CardTitle>
            <CardDescription>
              {t('submissionDue')}: {format(dueDate, 'EEEE, MMMM d')}
              {isOverdue && (
                <Badge variant="destructive" className="ml-2">
                  {t('overdue')}
                </Badge>
              )}
            </CardDescription>
          </div>
          <CalendarClock className="h-6 w-6 text-qatar-maroon" />
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <ScrollArea className="h-[300px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {projectsNeedingUpdates?.map((project) => (
              <AccordionItem key={project.id} value={`project-${project.id}`}>
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center text-left">
                    <div className="h-2 w-2 rounded-full bg-qatar-maroon mr-2"></div>
                    <span className="font-medium">{project.title}</span>
                    {selectedProject === project.id && (
                      <Badge variant="outline" className="ml-2 bg-qatar-maroon/10">
                        {t('selected')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <p className="text-sm text-muted-foreground">
                      {project.description?.substring(0, 100)}{project.description && project.description.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {format(dueDate, 'EEEE, MMMM d')}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      {selectedProject === project.id ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t('selected')}
                        </>
                      ) : (
                        t('selectForUpdate')
                      )}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col pt-4">
        {selectedProject && (
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="achievements">{t('achievements')}</Label>
              <Textarea
                id="achievements"
                placeholder={t('enterAchievements')}
                className="resize-none"
                rows={2}
                value={formData.achievements}
                onChange={(e) => handleFieldChange('achievements', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="challenges">{t('challenges')}</Label>
              <Textarea
                id="challenges"
                placeholder={t('enterChallenges')}
                className="resize-none"
                rows={2}
                value={formData.challenges}
                onChange={(e) => handleFieldChange('challenges', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nextSteps">{t('nextSteps')}</Label>
              <Textarea
                id="nextSteps"
                placeholder={t('enterNextSteps')}
                className="resize-none"
                rows={2}
                value={formData.nextSteps}
                onChange={(e) => handleFieldChange('nextSteps', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="risksIssues">{t('risksIssues')}</Label>
              <Textarea
                id="risksIssues"
                placeholder={t('enterRisksIssues')}
                className="resize-none"
                rows={2}
                value={formData.risksIssues}
                onChange={(e) => handleFieldChange('risksIssues', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="managerComment">{t('managerComment')} *</Label>
              <Textarea
                id="managerComment"
                placeholder={t('enterManagerComment')}
                className="resize-none"
                rows={3}
                value={formData.managerComment}
                onChange={(e) => handleFieldChange('managerComment', e.target.value)}
              />
            </div>
          </div>
        )}
        
        <Button 
          className="w-full mt-4" 
          disabled={!isFormValid || createWeeklyUpdateMutation.isPending}
          onClick={handleSubmitUpdate}
        >
          {createWeeklyUpdateMutation.isPending ? (
            t('submitting')
          ) : (
            <>
              {t('submitUpdate')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}