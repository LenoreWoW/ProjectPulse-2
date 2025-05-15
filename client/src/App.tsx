import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects-page";
import CalendarPage from "@/pages/calendar-page";
import TasksPage from "@/pages/tasks-page";
import GoalsPage from "@/pages/goals-page";
import RisksIssuesPage from "@/pages/risks-issues-page";
import AssignmentsPage from "@/pages/assignments-page";
import ApprovalsPage from "@/pages/approvals-page";
import SettingsPage from "@/pages/settings-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/risks-issues" component={RisksIssuesPage} />
      <ProtectedRoute path="/assignments" component={AssignmentsPage} />
      <ProtectedRoute 
        path="/approvals" 
        component={ApprovalsPage}
        requiredRoles={["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]}
      />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // If user is not authenticated or loading, don't show the layout
  if (!user || isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-dark p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AppLayout>
        <Router />
      </AppLayout>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
