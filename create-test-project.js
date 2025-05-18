import { storage } from './server/storage.js';

async function createTestProject() {
  try {
    // Create a test project
    const project = await storage.createProject({
      title: "Test Project",
      description: "This is a test project created for testing purposes",
      client: "Test Client",
      status: "Planning",
      priority: "Medium",
      budget: 10000,
      startDate: new Date(),
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      departmentId: 1, // Assuming department ID 1 exists
      managerUserId: 1, // Assuming user ID 1 exists
      actualCost: 0
    });
    
    console.log("Test project created successfully:", project);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create test project:", error);
    process.exit(1);
  }
}

createTestProject(); 