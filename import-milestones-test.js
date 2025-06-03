// Test Milestone Import - Process only first few rows
import fs from 'fs';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Remove BOM from string
function removeBOM(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1);
  }
  return str;
}

// Extract contract number from project name
function extractContractNumber(projectName) {
  const matches = projectName.match(/\[(.*?)\]/);
  return matches ? matches[1] : null;
}

// Parse date
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    const cleanDate = dateStr.trim();
    
    if (cleanDate.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
      return new Date(cleanDate);
    }
    
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

// Parse progress
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

async function main() {
  console.log('=== Test Milestone Import ===');
  
  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpulse',
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    const milestones = [];
    
    // Parse CSV
    await new Promise((resolve, reject) => {
      createReadStream('Milestones.csv')
        .pipe(csvParser({ 
          separator: ';',
          mapHeaders: ({ header }) => {
            const cleaned = removeBOM(header).trim().replace(/\r|\n/g, '');
            return cleaned;
          }
        }))
        .on('data', (row) => {
          if (milestones.length < 5) { // Only process first 5 rows
            milestones.push(row);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`\n✅ Parsed ${milestones.length} test milestones`);
    
    // Process each milestone
    for (const [index, row] of milestones.entries()) {
      console.log(`\n--- Processing Milestone ${index + 1} ---`);
      
      const projectName = row.PROJECT?.trim().replace(/\r|\n/g, '');
      const milestoneTitle = row.MILESTONE?.trim().replace(/\r|\n/g, '');
      const deadline = row.DEADLINE?.trim().replace(/\r|\n/g, '');
      const progress = row.PROGRESS?.trim().replace(/\r|\n/g, '');
      const status = row.STATUS?.trim().replace(/\r|\n/g, '');
      
      console.log('Project Name:', projectName);
      console.log('Milestone:', milestoneTitle);
      console.log('Deadline:', deadline);
      console.log('Progress:', progress);
      console.log('Status:', status);
      
      if (!projectName || !milestoneTitle) {
        console.log('❌ Skipping - missing project or milestone title');
        continue;
      }
      
      // Find project by contract number first
      const contractNo = extractContractNumber(projectName);
      console.log('Contract Number:', contractNo);
      
      let project = null;
      
      if (contractNo) {
        const result = await client.query(
          'SELECT id, title, manageruserid FROM projects WHERE LOWER(title) LIKE LOWER($1) LIMIT 1',
          [`%${contractNo}%`]
        );
        if (result.rows.length > 0) {
          project = result.rows[0];
          console.log('✅ Found project by contract:', project.title);
        }
      }
      
      if (!project) {
        // Try partial match on first word
        const firstWord = projectName.split(' ')[0];
        const result = await client.query(
          'SELECT id, title, manageruserid FROM projects WHERE LOWER(title) LIKE LOWER($1) LIMIT 1',
          [`%${firstWord}%`]
        );
        if (result.rows.length > 0) {
          project = result.rows[0];
          console.log('✅ Found project by partial match:', project.title);
        }
      }
      
      if (!project) {
        console.log('❌ No project found');
        continue;
      }
      
      // Parse data
      const parsedDeadline = parseDate(deadline);
      const progressPercentage = parseProgress(progress);
      const milestoneStatus = status === 'Completed' ? 'Completed' : 'NotStarted';
      
      console.log('Parsed deadline:', parsedDeadline);
      console.log('Progress percentage:', progressPercentage);
      console.log('Status:', milestoneStatus);
      
      // Create milestone
      try {
        const insertResult = await client.query(`
          INSERT INTO milestones (
            projectid, title, description, deadline, status, 
            completionpercentage, createdbyuserid, createdat, updatedat
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id, title
        `, [
          project.id,
          milestoneTitle,
          `Imported from CSV. Original deadline: ${deadline || 'Not specified'}`,
          parsedDeadline,
          milestoneStatus,
          progressPercentage,
          project.manageruserid || 1
        ]);
        
        console.log('✅ Created milestone:', insertResult.rows[0]);
        
      } catch (error) {
        console.error('❌ Error creating milestone:', error.message);
      }
    }
    
    // Check final count
    const countResult = await client.query('SELECT COUNT(*) FROM milestones');
    console.log(`\n🎉 Total milestones in database: ${countResult.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

main(); 