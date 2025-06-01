import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
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
import { formatDate } from "date-fns";

// Event interfaces
interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'project' | 'task' | 'assignment';
  status?: string | null;
  priority?: string | null;
}

export default function CalendarPage() {
  const { t } = useI18n();
  const [date, setDate] = useState<Date | undefined>(new Date());
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
        if (project.endDate) {
          events.push({
            id: project.id,
            title: project.title || 'Unnamed Project',
            date: new Date(project.endDate),
            type: 'project',
            status: project.status || 'Unknown',
            priority: project.priority || 'Medium'
          });
        }
      });
    }
    
    // Add task deadlines
    if (tasks) {
      // Create an array of all tasks (casting to ensure type safety)
      const allTasks = Array.isArray(tasks) ? tasks : [];
      allTasks.forEach(task => {
        if (task.deadline) {
          events.push({
            id: task.id,
            title: task.title || 'Unnamed Task',
            date: new Date(task.deadline),
            type: 'task',
            status: task.status || 'Unknown',
            priority: task.priority || 'Medium'
          });
        }
      });
    }
    
    // Add assignment deadlines
    if (assignments) {
      // Create an array of all assignments (casting to ensure type safety)
      const allAssignments = Array.isArray(assignments) ? assignments : [];
      allAssignments.forEach(assignment => {
        if (assignment.deadline) {
          events.push({
            id: assignment.id,
            title: assignment.title || 'Unnamed Assignment',
            date: new Date(assignment.deadline),
            type: 'assignment',
            status: assignment.status || 'Unknown', 
            priority: assignment.priority || 'Medium'
          });
        }
      });
    }
    
    return events;
  };
  
  const events = getEvents();
  
  // Filter events for current view
  const getFilteredEvents = () => {
    if (!date) return [];
    
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
    if (!date) return;
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
    if (!date) return;
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
    if (!date) return '';
    
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
  const getEventColor = (type: string | null | undefined, priority: string | null | undefined) => {
    if (!type) type = 'task';
    if (!priority) priority = 'Medium';
    // Base color on type and adjust intensity based on priority
    if (type === 'project') {
      return priority === 'High' ? 'bg-red-600 text-white' :
             priority === 'Medium' ? 'bg-red-500 text-white' :
             'bg-red-400 text-white';
    } else if (type === 'task') {
      return priority === 'High' ? 'bg-blue-600 text-white' :
             priority === 'Medium' ? 'bg-blue-500 text-white' :
             'bg-blue-400 text-white';
    } else {
      return priority === 'High' ? 'bg-green-600 text-white' :
             priority === 'Medium' ? 'bg-green-500 text-white' :
             'bg-green-400 text-white';
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
        {hasProject && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
        {hasTask && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
        {hasAssignment && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-contrast dark:text-white mb-2">
            {t("calendar")}
          </h1>
        </div>
      </div>
      
      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
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
                today
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-foreground ml-4">{formatDateRange()}</h2>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
                className={view === "month" ? "bg-primary text-primary-foreground" : ""}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                month
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
                className={view === "week" ? "bg-primary text-primary-foreground" : ""}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                week
              </Button>
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("day")}
                className={view === "day" ? "bg-primary text-primary-foreground" : ""}
              >
                <List className="mr-2 h-4 w-4" />
                day
              </Button>
            </div>
          </div>
          
          <Tabs value={view} className="w-full">
            <TabsContent value="month" className="mt-0">
              <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px] justify-center">
                {/* Calendar Section - Centered */}
                <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border shadow"
                  />
                </div>
                
                {/* Events Section - Right Side */}
                <div className="flex-1 border rounded-md shadow p-4 bg-card min-h-[400px] lg:min-h-0 max-w-md">
                  <div className="h-full flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {date ? formatDate(date, "EEEE, MMMM d, yyyy") : "Select a date"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Events and activities for the selected day
                      </p>
                    </div>
                    
                    <div className="flex-1 overflow-auto space-y-4">
                      {date && (() => {
                        const dayEvents = getFilteredEvents().filter(event => 
                          event.date.toDateString() === date.toDateString()
                        );
                        
                        const projects = dayEvents.filter(e => e.type === 'project');
                        const tasks = dayEvents.filter(e => e.type === 'task');
                        const assignments = dayEvents.filter(e => e.type === 'assignment');
                        
                        if (dayEvents.length === 0) {
                          return (
                            <div className="flex items-center justify-center h-32 text-muted-foreground">
                              <div className="text-center">
                                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No events scheduled for this day</p>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-6">
                            {/* Projects Section */}
                            {projects.length > 0 && (
                              <div>
                                <h4 className="text-md font-medium text-foreground mb-3 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  Projects ({projects.length})
                                </h4>
                                <div className="space-y-2">
                                  {projects.map((event, index) => (
                                    <div key={`project-${index}`} className="p-3 border rounded-lg bg-red-50 border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-red-900 truncate">{event.title}</h5>
                                          {event.status && (
                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 mt-1">
                                              {event.status}
                                            </span>
                                          )}
                                        </div>
                                        {event.priority && (
                                          <span className={`px-2 py-1 text-xs rounded-full ml-2 flex-shrink-0 ${
                                            event.priority === 'High' ? 'bg-red-200 text-red-800' :
                                            event.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                          }`}>
                                            {event.priority}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Tasks Section */}
                            {tasks.length > 0 && (
                              <div>
                                <h4 className="text-md font-medium text-foreground mb-3 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  Tasks ({tasks.length})
                                </h4>
                                <div className="space-y-2">
                                  {tasks.map((event, index) => (
                                    <div key={`task-${index}`} className="p-3 border rounded-lg bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-blue-900 truncate">{event.title}</h5>
                                          {event.status && (
                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 mt-1">
                                              {event.status}
                                            </span>
                                          )}
                                        </div>
                                        {event.priority && (
                                          <span className={`px-2 py-1 text-xs rounded-full ml-2 flex-shrink-0 ${
                                            event.priority === 'High' ? 'bg-red-200 text-red-800' :
                                            event.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                          }`}>
                                            {event.priority}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Assignments Section */}
                            {assignments.length > 0 && (
                              <div>
                                <h4 className="text-md font-medium text-foreground mb-3 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  Assignments ({assignments.length})
                                </h4>
                                <div className="space-y-2">
                                  {assignments.map((event, index) => (
                                    <div key={`assignment-${index}`} className="p-3 border rounded-lg bg-green-50 border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-green-900 truncate">{event.title}</h5>
                                          {event.status && (
                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 mt-1">
                                              {event.status}
                                            </span>
                                          )}
                                        </div>
                                        {event.priority && (
                                          <span className={`px-2 py-1 text-xs rounded-full ml-2 flex-shrink-0 ${
                                            event.priority === 'High' ? 'bg-red-200 text-red-800' :
                                            event.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                          }`}>
                                            {event.priority}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="week" className="mt-0">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  if (!date) return null;
                  
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
                    <div key={i} className="min-h-[150px] border rounded-lg overflow-hidden">
                      <div className={`p-2 text-center border-b ${isToday ? 'bg-primary/10' : 'bg-muted'}`}>
                        <div className="font-semibold text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDay)}
                        </div>
                        <div className={`text-lg font-medium ${isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1' : 'text-foreground'}`}>
                          {currentDay.getDate()}
                        </div>
                      </div>
                      <div className="p-1 space-y-1 h-[100px] overflow-y-auto">
                        {dayEvents.map((event) => (
                          <div 
                            key={`${event.type}-${event.id}`}
                            className={`px-2 py-1 text-xs rounded truncate ${getEventColor(event.type, event.priority)}`}
                            title={event.title}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {date && new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No events today
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.map((event) => (
                        <div 
                          key={`${event.type}-${event.id}`}
                          className={`p-4 rounded-lg ${getEventColor(event.type, event.priority)}`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-lg">{event.title}</h4>
                            <span className="text-xs uppercase px-2 py-1 bg-black bg-opacity-20 rounded-full">
                              {event.type}
                            </span>
                          </div>
                          <div className="text-sm mt-2 opacity-90">
                            {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(event.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("legend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-foreground">Projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-foreground">Tasks</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-foreground">Assignments</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
