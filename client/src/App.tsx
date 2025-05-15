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
import NewProjectPage from "@/pages/projects/new-project-page";
import CalendarPage from "@/pages/calendar-page";
import TasksPage from "@/pages/tasks-page";
import GoalsPage from "@/pages/goals-page";
import RisksIssuesPage from "@/pages/risks-issues-page";
import AssignmentsPage from "@/pages/assignments-page";
import ApprovalsPage from "@/pages/approvals-page";
import SettingsPage from "@/pages/settings-page";
import DepartmentsPage from "@/pages/departments-page";
import ReportsPage from "@/pages/reports-page";
import BudgetReportPage from "@/pages/reports/budget-page";
import RepositoryPage from "@/pages/repository-page";
import DependenciesPage from "@/pages/dependencies-page";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";
import UserPermissionsPage from "@/pages/user-permissions-page";
import { ThemeProvider } from "@/providers/theme-provider";
import { I18nProvider } from "@/hooks/use-i18n-new";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects/new" component={NewProjectPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute 
        path="/goals" 
        component={GoalsPage} 
        requiredRoles={["Administrator", "MainPMO", "SubPMO", "DepartmentDirector", "Executive", "ProjectManager"]} 
      />
      <ProtectedRoute 
        path="/goals/new" 
        component={() => <div>New Goal - Page Under Construction</div>} 
        requiredRoles={["Administrator", "MainPMO", "SubPMO", "DepartmentDirector", "Executive"]} 
      />
      <ProtectedRoute 
        path="/risks-issues" 
        component={RisksIssuesPage} 
        requiredPermissions={["canCreateProject", "canEditProject"]}
      />
      <ProtectedRoute 
        path="/risks-issues/new" 
        component={() => <div>New Risk/Issue - Page Under Construction</div>} 
        requiredPermissions={["canCreateProject", "canEditProject"]}
      />
      <ProtectedRoute path="/assignments" component={AssignmentsPage} />
      <ProtectedRoute path="/assignments/new" component={() => <div>New Assignment - Page Under Construction</div>} />
      <ProtectedRoute 
        path="/approvals" 
        component={ApprovalsPage}
        requiredPermissions={["canApproveProject", "canApproveChangeRequest"]}
      />
      <ProtectedRoute 
        path="/settings" 
        component={SettingsPage} 
        requiredPermissions={["canAccessAdminSettings"]}
      />
      <ProtectedRoute 
        path="/departments" 
        component={DepartmentsPage} 
        requiredPermissions={["canManageDepartments", "canViewAllDepartments"]}
      />
      <ProtectedRoute 
        path="/reports" 
        component={ReportsPage} 
        requiredPermissions={["canViewReports"]}
      />
      <ProtectedRoute 
        path="/reports/budget" 
        component={BudgetReportPage} 
        requiredPermissions={["canViewReports"]}
      />
      <ProtectedRoute 
        path="/reports/analytics" 
        component={AnalyticsDashboardPage} 
        requiredPermissions={["canViewAnalytics"]}
      />
      <ProtectedRoute 
        path="/repository" 
        component={RepositoryPage}
        requiredPermissions={["canViewReports"]} 
      />
      <ProtectedRoute 
        path="/dependencies" 
        component={DependenciesPage} 
        requiredPermissions={["canViewReports"]}
      />
      <ProtectedRoute 
        path="/user-permissions" 
        component={UserPermissionsPage} 
        requiredPermissions={["canManageUsers"]}
      />
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
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
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

export default App;
