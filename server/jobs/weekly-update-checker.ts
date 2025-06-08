import { storage } from "../storage";
import { Project, WeeklyUpdate } from "@shared/schema";

// Constants for weekly update checking
const SYSTEM_USER_ID = 1; // ID of system user for automated notifications

/**
 * Checks all projects for missing weekly updates from project managers
 * Creates notifications and tracks projects that need weekly updates
 */
export async function checkWeeklyUpdates() {
  console.log("Running weekly update checker job...");
  
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 = Sunday, 4 = Thursday
    
    // Only run on Thursday (day 4) or Friday (day 5) to remind/notify
    if (currentDay === 4) {
      await sendThursdayReminders();
    } else if (currentDay === 5) {
      await checkMissedUpdatesAndNotify();
    }
    
    console.log("Weekly update checker job completed successfully");
  } catch (error) {
    console.error("Error running weekly update checker job:", error);
  }
}

/**
 * Send Thursday reminders to project managers about weekly updates
 */
async function sendThursdayReminders() {
  console.log("Sending Thursday weekly update reminders...");
  
  const projects = await storage.getProjects();
  const currentWeek = getCurrentWeekNumber();
  const currentYear = new Date().getFullYear();
  
  for (const project of projects) {
    // Skip completed, cancelled, or pending projects
    if (project.status === "Completed" || project.status === "Cancelled" || project.status === "Pending") {
      continue;
    }
    
    // Check if weekly update already exists for this week
    const existingUpdate = await getWeeklyUpdateForWeek(project.id, currentWeek, currentYear);
    
    if (!existingUpdate && project.managerUserId) {
      // Send reminder notification
      await createNotification(
        project.managerUserId,
        "Project",
        project.id,
        `Weekly update reminder: Please submit your weekly update for project "${project.title}" by end of day.`
      );
      
      console.log(`Sent Thursday reminder for project ${project.id} to manager ${project.managerUserId}`);
    }
  }
}

/**
 * Check for missed weekly updates and send notifications
 */
async function checkMissedUpdatesAndNotify() {
  console.log("Checking for missed weekly updates...");
  
  const projects = await storage.getProjects();
  const currentWeek = getCurrentWeekNumber();
  const currentYear = new Date().getFullYear();
  
  for (const project of projects) {
    // Skip completed, cancelled, or pending projects
    if (project.status === "Completed" || project.status === "Cancelled" || project.status === "Pending") {
      continue;
    }
    
    // Check if weekly update exists for this week
    const existingUpdate = await getWeeklyUpdateForWeek(project.id, currentWeek, currentYear);
    
    if (!existingUpdate && project.managerUserId) {
      // Create notification for missed update
      await createNotification(
        project.managerUserId,
        "Project",
        project.id,
        `OVERDUE: Weekly update missing for project "${project.title}". Please submit as soon as possible.`
      );
      
      // Notify department directors and PMOs about missing updates
      await notifyManagementAboutMissedUpdate(project);
      
      console.log(`Notified about missed weekly update for project ${project.id}`);
    }
  }
}

/**
 * Notify management about missed weekly updates
 */
async function notifyManagementAboutMissedUpdate(project: Project) {
  try {
    // Get users to notify (department directors, sub-PMO, main PMO)
    const users = await storage.getUsers();
    
    // Notify Department Director of the same department
    const departmentDirector = users.find(user => 
      user.role === "DepartmentDirector" && 
      user.departmentId === project.departmentId
    );
    
    if (departmentDirector) {
      await createNotification(
        departmentDirector.id,
        "Project",
        project.id,
        `Weekly update missing: Project manager has not submitted weekly update for "${project.title}".`
      );
    }
    
    // Notify Sub-PMO of the same department
    const subPMO = users.find(user => 
      user.role === "SubPMO" && 
      user.departmentId === project.departmentId
    );
    
    if (subPMO) {
      await createNotification(
        subPMO.id,
        "Project",
        project.id,
        `Weekly update missing: Project "${project.title}" in your department is missing its weekly update.`
      );
    }
    
    // Notify Main PMO
    const mainPMO = users.find(user => user.role === "MainPMO");
    if (mainPMO) {
      await createNotification(
        mainPMO.id,
        "Project",
        project.id,
        `Weekly update missing: Project "${project.title}" (${project.departmentId}) is missing its weekly update.`
      );
    }
    
  } catch (error) {
    console.error("Error notifying management about missed update:", error);
  }
}

/**
 * Get the current week number (1-52)
 */
function getCurrentWeekNumber(): number {
  const currentDate = new Date();
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (currentDate.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

/**
 * Get weekly update for a specific week
 */
async function getWeeklyUpdateForWeek(projectId: number, weekNumber: number, year: number): Promise<WeeklyUpdate | null> {
  try {
    const weeklyUpdates = await storage.getWeeklyUpdatesByProject(projectId);
    return weeklyUpdates.find(update => 
      update.weekNumber === weekNumber && 
      update.year === year
    ) || null;
  } catch (error) {
    console.error("Error getting weekly update for week:", error);
    return null;
  }
}

/**
 * Create notification helper
 */
async function createNotification(userId: number, relatedEntity: string, relatedEntityId: number, message: string) {
  try {
    await storage.createNotification({
      userId,
      message,
      relatedEntity,
      relatedEntityId,
      isRead: false,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Check if a project has missing weekly updates (for UI color logic)
 */
export async function hasProjectMissedWeeklyUpdate(projectId: number): Promise<boolean> {
  try {
    const project = await storage.getProject(projectId);
    
    // Skip completed, cancelled, or pending projects
    if (!project || project.status === "Completed" || project.status === "Cancelled" || project.status === "Pending") {
      return false;
    }
    
    const currentWeek = getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();
    const currentDay = new Date().getDay();
    
    // Only consider it "missed" if it's Friday or later and no update exists
    if (currentDay >= 5) {
      const existingUpdate = await getWeeklyUpdateForWeek(projectId, currentWeek, currentYear);
      return !existingUpdate;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking missed weekly update:", error);
    return false;
  }
} 