// Project CSV Import Script for ProjectPulse
// This script imports projects from a CSV file into the ProjectPulse database

import fs from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

// Constants
const CSV_FILE_PATH = process.argv[2] || 'Projects.csv';
const DEFAULT_PASSWORD = 'ProjectPulse@2023';
const SALT_ROUNDS = 10;
const SIGNAL_CORPS_DEPT_ID = 1; // Assuming Signal Corps department has ID 1

// Set up PostgreSQL connection
const { Pool } = pg;
let pool;
let client;

// Constants for user roles
const ROLES = {
  PROJECT_MANAGER: 'ProjectManager',
  ADMIN: 'Administrator',
  VIEWER: 'Viewer'
};

// Common CSV field variations
const FIELD_MAPPINGS = {
  PROJECT_NAME: ['PROJECT NAME', 'PROJECT_NAME', 'PROJECTNAME', 'Name', 'NAME', 'Title', 'TITLE'],
  ARABIC_NAME: ['ARABIC NAME', 'ARABIC_NAME', 'ARABICNAME', 'Arabic', 'ARABIC'],
  PROJECT_OFFICER: ['PROJECT OFFICER', 'PROJECT_OFFICER', 'PROJECTOFFICER', 'Officer', 'OFFICER', 'Manager', 'MANAGER'],
  CONTRACT_NO: ['CONTRACT NO', 'CONTRACT_NO', 'CONTRACTNO', 'Contract', 'CONTRACT'],
  START_DATE: ['START DATE', 'START_DATE', 'STARTDATE', 'Start', 'START'],
  END_DATE: ['END DATE', 'END_DATE', 'ENDDATE', 'End', 'END', 'Deadline', 'DEADLINE'],
  BUDGET: ['BUDGET IN QAR', 'BUDGET_IN_QAR', 'BUDGET', 'Budget', 'BUDGETINQAR'],
  AMOUNT_PAID: ['AMOUNT PAID', 'AMOUNT_PAID', 'AMOUNTPAID', 'Paid', 'PAID'],
  STATUS: ['STATUS', 'Status', 'State', 'STATE']
};

// Initialize the script
async function init() {
  try {
    // Create a connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 
        'postgresql://postgres:postgres@localhost:5432/projectpulse',
    });
    
    // Acquire a client from the pool for transaction support
    client = await pool.connect();
    
    // Check if connected
    const testResult = await client.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
    
    return true;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    return false;
  }
}

// Generate a password hash
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Find a user by email
async function findUserByEmail(email) {
  try {
    // Get available columns in the users table
    const availableColumnsResult = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    );
    
    const availableColumns = availableColumnsResult.rows.map(row => row.column_name.toLowerCase());
    
    // Determine which columns to retrieve
    const columnsToReturn = ['id'];
    if (availableColumns.includes('name')) columnsToReturn.push('name');
    else if (availableColumns.includes('fullname')) columnsToReturn.push('fullname as name');
    else if (availableColumns.includes('full_name')) columnsToReturn.push('full_name as name');
    
    if (availableColumns.includes('email')) columnsToReturn.push('email');
    if (availableColumns.includes('role')) columnsToReturn.push('role');
    
    // Build and execute the query
    const query = `SELECT ${columnsToReturn.join(', ')} FROM users WHERE email = $1`;
    const result = await client.query(query, [email]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error finding user by email ${email}:`, error);
    return null;
  }
}

// Create a new user
async function createUser(email, name, role) {
  try {
    // Generate username from email
    const username = email.split('@')[0];
    
    // Generate a random password
    const password = await hashPassword(DEFAULT_PASSWORD);
    
    // Get available columns in the users table
    const availableColumnsResult = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    );
    
    const availableColumns = availableColumnsResult.rows.map(row => row.column_name.toLowerCase());
    console.log('Available columns in users table:', availableColumns);
    
    // Build column list and value list dynamically
    const columns = [];
    const placeholders = [];
    const values = [];
    let paramCounter = 1;
    
    // Map common field names to their possible database column names
    const nameColumn = availableColumns.includes('name') ? 'name' : 
                       availableColumns.includes('fullname') ? 'fullname' :
                       availableColumns.includes('full_name') ? 'full_name' : null;
                       
    if (nameColumn) {
      columns.push(nameColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(name);
    }
    
    if (availableColumns.includes('email')) {
      columns.push('email');
      placeholders.push(`$${paramCounter++}`);
      values.push(email);
    }
    
    if (availableColumns.includes('username')) {
      columns.push('username');
      placeholders.push(`$${paramCounter++}`);
      values.push(username);
    }
    
    if (availableColumns.includes('password')) {
      columns.push('password');
      placeholders.push(`$${paramCounter++}`);
      values.push(password);
    }
    
    if (availableColumns.includes('role')) {
      columns.push('role');
      placeholders.push(`$${paramCounter++}`);
      values.push(role);
    }
    
    // Add department ID only if the column exists
    if (availableColumns.includes('departmentid')) {
      columns.push('departmentid');
      placeholders.push(`$${paramCounter++}`);
      values.push(SIGNAL_CORPS_DEPT_ID); // Signal Corps department
    }
    
    // Add timestamps if they exist
    if (availableColumns.includes('createdat')) {
      columns.push('createdat');
      placeholders.push(`$${paramCounter++}`);
      values.push(new Date());
    }
    
    if (availableColumns.includes('updatedat')) {
      columns.push('updatedat');
      placeholders.push(`$${paramCounter++}`);
      values.push(new Date());
    }
    
    // Construct return fields
    const returnFields = ['id'];
    if (nameColumn) returnFields.push(nameColumn + ' as name');
    if (availableColumns.includes('email')) returnFields.push('email');
    if (availableColumns.includes('role')) returnFields.push('role');
    
    // Execute the query
    const query = `
      INSERT INTO users (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${returnFields.join(', ')}
    `;
    
    console.log('Executing query:', query);
    
    const result = await client.query(query, values);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`Created new user: ${name} (${user.id}) with role ${role}`);
      return user;
    } else {
      throw new Error('No rows returned from user insertion');
    }
  } catch (error) {
    console.error(`Failed to create user ${name}:`, error);
    throw error;
  }
}

// Check if a project exists by name
async function findProjectByName(name) {
  try {
    // Get available columns in the projects table
    const availableColumnsResult = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"
    );
    
    const availableColumns = availableColumnsResult.rows.map(row => row.column_name.toLowerCase());
    
    // Determine title column name (title, name, etc.)
    const titleColumn = availableColumns.includes('title') ? 'title' : 
                        availableColumns.includes('name') ? 'name' : null;
    
    if (!titleColumn) {
      throw new Error('Could not determine project title column name');
    }
    
    // Build query with available columns
    const columnsToReturn = ['id'];
    columnsToReturn.push(`${titleColumn} as title`);
    
    if (availableColumns.includes('status')) columnsToReturn.push('status');
    
    const query = `
      SELECT ${columnsToReturn.join(', ')} 
      FROM projects 
      WHERE ${titleColumn} ILIKE $1
    `;
    
    const result = await client.query(query, [`%${name}%`]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error finding project by name ${name}:`, error);
    return null;
  }
}

// Create a new project
async function createProject(projectData, projectOfficer) {
  try {
    // Get available columns in the projects table
    const availableColumnsResult = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"
    );
    
    const availableColumns = availableColumnsResult.rows.map(row => row.column_name.toLowerCase());
    console.log('Available columns in projects table:', availableColumns);
    
    // Build the column list and placeholders dynamically based on available columns
    const columns = [];
    const placeholders = [];
    const values = [];
    let paramCounter = 1;
    
    // Map common field names to their database column equivalents
    const fieldMapping = {
      title: ['title', 'name', 'project_name', 'projectname'],
      description: ['description', 'desc', 'project_description', 'projectdescription'],
      status: ['status', 'project_status', 'projectstatus'],
      priority: ['priority', 'project_priority', 'projectpriority'],
      manageruserid: ['manageruserid', 'manager_user_id', 'project_manager_id', 'managerId'],
      departmentid: ['departmentid', 'department_id', 'dept_id'],
      startdate: ['startdate', 'start_date', 'projectstart', 'project_start', 'startDateTime'],
      enddate: ['enddate', 'end_date', 'projectend', 'project_end', 'endDateTime']
    };
    
    // Helper function to find the matching column in the database
    const findMatchingColumn = (fieldOptions) => {
      return availableColumns.find(col => fieldOptions.includes(col));
    };
    
    // Add title
    const titleColumn = findMatchingColumn(fieldMapping.title);
    if (titleColumn) {
      columns.push(titleColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(projectData.title || projectData.project_name || '');
    }
    
    // Add description
    const descriptionColumn = findMatchingColumn(fieldMapping.description);
    if (descriptionColumn) {
      columns.push(descriptionColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(formatDescription(projectData));
    }
    
    // Add status (default to 'Pending' if not provided)
    const statusColumn = findMatchingColumn(fieldMapping.status);
    if (statusColumn) {
      columns.push(statusColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(projectData.status || 'Pending');
    }
    
    // Add priority (default to 'Medium' if not provided)
    const priorityColumn = findMatchingColumn(fieldMapping.priority);
    if (priorityColumn) {
      columns.push(priorityColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(projectData.priority || 'Medium');
    }
    
    // Add manager user ID (from project officer)
    const managerUserIdColumn = findMatchingColumn(fieldMapping.manageruserid);
    if (managerUserIdColumn && projectOfficer) {
      columns.push(managerUserIdColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(projectOfficer.id);
    }
    
    // Add department ID (Signal Corps department - 1)
    const departmentIdColumn = findMatchingColumn(fieldMapping.departmentid);
    if (departmentIdColumn) {
      columns.push(departmentIdColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(SIGNAL_CORPS_DEPT_ID);
    }
    
    // Add dates if the columns exist
    const startDateColumn = findMatchingColumn(fieldMapping.startdate);
    if (startDateColumn && projectData.start_date && 
       projectData.start_date !== "(blank)" && 
       projectData.start_date.trim() !== "") {
      columns.push(startDateColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(projectData.start_date);
    }
    
    const endDateColumn = findMatchingColumn(fieldMapping.enddate);
    if (endDateColumn && projectData.end_date && 
       projectData.end_date !== "(blank)" && 
       projectData.end_date.trim() !== "") {
      columns.push(endDateColumn);
      placeholders.push(`$${paramCounter++}`);
      values.push(projectData.end_date);
    }
    
    // Add budget and costs if values provided and columns exist
    if (availableColumns.includes('budget') && projectData.budget) {
      columns.push('budget');
      placeholders.push(`$${paramCounter++}`);
      values.push(parseFloat(projectData.budget) || 0);
    }
    
    if (availableColumns.includes('actualcost') && projectData.actual_cost) {
      columns.push('actualcost');
      placeholders.push(`$${paramCounter++}`);
      values.push(parseFloat(projectData.actual_cost) || 0);
    }
    
    // Add createdat and updatedat timestamps if the columns exist
    if (availableColumns.includes('createdat')) {
      columns.push('createdat');
      placeholders.push(`$${paramCounter++}`);
      values.push(new Date());
    }
    
    if (availableColumns.includes('updatedat')) {
      columns.push('updatedat');
      placeholders.push(`$${paramCounter++}`);
      values.push(new Date());
    }
    
    // If no columns were found or mapped, throw an error
    if (columns.length === 0) {
      throw new Error('No valid columns found for project insertion');
    }
    
    // Build and execute the query
    const query = `
      INSERT INTO projects (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id, ${titleColumn || 'id'} as title, ${statusColumn || 'id'} as status
    `;
    
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await client.query(query, values);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      throw new Error('No rows returned from project insertion');
    }
  } catch (error) {
    console.error(`Failed to create project ${projectData.title || ''}:`, error);
    throw error;
  }
}

// Helper function to format project description
function formatDescription(projectData) {
  const parts = [];
  
  if (projectData.arabicName) {
    parts.push(`Arabic Name: ${projectData.arabicName}`);
  }
  
  if (projectData.contractNumber) {
    parts.push(`Contract #: ${projectData.contractNumber}`);
  }
  
  if (projectData.startDate) {
    parts.push(`Start Date: ${projectData.startDate}`);
  }
  
  if (projectData.endDate) {
    parts.push(`End Date: ${projectData.endDate}`);
  }
  
  if (projectData.budget) {
    parts.push(`Budget: QAR ${projectData.budget}`);
  }
  
  if (projectData.amountPaid) {
    parts.push(`Amount Paid: QAR ${projectData.amountPaid}`);
  }
  
  return parts.join('\n');
}

// Format an email address for a user
function formatEmail(name) {
  if (!name) return null;
  
  // Remove special characters, replace spaces with dots, and add domain
  const emailName = name
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '.');
  
  return `${emailName}@projectpulse.org`;
}

// Get the actual field name from the CSV based on known variations
function getFieldFromRow(row, fieldType) {
  // Helper to get a value from a CSV row based on various possible column names
  const fieldMapping = {
    title: ['title', 'project_name', 'name', 'project', 'project title', 'project name', 'projectname'],
    arabicName: ['arabic_name', 'name_arabic', 'arabic_title', 'arabic name', 'arabic'],
    projectOfficer: ['project_officer', 'officer', 'manager', 'project manager', 'responsible officer', 'project officer'],
    contractNumber: ['contract_number', 'contract', 'contract no', 'contract #', 'contractno'],
    startDate: ['start_date', 'start', 'date_start', 'project_start', 'startdate', 'start date'],
    endDate: ['end_date', 'end', 'date_end', 'project_end', 'enddate', 'end date'],
    budget: ['budget', 'total_budget', 'project_budget', 'allocated_budget', 'budget in qar', 'totalbudget'],
    amountPaid: ['amount_paid', 'paid', 'payment', 'actual_cost', 'cost', 'amount paid', 'amountpaid'],
    status: ['status', 'project_status', 'current_status']
  };
  
  const possibleKeys = fieldMapping[fieldType] || [];
  
  // Debug info
  if (fieldType === 'title') {
    console.log('Row keys:', Object.keys(row));
  }
  
  // Normalize keys by converting to lowercase and removing whitespace
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    const normalizedKey = key.toLowerCase().trim();
    normalizedRow[normalizedKey] = row[key];
  });
  
  // Find the first matching key
  for (const key of possibleKeys) {
    const normalizedKey = key.toLowerCase().trim();
    if (normalizedRow[normalizedKey] !== undefined) {
      return normalizedRow[normalizedKey];
    }
  }
  
  // Try secondary method - checking if any key contains our target field type
  for (const key of Object.keys(normalizedRow)) {
    if (key.includes('project') && key.includes('name')) {
      return normalizedRow[key];
    }
  }
  
  return null;
}

// Auto-detect the CSV delimiter by checking the first line
function detectDelimiter(filePath) {
  try {
    const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
    
    // Count commas and semicolons
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    
    // Use the one that appears more often
    return semicolons > commas ? ';' : ',';
  } catch (error) {
    console.warn(`Could not auto-detect delimiter: ${error.message}`);
    return ',';  // Default to comma
  }
}

// Process the CSV file and import projects
async function importProjects() {
  let rowCount = 0;
  let createdProjects = 0;
  let skippedProjects = 0;
  let errorCount = 0;

  try {
    // Initialize the database connection
    const initialized = await init();
    if (!initialized) {
      console.error('Failed to initialize database connection');
      process.exit(1);
    }
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`CSV file not found: ${CSV_FILE_PATH}`);
      console.log('Usage: node import-projects.js [path-to-csv]');
      process.exit(1);
    }
    
    // Detect the CSV delimiter
    const delimiter = detectDelimiter(CSV_FILE_PATH);
    console.log(`Detected delimiter: ${delimiter === ',' ? 'comma' : 'semicolon'}`);
    
    // Collect all rows first instead of processing them directly in the data event
    const rows = [];
    
    // Read the CSV file and collect rows
    await new Promise((resolve, reject) => {
      createReadStream(CSV_FILE_PATH)
        .pipe(csvParser({ 
          separator: delimiter,
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          reject(error);
        });
    });

    console.log(`CSV file parsed: ${rows.length} rows found`);
    
    // Process rows sequentially, with each row in its own transaction
    for (const row of rows) {
      rowCount++;
      
      try {
        // Get a new client for each row
        const rowClient = await pool.connect();
        
        try {
          // Begin transaction for this row
          await rowClient.query('BEGIN');
          
          // Extract project data from the row
          const projectTitle = getFieldFromRow(row, 'title');
          if (!projectTitle) {
            console.log(`Row ${rowCount}: Skipping row with no project title`);
            skippedProjects++;
            await rowClient.query('COMMIT');
            continue;
          }
          
          // Map CSV data to project properties
          const projectData = {
            title: projectTitle,
            arabic_name: getFieldFromRow(row, 'arabicName'),
            project_officer: getFieldFromRow(row, 'projectOfficer'),
            contract_number: getFieldFromRow(row, 'contractNumber'),
            start_date: getFieldFromRow(row, 'startDate'),
            end_date: getFieldFromRow(row, 'endDate'),
            budget: getFieldFromRow(row, 'budget'),
            actual_cost: getFieldFromRow(row, 'amountPaid'),
            status: getFieldFromRow(row, 'status')
          };
          
          // Check if project already exists using the row-specific client
          const findProjectQuery = `
            SELECT id, title, status FROM projects 
            WHERE title ILIKE $1
          `;
          const existingProjectResult = await rowClient.query(findProjectQuery, [`%${projectTitle}%`]);
          const existingProject = existingProjectResult.rows[0];
          
          if (existingProject) {
            console.log(`Row ${rowCount}: Project already exists: ${projectTitle}`);
            skippedProjects++;
            await rowClient.query('COMMIT');
            continue;
          }
          
          // Get or create project officer
          let projectOfficer = null;
          if (projectData.project_officer) {
            const officerName = projectData.project_officer.trim();
            const officerEmail = formatEmail(officerName);
            
            // Check if user exists using the row-specific client
            const findUserQuery = `
              SELECT id, name, email, role FROM users 
              WHERE email = $1
            `;
            const existingUserResult = await rowClient.query(findUserQuery, [officerEmail]);
            projectOfficer = existingUserResult.rows[0];
            
            // Create user if not found
            if (!projectOfficer) {
              // Generate username from email
              const username = officerEmail.split('@')[0];
              
              // Generate a random password
              const password = await hashPassword(DEFAULT_PASSWORD);
              
              // Get available columns in the users table
              const availableColumnsResult = await rowClient.query(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
              );
              
              const availableColumns = availableColumnsResult.rows.map(row => row.column_name.toLowerCase());
              
              // Build column list and value list dynamically
              const columns = [];
              const placeholders = [];
              const values = [];
              let paramCounter = 1;
              
              // Map common field names to their possible database column names
              const nameColumn = availableColumns.includes('name') ? 'name' : 
                               availableColumns.includes('fullname') ? 'fullname' :
                               availableColumns.includes('full_name') ? 'full_name' : null;
                               
              if (nameColumn) {
                columns.push(nameColumn);
                placeholders.push(`$${paramCounter++}`);
                values.push(officerName);
              }
              
              if (availableColumns.includes('email')) {
                columns.push('email');
                placeholders.push(`$${paramCounter++}`);
                values.push(officerEmail);
              }
              
              if (availableColumns.includes('username')) {
                columns.push('username');
                placeholders.push(`$${paramCounter++}`);
                values.push(username);
              }
              
              if (availableColumns.includes('password')) {
                columns.push('password');
                placeholders.push(`$${paramCounter++}`);
                values.push(password);
              }
              
              if (availableColumns.includes('role')) {
                columns.push('role');
                placeholders.push(`$${paramCounter++}`);
                values.push('ProjectManager');
              }
              
              // Add department ID only if the column exists
              if (availableColumns.includes('departmentid')) {
                columns.push('departmentid');
                placeholders.push(`$${paramCounter++}`);
                values.push(SIGNAL_CORPS_DEPT_ID); // Signal Corps department
              }
              
              // Add timestamps if they exist
              if (availableColumns.includes('createdat')) {
                columns.push('createdat');
                placeholders.push(`$${paramCounter++}`);
                values.push(new Date());
              }
              
              if (availableColumns.includes('updatedat')) {
                columns.push('updatedat');
                placeholders.push(`$${paramCounter++}`);
                values.push(new Date());
              }
              
              // Construct return fields
              const returnFields = ['id'];
              if (nameColumn) returnFields.push(nameColumn + ' as name');
              if (availableColumns.includes('email')) returnFields.push('email');
              if (availableColumns.includes('role')) returnFields.push('role');
              
              // Execute the query
              const createUserQuery = `
                INSERT INTO users (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING ${returnFields.join(', ')}
              `;
              
              try {
                const userResult = await rowClient.query(createUserQuery, values);
                if (userResult.rows.length > 0) {
                  projectOfficer = userResult.rows[0];
                  console.log(`Created new user: ${officerName} (${projectOfficer.id}) with role ProjectManager`);
                } else {
                  throw new Error('No rows returned from user insertion');
                }
              } catch (userError) {
                console.error(`Failed to create user ${officerName}:`, userError);
                await rowClient.query('ROLLBACK');
                errorCount++;
                continue;
              }
            }
            
            if (!projectOfficer) {
              console.log(`Row ${rowCount}: Failed to create/find project officer: ${officerName}`);
              await rowClient.query('ROLLBACK');
              errorCount++;
              continue;
            }
          } else {
            console.log(`Row ${rowCount}: No project officer specified`);
            await rowClient.query('ROLLBACK');
            errorCount++;
            continue;
          }
          
          // Get available columns in the projects table
          const availableColumnsResult = await rowClient.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"
          );
          
          const availableColumns = availableColumnsResult.rows.map(row => row.column_name.toLowerCase());
          
          // Build the column list and placeholders dynamically based on available columns
          const columns = [];
          const placeholders = [];
          const values = [];
          let paramCounter = 1;
          
          // Map common field names to their database column equivalents
          const fieldMapping = {
            title: ['title', 'name', 'project_name', 'projectname'],
            description: ['description', 'desc', 'project_description', 'projectdescription'],
            status: ['status', 'project_status', 'projectstatus'],
            priority: ['priority', 'project_priority', 'projectpriority'],
            manageruserid: ['manageruserid', 'manager_user_id', 'project_manager_id', 'managerId'],
            departmentid: ['departmentid', 'department_id', 'dept_id'],
            startdate: ['startdate', 'start_date', 'projectstart', 'project_start', 'startDateTime'],
            enddate: ['enddate', 'end_date', 'projectend', 'project_end', 'endDateTime']
          };
          
          // Helper function to find the matching column in the database
          const findMatchingColumn = (fieldOptions) => {
            return availableColumns.find(col => fieldOptions.includes(col));
          };
          
          // Add title
          const titleColumn = findMatchingColumn(fieldMapping.title);
          if (titleColumn) {
            columns.push(titleColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(projectData.title || '');
          }
          
          // Add description
          const descriptionColumn = findMatchingColumn(fieldMapping.description);
          if (descriptionColumn) {
            columns.push(descriptionColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(formatDescription(projectData));
          }
          
          // Add status (default to 'Pending' if not provided)
          const statusColumn = findMatchingColumn(fieldMapping.status);
          if (statusColumn) {
            columns.push(statusColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(projectData.status || 'Pending');
          }
          
          // Add priority (default to 'Medium' if not provided)
          const priorityColumn = findMatchingColumn(fieldMapping.priority);
          if (priorityColumn) {
            columns.push(priorityColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(projectData.priority || 'Medium');
          }
          
          // Add manager user ID (from project officer)
          const managerUserIdColumn = findMatchingColumn(fieldMapping.manageruserid);
          if (managerUserIdColumn && projectOfficer) {
            columns.push(managerUserIdColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(projectOfficer.id);
          }
          
          // Add department ID (Signal Corps department - 1)
          const departmentIdColumn = findMatchingColumn(fieldMapping.departmentid);
          if (departmentIdColumn) {
            columns.push(departmentIdColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(SIGNAL_CORPS_DEPT_ID);
          }
          
          // Add dates if the columns exist
          const startDateColumn = findMatchingColumn(fieldMapping.startdate);
          if (startDateColumn && projectData.start_date && 
             projectData.start_date !== "(blank)" && 
             projectData.start_date.trim() !== "") {
            columns.push(startDateColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(projectData.start_date);
          }
          
          const endDateColumn = findMatchingColumn(fieldMapping.enddate);
          if (endDateColumn && projectData.end_date && 
             projectData.end_date !== "(blank)" && 
             projectData.end_date.trim() !== "") {
            columns.push(endDateColumn);
            placeholders.push(`$${paramCounter++}`);
            values.push(projectData.end_date);
          }
          
          // Add budget and costs if values provided and columns exist
          if (availableColumns.includes('budget') && projectData.budget) {
            columns.push('budget');
            placeholders.push(`$${paramCounter++}`);
            values.push(parseFloat(projectData.budget) || 0);
          }
          
          if (availableColumns.includes('actualcost') && projectData.actual_cost) {
            columns.push('actualcost');
            placeholders.push(`$${paramCounter++}`);
            values.push(parseFloat(projectData.actual_cost) || 0);
          }
          
          // Add createdat and updatedat timestamps if the columns exist
          if (availableColumns.includes('createdat')) {
            columns.push('createdat');
            placeholders.push(`$${paramCounter++}`);
            values.push(new Date());
          }
          
          if (availableColumns.includes('updatedat')) {
            columns.push('updatedat');
            placeholders.push(`$${paramCounter++}`);
            values.push(new Date());
          }
          
          // If no columns were found or mapped, throw an error
          if (columns.length === 0) {
            throw new Error('No valid columns found for project insertion');
          }
          
          // Build and execute the query
          const createProjectQuery = `
            INSERT INTO projects (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING id, ${titleColumn || 'id'} as title, ${statusColumn || "'Pending'"} as status
          `;
          
          try {
            const projectResult = await rowClient.query(createProjectQuery, values);
            
            if (projectResult.rows.length > 0) {
              const project = projectResult.rows[0];
              console.log(`Row ${rowCount}: Created project ${project.title} (${project.id})`);
              createdProjects++;
              await rowClient.query('COMMIT');
            } else {
              throw new Error('No rows returned from project insertion');
            }
          } catch (projectError) {
            console.error(`Row ${rowCount}: Failed to create project ${projectTitle}`, projectError);
            await rowClient.query('ROLLBACK');
            errorCount++;
          }
        } catch (rowError) {
          // Handle any errors in this row's transaction
          console.error(`Row ${rowCount}: Failed to process row`, rowError);
          await rowClient.query('ROLLBACK');
          errorCount++;
        } finally {
          // Release the client for this row
          rowClient.release();
        }
      } catch (clientError) {
        // Error getting client from pool
        console.error(`Row ${rowCount}: Failed to get database client`, clientError);
        errorCount++;
      }
    }
    
    console.log('\n========================================');
    console.log('Import Summary');
    console.log('========================================');
    console.log(`Total rows processed: ${rowCount}`);
    console.log(`Projects created: ${createdProjects}`);
    console.log(`Rows skipped: ${skippedProjects}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    // Close the pool to end the process
    if (pool) {
      await pool.end();
    }
  }
}

// Run the import process
importProjects().catch(error => {
  console.error('Unexpected error during import:', error);
  process.exit(1);
}); 