import { storage } from './storage';
import { sendApprovalReminderEmail } from './email';

/**
 * Service to handle sending reminder emails for pending approval items
 */
export class ReminderService {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private intervalHours = 24; // Default to check every 24 hours
  
  /**
   * Start the reminder service
   * @param checkIntervalHours How often to check for reminders (in hours)
   * @param runImmediately Whether to run the first check immediately
   */
  start(checkIntervalHours = 24, runImmediately = false): void {
    if (this.running) {
      console.log('Reminder service is already running');
      return;
    }
    
    this.intervalHours = checkIntervalHours;
    this.running = true;
    console.log(`Starting reminder service with ${checkIntervalHours} hour check interval`);
    
    // Convert hours to milliseconds
    const intervalMs = checkIntervalHours * 60 * 60 * 1000;
    
    if (runImmediately) {
      this.processReminders().catch(err => {
        console.error('Error processing reminders:', err);
      });
    }
    
    // Set up the interval to periodically check for reminders
    this.timer = setInterval(() => {
      this.processReminders().catch(err => {
        console.error('Error processing reminders:', err);
      });
    }, intervalMs);
  }
  
  /**
   * Stop the reminder service
   */
  stop(): void {
    if (!this.running) {
      console.log('Reminder service is not running');
      return;
    }
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.running = false;
    console.log('Reminder service stopped');
  }
  
  /**
   * Process reminders for notifications needing attention
   */
  async processReminders(): Promise<void> {
    console.log('Checking for notifications needing reminders...');
    
    try {
      // Get notifications that need reminders
      const notifications = await storage.getNotificationsNeedingReminders(this.intervalHours);
      
      if (notifications.length === 0) {
        console.log('No reminders needed at this time');
        return;
      }
      
      console.log(`Found ${notifications.length} notifications needing reminders`);
      
      // Process each notification
      for (const notification of notifications) {
        // Skip if the notification has been read since retrieved
        const freshNotification = await storage.getNotification(notification.id);
        if (!freshNotification || freshNotification.isRead) {
          continue;
        }
        
        // Get user information
        const user = await storage.getUser(notification.userId);
        if (!user || !user.email) {
          console.log(`Skipping reminder for notification ${notification.id}: user has no email`);
          continue;
        }
        
        // Calculate days waiting
        const now = new Date();
        const createdAt = notification.createdAt || now;
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get information about the related entity
        let itemType = notification.relatedEntity || 'Item';
        let itemName = `${itemType} #${notification.relatedEntityId}`;
        let entityId = notification.relatedEntityId;
        let approvalUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/approvals`;
        
        // Get more detailed information about the entity if available
        if (notification.relatedEntity === 'Project' && notification.relatedEntityId) {
          const project = await storage.getProject(notification.relatedEntityId);
          if (project) {
            itemName = project.title || itemName;
            approvalUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/approvals?type=project&id=${project.id}`;
          }
        } else if (notification.relatedEntity === 'ChangeRequest' && notification.relatedEntityId) {
          const changeRequest = await storage.getChangeRequest(notification.relatedEntityId);
          if (changeRequest) {
            itemName = changeRequest.details || itemName;
            approvalUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/approvals?type=change-request&id=${changeRequest.id}`;
          }
        }
        
        // Send the reminder email
        console.log(`Sending reminder email to ${user.email} for ${itemType} ${entityId}`);
        await sendApprovalReminderEmail(
          user.email,
          itemType.toLowerCase(),
          itemName,
          entityId || 0,
          approvalUrl,
          daysSinceCreation
        );
        
        // Update the notification's last reminder timestamp
        await storage.updateNotificationReminderSent(notification.id);
      }
      
      console.log('Reminder processing completed');
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }
}

// Create the singleton instance
export const reminderService = new ReminderService(); 