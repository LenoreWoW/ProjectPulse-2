import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/use-auth';
import { format, startOfWeek, addDays } from 'date-fns';
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
import { Project, WeeklyUpdate } from '@shared/schema';

export function WeeklyUpdateReminder() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [updateText, setUpdateText] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  // Get current week start
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekString = format(currentWeekStart, 'yyyy-MM-dd');
  
  // Calculate due date (Friday)
  const dueDate = addDays(currentWeekStart, 5);
  const isOverdue = new Date() > dueDate;
  
  // Fetch projects managed by this user
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects/managed'],
    // Only fetch if the user is a Project Manager
    enabled: user?.role === "ProjectManager",
  });
  
  // Fetch weekly updates
  const { data: weeklyUpdates } = useQuery<WeeklyUpdate[]>({
    queryKey: ['/api/weekly-updates'],
    enabled: !!user && user.role === "ProjectManager",
  });
  
  // Check if user has already submitted weekly updates for all their projects
  const pendingUpdates = projects?.filter(project => {
    return !weeklyUpdates?.some(update => 
      update.projectId === project.id && 
      update.week === weekString
    );
  });
  
  // Handle submit update
  const handleSubmitUpdate = async () => {
    if (!selectedProject || !updateText.trim()) return;
    
    // This would be handled by a mutation in a real application
    console.log('Submitting update for project:', selectedProject, 'Text:', updateText);
    // After successful submission, you'd refetch the weekly updates
    setUpdateText('');
    setSelectedProject(null);
  };

  // If user is not a Project Manager, don't show this component
  if (!user || user.role !== "ProjectManager" || !pendingUpdates?.length) {
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
                  Overdue
                </Badge>
              )}
            </CardDescription>
          </div>
          <CalendarClock className="h-6 w-6 text-qatar-maroon" />
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <ScrollArea className="h-[220px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {pendingUpdates.map(project => (
              <AccordionItem key={project.id} value={`project-${project.id}`}>
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center text-left">
                    <div className="h-2 w-2 rounded-full bg-qatar-maroon mr-2"></div>
                    <span className="font-medium">{project.title}</span>
                    {selectedProject === project.id && (
                      <Badge variant="outline" className="ml-2 bg-qatar-maroon/10">
                        Selected
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
          <Textarea
            placeholder={t('enterWeeklyUpdate')}
            className="resize-none mb-3"
            rows={4}
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
          />
        )}
        <Button 
          className="w-full" 
          disabled={!selectedProject || !updateText.trim()}
          onClick={handleSubmitUpdate}
        >
          {t('submitUpdate')}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}