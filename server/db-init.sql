-- Create tables based on the schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  departmentId INTEGER,
  status VARCHAR(50) DEFAULT 'Active',
  phoneNumber VARCHAR(100),
  title VARCHAR(255),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  departmentId INTEGER,
  managerUserId INTEGER,
  status VARCHAR(50) DEFAULT 'Planning',
  priority VARCHAR(50) DEFAULT 'Medium',
  startDate TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  budget NUMERIC(15, 2),
  actualCost NUMERIC(15, 2) DEFAULT 0,
  client VARCHAR(255),
  clientContactName VARCHAR(255),
  clientContactEmail VARCHAR(255),
  clientContactPhone VARCHAR(100),
  completionPercentage INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES departments(id),
  FOREIGN KEY (managerUserId) REFERENCES users(id)
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  projectId INTEGER NOT NULL,
  assignedUserId INTEGER,
  createdByUserId INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'Todo',
  priority VARCHAR(50) DEFAULT 'Medium',
  startDate TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE,
  completionPercentage INTEGER DEFAULT 0,
  hoursSpent NUMERIC(10, 2) DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (assignedUserId) REFERENCES users(id),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

-- ChangeRequests Table
CREATE TABLE IF NOT EXISTS change_requests (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  requestedByUserId INTEGER NOT NULL,
  reviewedByUserId INTEGER,
  type VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  impact TEXT,
  reviewedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (requestedByUserId) REFERENCES users(id),
  FOREIGN KEY (reviewedByUserId) REFERENCES users(id)
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  createdByUserId INTEGER NOT NULL,
  isStrategic BOOLEAN DEFAULT FALSE,
  isAnnual BOOLEAN DEFAULT TRUE,
  departmentId INTEGER,
  startDate TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'Active',
  priority VARCHAR(50) DEFAULT 'Medium',
  progress INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createdByUserId) REFERENCES users(id),
  FOREIGN KEY (departmentId) REFERENCES departments(id)
);

-- ProjectGoals Table
CREATE TABLE IF NOT EXISTS project_goals (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  goalId INTEGER NOT NULL,
  weight INTEGER DEFAULT 1,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (goalId) REFERENCES goals(id)
);

-- GoalRelationships Table
CREATE TABLE IF NOT EXISTS goal_relationships (
  id SERIAL PRIMARY KEY,
  parentGoalId INTEGER NOT NULL,
  childGoalId INTEGER NOT NULL,
  weight INTEGER DEFAULT 1,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parentGoalId) REFERENCES goals(id),
  FOREIGN KEY (childGoalId) REFERENCES goals(id)
);

-- RisksIssues Table
CREATE TABLE IF NOT EXISTS risks_issues (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  createdByUserId INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Open',
  severity VARCHAR(50) DEFAULT 'Medium',
  impact TEXT,
  mitigationPlan TEXT,
  resolvedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  relatedEntity VARCHAR(50),
  relatedEntityId INTEGER,
  requiresApproval BOOLEAN DEFAULT FALSE,
  lastReminderSent TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignedToUserId INTEGER NOT NULL,
  assignedByUserId INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  dueDate TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignedToUserId) REFERENCES users(id),
  FOREIGN KEY (assignedByUserId) REFERENCES users(id)
);

-- ActionItems Table
CREATE TABLE IF NOT EXISTS action_items (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  dueDate TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE,
  meetingId INTEGER,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- WeeklyUpdates Table
CREATE TABLE IF NOT EXISTS weekly_updates (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  createdByUserId INTEGER NOT NULL,
  weekNumber INTEGER NOT NULL,
  year INTEGER NOT NULL,
  achievements TEXT,
  challenges TEXT,
  nextSteps TEXT,
  risksIssues TEXT,
  progressSnapshot NUMERIC(5,2) DEFAULT 0,
  previousWeekProgress NUMERIC(5,2) DEFAULT 0,
  managerComment TEXT,
  submittedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

-- ProjectCostHistory Table
CREATE TABLE IF NOT EXISTS project_cost_history (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  updatedByUserId INTEGER NOT NULL,
  costAmount NUMERIC(15, 2) NOT NULL,
  description TEXT,
  costType VARCHAR(50) DEFAULT 'Actual',
  costDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (updatedByUserId) REFERENCES users(id)
);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  taskId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES tasks(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Assignment Comments Table
CREATE TABLE IF NOT EXISTS assignment_comments (
  id SERIAL PRIMARY KEY,
  assignmentId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignmentId) REFERENCES assignments(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Project Dependencies Table
CREATE TABLE IF NOT EXISTS project_dependencies (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  dependsOnProjectId INTEGER NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (dependsOnProjectId) REFERENCES projects(id)
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  createdByUserId INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'NotStarted',
  startDate TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  completionPercentage INTEGER DEFAULT 0,
  completedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

-- Task Milestones Table
CREATE TABLE IF NOT EXISTS task_milestones (
  id SERIAL PRIMARY KEY,
  taskId INTEGER NOT NULL,
  milestoneId INTEGER NOT NULL,
  weight INTEGER DEFAULT 1,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES tasks(id),
  FOREIGN KEY (milestoneId) REFERENCES milestones(id)
);

-- Sessions Table (For session storage)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_department ON users(departmentId);
CREATE INDEX IF NOT EXISTS idx_projects_department ON projects(departmentId);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(managerUserId);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignedUserId);
CREATE INDEX IF NOT EXISTS idx_change_requests_project ON change_requests(projectId);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead);
CREATE INDEX IF NOT EXISTS idx_assignments_assignee ON assignments(assignedToUserId);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Project Favorites Table
CREATE TABLE IF NOT EXISTS project_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user_id, project_id)
);

-- Project Favorites Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON project_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_project_id ON project_favorites(project_id); 