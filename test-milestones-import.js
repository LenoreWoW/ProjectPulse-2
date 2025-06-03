import fs from 'fs';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Starting milestone import test...');

// Check if CSV file exists
const csvFile = 'Milestones.csv';
if (!fs.existsSync(csvFile)) {
  console.error(`CSV file not found: ${csvFile}`);
  process.exit(1);
}

console.log(`CSV file found: ${csvFile}`);

// Test CSV parsing
console.log('Testing CSV parsing...');
let rowCount = 0;
const sampleRows = [];

createReadStream(csvFile)
  .pipe(csvParser({ separator: ';' }))
  .on('data', (row) => {
    rowCount++;
    if (sampleRows.length < 3) {
      sampleRows.push(row);
    }
  })
  .on('end', async () => {
    console.log(`Total rows parsed: ${rowCount}`);
    console.log('Sample rows:');
    sampleRows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, {
        PROJECT: row.PROJECT?.substring(0, 50) + '...',
        MILESTONE: row.MILESTONE?.substring(0, 50) + '...',
        DEADLINE: row.DEADLINE,
        PROGRESS: row.PROGRESS,
        STATUS: row.STATUS
      });
    });
    
    // Test database connection
    console.log('\nTesting database connection...');
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpulse',
    });
    
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      
      // Test project lookup
      const testProject = sampleRows[0]?.PROJECT;
      if (testProject) {
        console.log(`\nTesting project lookup for: "${testProject}"`);
        const result = await client.query('SELECT id, title FROM projects WHERE LOWER(title) LIKE LOWER($1) LIMIT 1', [`%${testProject.split(' ')[0]}%`]);
        if (result.rows.length > 0) {
          console.log('Found matching project:', result.rows[0]);
        } else {
          console.log('No matching project found');
        }
      }
      
      client.release();
      await pool.end();
      
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  })
  .on('error', (error) => {
    console.error('CSV parsing error:', error);
  }); 