// Milestone CSV Import Script for ProjectPulse
// This script imports milestones from a CSV file and maps them to existing projects

import fs from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const CSV_FILE_PATH = process.argv[2] || 'Milestones.csv';
const DEFAULT_USER_ID = 1; // Default admin user ID for creating milestones

// Set up PostgreSQL connection
const { Pool } = pg;
let pool;
let client;

// Status mapping from CSV to database
const STATUS_MAPPING = {
  'Completed': 'Completed',
  'InProgress': 'InProgress', 
  'Cancelled': 'Cancelled',
  'NotStarted': 'NotStarted',
  'Delayed': 'Delayed',
  'AtRisk': 'AtRisk'
};

// Function to normalize column names
function normalizeColumnName(name) {
  return name.trim().toUpperCase().replace(/\s+/g, '_').replace(/\r|\n/g, '');
}

// Function to get field value from row with flexible column name matching
function getFieldValue(row, fieldNames) {
  for (const key in row) {
    const normalizedKey = normalizeColumnName(key);
    if (fieldNames.includes(normalizedKey)) {
      return row[key]?.trim().replace(/\r|\n/g, '');
    }
  }
  return null;
}

// Remove BOM from string
function removeBOM(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1);
  }
  return str;
}

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

// Find project by name or contract number
async function findProjectByNameOrContract(projectName, contractNo) {
  try {
    // First try to find by exact project name
    let query = `
      SELECT id, title, manageruserid
      FROM projects 
      WHERE LOWER(title) = LOWER($1)
    `;
    let result = await client.query(query, [projectName]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // If not found and contract number is available, try to find by contract number in the title
    if (contractNo) {
      query = `
        SELECT id, title, manageruserid
        FROM projects 
        WHERE LOWER(title) LIKE LOWER($1)
      `;
      result = await client.query(query, [`%${contractNo}%`]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    }
    
    // Try partial matching on project name (using similarity if available)
    try {
      query = `
        SELECT id, title, manageruserid, 
        SIMILARITY(LOWER(title), LOWER($1)) as similarity
        FROM projects 
        WHERE SIMILARITY(LOWER(title), LOWER($1)) > 0.3
        ORDER BY similarity DESC
        LIMIT 1
      `;
      result = await client.query(query, [projectName]);
      
      if (result.rows.length > 0) {
        console.log(`Found potential match for "${projectName}": "${result.rows[0].title}" (similarity: ${result.rows[0].similarity})`);
        return result.rows[0];
      }
    } catch (error) {
      // SIMILARITY function might not be available, fallback to LIKE search
      query = `
        SELECT id, title, manageruserid
        FROM projects 
        WHERE LOWER(title) LIKE LOWER($1)
        LIMIT 1
      `;
      result = await client.query(query, [`%${projectName.split(' ')[0]}%`]);
      
      if (result.rows.length > 0) {
        console.log(`Found potential match for "${projectName}": "${result.rows[0].title}"`);
        return result.rows[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding project for ${projectName}:`, error);
    return null;
  }
}

// Create a new milestone
async function createMilestone(milestoneData) {
  try {
    const query = `
      INSERT INTO milestones (
        projectid, title, description, deadline, status, 
        completionpercentage, createdbyuserid, createdat, updatedat
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, title
    `;
    
    const values = [
      milestoneData.projectId,
      milestoneData.title,
      milestoneData.description,
      milestoneData.deadline,
      milestoneData.status,
      milestoneData.completionPercentage,
      milestoneData.createdByUserId
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
}

// Parse date from various formats
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Handle various date formats from the CSV
    const cleanDate = dateStr.trim();
    
    // Format: "October 26, 2017"
    if (cleanDate.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
      return new Date(cleanDate);
    }
    
    // Format: "26/10/2017" or similar
    if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = cleanDate.split('/');
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    // Try standard Date parsing
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.warn(`Could not parse date: ${dateStr}`);
    return null;
  }
}

// Parse progress percentage
function parseProgress(progressStr) {
  if (!progressStr || progressStr.trim() === '') return 0;
  
  try {
    const cleaned = progressStr.replace('%', '').trim();
    const progress = parseFloat(cleaned);
    return isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100);
  } catch (error) {
    return 0;
  }
}

// Extract contract number from project name
function extractContractNumber(projectName) {
  const matches = projectName.match(/\[(.*?)\]/);
  return matches ? matches[1] : null;
}

// Detect delimiter used in CSV
function detectDelimiter(filePath) {
  try {
    const sample = fs.readFileSync(filePath, 'utf8').split('\n')[0];
    const delimiters = [';', ',', '\t'];
    
    for (const delimiter of delimiters) {
      if (sample.split(delimiter).length > 1) {
        return delimiter;
      }
    }
    
    return ';'; // Default fallback
  } catch (error) {
    console.warn('Could not detect delimiter, using semicolon as default');
    return ';';
  }
}

// Main import function
async function importMilestones() {
  const delimiter = detectDelimiter(CSV_FILE_PATH);
  console.log(`Using delimiter: "${delimiter}"`);
  
  const milestones = [];
  const projectMap = new Map(); // Cache for project lookups
  
  return new Promise((resolve, reject) => {
    const stream = createReadStream(CSV_FILE_PATH)
      .pipe(csvParser({ 
        separator: delimiter,
        // Handle BOM and normalize headers
        mapHeaders: ({ header }) => {
          const cleaned = removeBOM(header).trim().replace(/\r|\n/g, '');
          console.log(`Header mapping: "${header}" -> "${cleaned}"`);
          return cleaned;
        }
      }));
    
    stream.on('data', (row) => {
      milestones.push(row);
    });
    
    stream.on('end', async () => {
      console.log(`Total milestones to process: ${milestones.length}`);
      
      if (milestones.length > 0) {
        console.log('Sample milestone data:');
        const sample = milestones[0];
        console.log('Available columns:', Object.keys(sample));
        console.log('Sample row:', sample);
      }
      
      let successful = 0;
      let skipped = 0;
      let failed = 0;
      
      try {
        await client.query('BEGIN');
        
        for (const [index, row] of milestones.entries()) {
          try {
            // Extract data from CSV row using flexible column matching
            const projectName = getFieldValue(row, ['PROJECT', 'PROJECT_NAME']);
            const milestoneTitle = getFieldValue(row, ['MILESTONE', 'MILESTONE_NAME', 'TITLE']);
            const deadline = getFieldValue(row, ['DEADLINE', 'DUE_DATE', 'TARGET_DATE']);
            const progress = getFieldValue(row, ['PROGRESS', '_PROGRESS']);
            const status = getFieldValue(row, ['STATUS', 'MILESTONE_STATUS']);
            
            if (!projectName || !milestoneTitle) {
              console.warn(`Row ${index + 1}: Missing project name or milestone title`);
              console.warn(`  Project: "${projectName}", Milestone: "${milestoneTitle}"`);
              skipped++;
              continue;
            }
            
            // Find or get cached project
            let project = projectMap.get(projectName);
            if (!project) {
              const contractNo = extractContractNumber(projectName);
              project = await findProjectByNameOrContract(projectName, contractNo);
              if (project) {
                projectMap.set(projectName, project);
              }
            }
            
            if (!project) {
              console.warn(`Row ${index + 1}: Could not find project for "${projectName}"`);
              skipped++;
              continue;
            }
            
            // Parse milestone data
            const parsedDeadline = parseDate(deadline);
            const progressPercentage = parseProgress(progress);
            const milestoneStatus = STATUS_MAPPING[status] || 'NotStarted';
            
            // Create milestone
            const milestoneData = {
              projectId: project.id,
              title: milestoneTitle,
              description: `Imported from CSV. Original deadline: ${deadline || 'Not specified'}`,
              deadline: parsedDeadline,
              status: milestoneStatus,
              completionPercentage: progressPercentage,
              createdByUserId: project.manageruserid || DEFAULT_USER_ID
            };
            
            const newMilestone = await createMilestone(milestoneData);
            successful++;
            
            if (successful % 50 === 0) {
              console.log(`Processed ${successful} milestones...`);
            }
            
          } catch (error) {
            console.error(`Row ${index + 1}: Error processing milestone`, error);
            failed++;
          }
        }
        
        await client.query('COMMIT');
        
        console.log('\n=== Import Summary ===');
        console.log(`Total milestones processed: ${milestones.length}`);
        console.log(`Successfully imported: ${successful}`);
        console.log(`Skipped (missing data/project): ${skipped}`);
        console.log(`Failed: ${failed}`);
        console.log(`Unique projects found: ${projectMap.size}`);
        
        resolve();
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction failed, rolling back:', error);
        reject(error);
      }
    });
    
    stream.on('error', (error) => {
      console.error('Error reading CSV file:', error);
      reject(error);
    });
  });
}

// Clean up function
async function cleanup() {
  try {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Main execution
async function main() {
  try {
    console.log('Starting milestone import...');
    
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`CSV file not found: ${CSV_FILE_PATH}`);
      process.exit(1);
    }
    
    const connected = await init();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }
    
    await importMilestones();
    console.log('Milestone import completed successfully!');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

// Run the script
if (import.meta.url === fileURLToPath(import.meta.url)) {
  main();
} 