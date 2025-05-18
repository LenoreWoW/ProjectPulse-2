import { storage } from './server/storage';

async function createTestProjects() {
  try {
    // Project 1: In Progress
    const project1 = await storage.createProject({
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
    
    // Project 2: Planning Phase
    const project2 = await storage.createProject({
      title: "Radar Network Expansion",
      description: "Expanding the current radar network with 5 new stations to improve coverage of coastal areas and enhance early warning capabilities.",
      client: "QAF Technology Division",
      status: "Planning",
      priority: "Medium",
      budget: 3200000,
      startDate: new Date(2024, 5, 1), // June 1, 2024
      deadline: new Date(2025, 4, 30), // May 30, 2025
      departmentId: 3, // Technology department
      managerUserId: 6, // Technology director
      actualCost: 0
    });
    
    // Project 3: Completed
    const project3 = await storage.createProject({
      title: "Personnel Training Program",
      description: "Comprehensive training program for personnel on new communication systems and emergency protocols.",
      client: "QAF Operations",
      status: "Completed",
      priority: "Medium",
      budget: 750000,
      startDate: new Date(2023, 2, 10), // March 10, 2023
      deadline: new Date(2023, 11, 15), // December 15, 2023
      departmentId: 2, // Operations department
      managerUserId: 5, // Operations director
      actualCost: 720000
    });
    
    console.log("Test projects created successfully!");
    console.log("Project 1:", project1);
    console.log("Project 2:", project2);
    console.log("Project 3:", project3);
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to create test projects:", error);
    process.exit(1);
  }
}

createTestProjects(); 