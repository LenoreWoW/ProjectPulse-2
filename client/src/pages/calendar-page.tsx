import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { Project, Task, Assignment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  LayoutGrid,
  List
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Event interfaces
interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'project' | 'task' | 'assignment';
  status: string;
  priority: string;
}

export default function CalendarPage() {
  const { t } = useI18n();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  
  // Fetch data
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<{
    assignedToMe: Assignment[];
    assignedByMe: Assignment[];
  }>({
    queryKey: ["/api/assignments"],
  });
  
  const isLoading = isLoadingProjects || isLoadingTasks || isLoadingAssignments;
  
  // Combine all events
  const getEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    
    // Add project deadlines
    if (projects) {
      projects.forEach(project => {
        if (project.deadline) {
          events.push({
            id: project.id,
            title: project.title,
            date: new Date(project.deadline),
            type: 'project',
            status: project.status,
            priority: project.priority
          });
        }
      });
    }
    
    // Add task deadlines
    if (tasks) {
      const allTasks = [...(tasks.assignedToMe || []), ...(tasks.assignedByMe || [])];
      allTasks.forEach(task => {
        if (task.deadline) {
          events.push({
            id: task.id,
            title: task.title,
            date: new Date(task.deadline),
            type: 'task',
            status: task.status,
            priority: task.priority
          });
        }
      });
    }
    
    // Add assignment deadlines
    if (assignments) {
      const allAssignments = [...(assignments.assignedToMe || []), ...(assignments.assignedByMe || [])];
      allAssignments.forEach(assignment => {
        if (assignment.deadline) {
          events.push({
            id: assignment.id,
            title: assignment.title,
            date: new Date(assignment.deadline),
            type: 'assignment',
            status: assignment.status,
            priority: assignment.priority
          });
        }
      });
    }
    
    return events;
  };
  
  const events = getEvents();
  
  // Filter events for current view
  const getFilteredEvents = () => {
    if (view === "month") {
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear();
      });
    } else if (view === "week") {
      // Get start and end of week
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday as start of week
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      });
    } else {
      // Day view
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      });
    }
  };
  
  const filteredEvents = getFilteredEvents();
  
  // Navigation functions
  const goToToday = () => setDate(new Date());
  
  const goToPrevious = () => {
    const newDate = new Date(date);
    if (view === "month") {
      newDate.setMonth(date.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(date.getDate() - 7);
    } else {
      newDate.setDate(date.getDate() - 1);
    }
    setDate(newDate);
  };
  
  const goToNext = () => {
    const newDate = new Date(date);
    if (view === "month") {
      newDate.setMonth(date.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(date.getDate() + 7);
    } else {
      newDate.setDate(date.getDate() + 1);
    }
    setDate(newDate);
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (view === "month") {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    } else if (view === "week") {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(startOfWeek)} - ${new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(endOfWeek)}`;
    } else {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    }
  };
  
  // Get color for event type
  const getEventColor = (type: string, priority: string) => {
    // Base color on type and adjust intensity based on priority
    if (type === 'project') {
      return priority === 'High' ? 'bg-maroon-700 text-white' :
             priority === 'Medium' ? 'bg-maroon-500 text-white' :
             'bg-maroon-300 text-white';
    } else if (type === 'task') {
      return priority === 'High' ? 'bg-blue-700 text-white' :
             priority === 'Medium' ? 'bg-blue-500 text-white' :
             'bg-blue-300 text-white';
    } else {
      return priority === 'High' ? 'bg-green-700 text-white' :
             priority === 'Medium' ? 'bg-green-500 text-white' :
             'bg-green-300 text-white';
    }
  };
  
  // Get indicator dots for calendar day
  const getDayIndicator = (day: Date) => {
    const eventsOnDay = events.filter(event => 
      event.date.getDate() === day.getDate() &&
      event.date.getMonth() === day.getMonth() &&
      event.date.getFullYear() === day.getFullYear()
    );
    
    if (eventsOnDay.length === 0) return null;
    
    // Return a colored dot for each event type present on this day
    const hasProject = eventsOnDay.some(e => e.type === 'project');
    const hasTask = eventsOnDay.some(e => e.type === 'task');
    const hasAssignment = eventsOnDay.some(e => e.type === 'assignment');
    
    return (
      <div className="flex justify-center space-x-1 mt-1">
        {hasProject && <div className="w-1.5 h-1.5 rounded-full bg-maroon-500"></div>}
        {hasTask && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
        {hasAssignment && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
      </div>
    );
  };
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("calendar")}</h1>
      </div>
      
      {/* Calendar Controls */}
      <div className="bg-white dark:bg-darker shadow rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={goToToday}
            >
              {t("today")}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">{formatDateRange()}</h2>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("month")}
              className={view === "month" ? "bg-maroon-700 hover:bg-maroon-800" : ""}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {t("month")}
            </Button>
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
              className={view === "week" ? "bg-maroon-700 hover:bg-maroon-800" : ""}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              {t("week")}
            </Button>
            <Button
              variant={view === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("day")}
              className={view === "day" ? "bg-maroon-700 hover:bg-maroon-800" : ""}
            >
              <List className="mr-2 h-4 w-4" />
              {t("day")}
            </Button>
          </div>
        </div>
        
        <Tabs value={view}>
          <TabsContent value="month" className="mt-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
              components={{
                DayContent: (props) => (
                  <div>
                    <div>{props.day.day}</div>
                    {getDayIndicator(props.day.date)}
                  </div>
                ),
              }}
            />
          </TabsContent>
          
          <TabsContent value="week" className="mt-0">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const dayDate = new Date(date);
                const startOfWeek = new Date(dayDate.setDate(dayDate.getDate() - dayDate.getDay()));
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + i);
                
                const isToday = 
                  currentDay.getDate() === new Date().getDate() &&
                  currentDay.getMonth() === new Date().getMonth() &&
                  currentDay.getFullYear() === new Date().getFullYear();
                
                const dayEvents = events.filter(event => 
                  event.date.getDate() === currentDay.getDate() &&
                  event.date.getMonth() === currentDay.getMonth() &&
                  event.date.getFullYear() === currentDay.getFullYear()
                );
                
                return (
                  <div key={i} className="min-h-[150px]">
                    <div className={`p-2 text-center ${isToday ? 'bg-maroon-100 dark:bg-maroon-900/20 rounded-t-lg' : 'bg-gray-100 dark:bg-gray-800 rounded-t-lg'}`}>
                      <div className="font-semibold">
                        {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDay)}
                      </div>
                      <div className={`text-lg ${isToday ? 'bg-maroon-700 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                        {currentDay.getDate()}
                      </div>
                    </div>
                    <div className="border border-t-0 rounded-b-lg p-1 space-y-1 h-[100px] overflow-y-auto">
                      {dayEvents.map((event) => (
                        <div 
                          key={`${event.type}-${event.id}`}
                          className={`px-2 py-1 text-xs rounded truncate ${getEventColor(event.type, event.priority)}`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="day" className="mt-0">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">
                {new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)}
              </h3>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t("noEventsToday")}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <div 
                      key={`${event.type}-${event.id}`}
                      className={`p-3 rounded-lg ${getEventColor(event.type, event.priority)}`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{event.title}</h4>
                        <span className="text-xs uppercase px-2 py-0.5 bg-black/20 rounded-full">
                          {event.type}
                        </span>
                      </div>
                      <div className="text-sm mt-1 opacity-80">
                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(event.date)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Legend */}
      <div className="bg-white dark:bg-darker shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-medium mb-3">{t("legend")}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-maroon-500 mr-2"></div>
            <span>{t("projectDeadlines")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
            <span>{t("taskDeadlines")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span>{t("assignmentDeadlines")}</span>
          </div>
        </div>
      </div>
    </>
  );
}
