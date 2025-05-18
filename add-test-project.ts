import { storage } from './server/storage';

async function createTestProject() {
  try {
    // Create a test project
    const project = await storage.createProject({
      title: "Qatar Air Defense System",
      description: "Implementation of advanced air defense system with radar integration, missile defense capabilities, and command center operations.",
      client: "QAF Directorate",
      status: "InProgress",
      priority: "High",
      budget: 5000000,
      startDate: new Date(2023, 9, 15), // October 15, 2023
      deadline: new Date(2024, 11, 30), // December 30, 2024
      departmentId: 1, // Security department
      managerUserId: 4, // Security director
      actualCost: 2100000
    });
    
    console.log("Test project created successfully:", project);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create test project:", error);
    process.exit(1);
  }
}

createTestProject(); 