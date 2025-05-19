import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import DashboardPage from "@/pages/dashboard-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailPage from "@/pages/project-detail-page";
import TasksPage from "@/pages/tasks-page";
import ReportsPage from "@/pages/reports-page";
import CustomAnalyticsPage from "@/pages/reports/custom-analytics-page";
import SettingsPage from "@/pages/settings-page";
import NotFoundPage from "@/pages/not-found-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:id",
        element: <ProjectDetailPage />,
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
      // Reports routes
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "reports/custom-analytics",
        element: <CustomAnalyticsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router; 