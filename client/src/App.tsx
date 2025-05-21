import { useState } from "react";
import { Route, Switch, useRoute, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { I18nProvider } from "@/hooks/use-i18n-new";

// Pages
import Dashboard from "@/pages/dashboard";
import GoalsPage from "@/pages/goals-page";
import GoalDetailsPage from "@/pages/goals/goal-details-page";
import NewGoalPage from "@/pages/goals/new-goal-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailsPage from "@/pages/projects/[id]";
import NewProjectPage from "@/pages/projects/new-project-page";
import TasksPage from "@/pages/tasks-page";
import NewTaskPage from "@/pages/tasks/new-task-page";
import RisksIssuesPage from "@/pages/risks-issues-page";
import NewRiskIssuePage from "@/pages/risks-issues/new-risk-issue-page";
import DepartmentsPage from "@/pages/departments-page";
import UsersManagementPage from "@/pages/users-management-page";
import AuthPage from "@/pages/auth-page";
import ReportsPage from "@/pages/reports-page";
import DependenciesPage from "@/pages/dependencies-page";
import GoalsDependenciesPage from "@/pages/goals-dependencies-page";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";

// Components
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";

// Protected Route Component
interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ path, children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const [isMatch] = useRoute(path);
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  if (!isLoading && !user && isMatch) {
    navigate("/auth");
    return null;
  }

  // Check role-based access if requiredRoles is provided and not empty
  if (
    !isLoading &&
    user &&
    requiredRoles.length > 0 &&
    !requiredRoles.includes(user.role || "")
  ) {
    // Redirect to dashboard if user doesn't have required role
    navigate("/");
    return null;
  }

  // Render the protected route
  return <Route path={path}>{children}</Route>;
};

// App Layout Component
function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // Don't show layout if not authenticated or still loading
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-qatar-maroon"></div>
    </div>;
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

// Main Router Component
function Router() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-qatar-maroon"></div>
    </div>;
  }

  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>

      <ProtectedRoute path="/">
        <Dashboard />
      </ProtectedRoute>

      <ProtectedRoute path="/goals">
        <GoalsPage />
      </ProtectedRoute>

      <ProtectedRoute path="/goals/new">
        <NewGoalPage />
      </ProtectedRoute>

      <ProtectedRoute path="/goals/:id">
        <GoalDetailsPage />
      </ProtectedRoute>

      <ProtectedRoute path="/projects">
        <ProjectsPage />
      </ProtectedRoute>

      <ProtectedRoute path="/projects/new">
        <NewProjectPage />
      </ProtectedRoute>

      <ProtectedRoute path="/projects/:id">
        <ProjectDetailsPage />
      </ProtectedRoute>

      <ProtectedRoute path="/tasks">
        <TasksPage />
      </ProtectedRoute>

      <ProtectedRoute path="/tasks/new">
        <NewTaskPage />
      </ProtectedRoute>

      <ProtectedRoute path="/risks-issues">
        <RisksIssuesPage />
      </ProtectedRoute>

      <ProtectedRoute path="/risks-issues/new">
        <NewRiskIssuePage />
      </ProtectedRoute>

      <ProtectedRoute path="/departments" requiredRoles={["Administrator", "MainPMO", "Executive", "SubPMO"]}>
        <DepartmentsPage />
      </ProtectedRoute>

      <ProtectedRoute path="/users" requiredRoles={["Administrator", "MainPMO"]}>
        <UsersManagementPage />
      </ProtectedRoute>

      <ProtectedRoute path="/reports" requiredRoles={["Administrator", "MainPMO", "Executive", "SubPMO", "DepartmentDirector"]}>
        <ReportsPage />
      </ProtectedRoute>

      <ProtectedRoute path="/dependencies">
        <DependenciesPage />
      </ProtectedRoute>

      <ProtectedRoute path="/goals-dependencies">
        <GoalsDependenciesPage />
      </ProtectedRoute>

      <ProtectedRoute path="/settings" requiredRoles={["Administrator", "MainPMO"]}>
        <SettingsPage />
      </ProtectedRoute>

      <Route path="*">
        <NotFound />
      </Route>
    </Switch>
  );
}

// Main App Component
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" forcedTheme="dark">
      <I18nProvider>
        <TooltipProvider>
          <AppLayout>
            <Router />
          </AppLayout>
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
