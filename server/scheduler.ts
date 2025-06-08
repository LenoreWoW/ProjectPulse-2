import { checkDeadlines } from './jobs/deadline-risk-checker';
import { checkWeeklyUpdates } from './jobs/weekly-update-checker';

/**
 * Sets up scheduled jobs for the application
 */
export function setupScheduler() {
  console.log('Setting up job scheduler...');
  
  // Schedule the deadline risk checker to run every day at midnight
  const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
  
  // Initial run after startup (with 1 minute delay)
  setTimeout(() => {
    checkDeadlines();
    checkWeeklyUpdates();
  }, 60000);
  
  // Schedule daily runs
  setInterval(() => {
    checkDeadlines();
    checkWeeklyUpdates();
  }, MILLISECONDS_IN_DAY);
  
  console.log('Job scheduler configured successfully');
} 