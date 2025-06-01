import { storage } from "../storage";
import { RiskIssue, Task, Project } from "@shared/schema";

// Constants for risk detection
const DAYS_TO_CHECK_FOR_RISK = 7; // Number of days before deadline to create a risk
const SYSTEM_USER_ID = 1; // ID of system user for automated risks/issues

/**
 * Checks all projects and tasks for approaching or missed deadlines
 * Creates risks for approaching deadlines and issues for missed deadlines
 */
export async function checkDeadlines() {
  console.log("Running deadline risk checker job...");
  
  try {
    const currentDate = new Date();
    
    // Check projects
    await checkProjectDeadlines(currentDate);
    
    // Check tasks
    await checkTaskDeadlines(currentDate);
    
    console.log("Deadline risk checker job completed successfully");
  } catch (error) {
    console.error("Error running deadline risk checker job:", error);
  }
}

/**
 * Checks project deadlines and creates risks/issues as needed
 */
async function checkProjectDeadlines(currentDate: Date) {
  const projects = await storage.getProjects();
  
  for (const project of projects) {
    // Skip projects without deadlines or ones that are completed
    if (!project.deadline || project.status === "Completed") {
      continue;
    }
    
    const deadline = new Date(project.deadline);
    
    // Check if deadline is approaching (within DAYS_TO_CHECK_FOR_RISK days)
    const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If deadline is in the future but within the risk threshold, create a risk if none exists
    if (daysUntilDeadline > 0 && daysUntilDeadline <= DAYS_TO_CHECK_FOR_RISK) {
      await createOrUpdateDeadlineRisk(project);
      
    // If deadline has passed, convert risks to issues or create a new issue
    } else if (daysUntilDeadline <= 0) {
      await convertRiskToIssueOrCreateNew(project);
    }
  }
}

/**
 * Checks task deadlines and creates risks/issues as needed
 */
async function checkTaskDeadlines(currentDate: Date) {
  // Get all tasks by aggregating tasks from each project
  const projects = await storage.getProjects();
  let allTasks: Task[] = [];
  
  for (const project of projects) {
    const projectTasks = await storage.getTasksByProject(project.id);
    allTasks = [...allTasks, ...projectTasks];
  }
  
  for (const task of allTasks) {
    // Skip tasks without deadlines or ones that are completed
    if (!task.deadline || task.status === "Completed") {
      continue;
    }
    
    const deadline = new Date(task.deadline);
    
    // Check if deadline is approaching (within DAYS_TO_CHECK_FOR_RISK days)
    const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If deadline is in the future but within the risk threshold, create a risk if none exists
    if (daysUntilDeadline > 0 && daysUntilDeadline <= DAYS_TO_CHECK_FOR_RISK) {
      await createOrUpdateTaskDeadlineRisk(task);
      
    // If deadline has passed, convert risks to issues or create a new issue
    } else if (daysUntilDeadline <= 0) {
      await convertTaskRiskToIssueOrCreateNew(task);
    }
  }
}

/**
 * Create or update a risk for a project approaching its deadline
 */
async function createOrUpdateDeadlineRisk(project: Project) {
  // Check if a risk for this project's deadline already exists
  const risks = await storage.getRisks();
  const existingRisk = risks.find(risk => 
    risk.projectId === project.id && 
    risk.description.includes("deadline") && 
    risk.description.includes("approaching") &&
    risk.status !== "Closed" && 
    risk.status !== "Resolved"
  );
  
  // If risk exists, no need to create a new one
  if (existingRisk) {
    return;
  }
  
  // Create a new risk
  const deadlineDate = new Date(project.deadline!).toLocaleDateString();
  const riskData = {
    projectId: project.id,
    type: "Risk" as const,
    title: `Project Deadline Risk - ${project.title}`,
    description: `Project "${project.title}" is approaching its deadline (${deadlineDate})`,
    priority: "High" as const,
    status: "Open" as const,
    createdByUserId: SYSTEM_USER_ID
  };
  
  await storage.createRiskIssue(riskData);
  console.log(`Created risk for project ${project.id} - approaching deadline`);
  
  // Create notification for project manager
  await createNotification(
    project.managerUserId,
    "Project",
    project.id,
    `Your project "${project.title}" is approaching its deadline (${deadlineDate})`
  );
}

/**
 * Convert a deadline risk to an issue or create a new issue for a missed project deadline
 */
async function convertRiskToIssueOrCreateNew(project: Project) {
  // Check if there's an existing risk about the deadline
  const risks = await storage.getRisks();
  const existingRisk = risks.find(risk => 
    risk.projectId === project.id && 
    risk.description.includes("deadline") && 
    risk.description.includes("approaching") &&
    risk.status !== "Closed" && 
    risk.status !== "Resolved"
  );
  
  // Check if there's already an issue about the missed deadline
  const issues = await storage.getIssues();
  const existingIssue = issues.find(issue => 
    issue.projectId === project.id && 
    issue.description.includes("deadline") && 
    issue.description.includes("missed") &&
    issue.status !== "Closed" && 
    issue.status !== "Resolved"
  );
  
  // If an issue already exists, no need to create a new one
  if (existingIssue) {
    return;
  }
  
  const deadlineDate = new Date(project.deadline!).toLocaleDateString();
  
  // If there's an existing risk, update its type to Issue and update description
  if (existingRisk) {
    const updatedIssue = {
      ...existingRisk,
      type: "Issue" as const,
      description: `Project "${project.title}" has missed its deadline (${deadlineDate})`,
      priority: "Critical" as const
    };
    
    await storage.updateRiskIssue(existingRisk.id, updatedIssue);
    console.log(`Converted risk ${existingRisk.id} to issue for project ${project.id} - missed deadline`);
  } 
  // Otherwise create a new issue
  else {
    const issueData = {
      projectId: project.id,
      type: "Issue" as const,
      title: `Project Deadline Issue - ${project.title}`,
      description: `Project "${project.title}" has missed its deadline (${deadlineDate})`,
      priority: "Critical" as const,
      status: "Open" as const,
      createdByUserId: SYSTEM_USER_ID
    };
    
    await storage.createRiskIssue(issueData);
    console.log(`Created issue for project ${project.id} - missed deadline`);
  }
  
  // Create notification for project manager
  await createNotification(
    project.managerUserId,
    "Project",
    project.id,
    `URGENT: Your project "${project.title}" has missed its deadline (${deadlineDate})`
  );
}

/**
 * Create or update a risk for a task approaching its deadline
 */
async function createOrUpdateTaskDeadlineRisk(task: Task) {
  // Check if a risk for this task's deadline already exists
  const risks = await storage.getRisks();
  const existingRisk = risks.find(risk => 
    risk.projectId === task.projectId && 
    risk.description.includes(`Task "${task.title}"`) && 
    risk.description.includes("approaching") &&
    risk.status !== "Closed" && 
    risk.status !== "Resolved"
  );
  
  // If risk exists, no need to create a new one
  if (existingRisk) {
    return;
  }
  
  // Create a new risk
  const deadlineDate = new Date(task.deadline!).toLocaleDateString();
  const riskData = {
    projectId: task.projectId,
    type: "Risk" as const,
    title: `Task Deadline Risk - ${task.title}`,
    description: `Task "${task.title}" is approaching its deadline (${deadlineDate})`,
    priority: "Medium" as const,
    status: "Open" as const,
    createdByUserId: SYSTEM_USER_ID
  };
  
  await storage.createRiskIssue(riskData);
  console.log(`Created risk for task ${task.id} - approaching deadline`);
  
  // Create notification for task assignee
  if (task.assignedUserId) {
    await createNotification(
      task.assignedUserId,
      "Task",
      task.id,
      `Your task "${task.title}" is approaching its deadline (${deadlineDate})`
    );
  }
}

/**
 * Convert a deadline risk to an issue or create a new issue for a missed task deadline
 */
async function convertTaskRiskToIssueOrCreateNew(task: Task) {
  // Check if there's an existing risk about the deadline
  const risks = await storage.getRisks();
  const existingRisk = risks.find(risk => 
    risk.projectId === task.projectId && 
    risk.description.includes(`Task "${task.title}"`) && 
    risk.description.includes("approaching") &&
    risk.status !== "Closed" && 
    risk.status !== "Resolved"
  );
  
  // Check if there's already an issue about the missed deadline
  const issues = await storage.getIssues();
  const existingIssue = issues.find(issue => 
    issue.projectId === task.projectId && 
    issue.description.includes(`Task "${task.title}"`) && 
    issue.description.includes("missed") &&
    issue.status !== "Closed" && 
    issue.status !== "Resolved"
  );
  
  // If an issue already exists, no need to create a new one
  if (existingIssue) {
    return;
  }
  
  const deadlineDate = new Date(task.deadline!).toLocaleDateString();
  
  // If there's an existing risk, update its type to Issue
  if (existingRisk) {
    const updatedIssue = {
      ...existingRisk,
      type: "Issue" as const,
      description: `Task "${task.title}" has missed its deadline (${deadlineDate})`,
      priority: "High" as const
    };
    
    await storage.updateRiskIssue(existingRisk.id, updatedIssue);
    console.log(`Converted risk ${existingRisk.id} to issue for task ${task.id} - missed deadline`);
  } 
  // Otherwise create a new issue
  else {
    const issueData = {
      projectId: task.projectId,
      type: "Issue" as const,
      title: `Task Deadline Issue - ${task.title}`,
      description: `Task "${task.title}" has missed its deadline (${deadlineDate})`,
      priority: "High" as const,
      status: "Open" as const,
      createdByUserId: SYSTEM_USER_ID
    };
    
    await storage.createRiskIssue(issueData);
    console.log(`Created issue for task ${task.id} - missed deadline`);
  }
  
  // Create notification for task assignee
  if (task.assignedUserId) {
    await createNotification(
      task.assignedUserId,
      "Task",
      task.id,
      `URGENT: Your task "${task.title}" has missed its deadline (${deadlineDate})`
    );
  }
}

/**
 * Create a notification for a user
 */
async function createNotification(
  userId: number,
  entityType: string,
  entityId: number,
  message: string
) {
  try {
    await storage.createNotification({
      userId,
      relatedEntity: entityType,
      relatedEntityId: entityId,
      message,
      isRead: false
    });
  } catch (error) {
    console.error(`Failed to create notification for user ${userId}:`, error);
  }
} 