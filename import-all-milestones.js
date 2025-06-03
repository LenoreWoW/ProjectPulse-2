// Production Milestone Import Script
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

// Status mapping
const STATUS_MAPPING = {
  'Completed': 'Completed',
  'InProgress': 'InProgress', 
  'Cancelled': 'Cancelled',
  'NotStarted': 'NotStarted',
  'Delayed': 'Delayed',
  'AtRisk': 'AtRisk'
};

async function main() {
  console.log('🚀 Starting full milestone import...');
  
  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpulse',
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check current milestone count
    const initialCount = await client.query('SELECT COUNT(*) FROM milestones');
    console.log(`📊 Current milestones in database: ${initialCount.rows[0].count}`);
    
    const milestones = [];
    
    // Parse CSV
    console.log('📖 Reading CSV file...');
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
          milestones.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`✅ Parsed ${milestones.length} milestones from CSV`);
    
    // Build project cache
    console.log('🏗️ Building project cache...');
    const projectCache = new Map();
    const projects = await client.query('SELECT id, title, manageruserid FROM projects');
    projects.rows.forEach(project => {
      // Index by contract number if available
      const contractMatch = project.title.match(/\[(.*?)\]/);
      if (contractMatch) {
        projectCache.set(contractMatch[1], project);
      }
      // Also index by first word for partial matching
      const firstWord = project.title.toLowerCase().split(' ')[0];
      if (!projectCache.has(firstWord)) {
        projectCache.set(firstWord, project);
      }
    });
    console.log(`✅ Cached ${projectCache.size} project lookup keys`);
    
    // Process milestones in batches
    const BATCH_SIZE = 100;
    let successful = 0;
    let skipped = 0;
    let failed = 0;
    
    console.log('🔄 Processing milestones...');
    
    for (let i = 0; i < milestones.length; i += BATCH_SIZE) {
      const batch = milestones.slice(i, i + BATCH_SIZE);
      
      try {
        await client.query('BEGIN');
        
        for (const [batchIndex, row] of batch.entries()) {
          const globalIndex = i + batchIndex;
          
          try {
            const projectName = row.PROJECT?.trim().replace(/\r|\n/g, '');
            const milestoneTitle = row.MILESTONE?.trim().replace(/\r|\n/g, '');
            const deadline = row.DEADLINE?.trim().replace(/\r|\n/g, '');
            const progress = row.PROGRESS?.trim().replace(/\r|\n/g, '');
            const status = row.STATUS?.trim().replace(/\r|\n/g, '');
            
            if (!projectName || !milestoneTitle) {
              skipped++;
              continue;
            }
            
            // Find project
            let project = null;
            
            // Try contract number first
            const contractNo = extractContractNumber(projectName);
            if (contractNo && projectCache.has(contractNo)) {
              project = projectCache.get(contractNo);
            }
            
            // Try partial match
            if (!project) {
              const firstWord = projectName.toLowerCase().split(' ')[0];
              if (projectCache.has(firstWord)) {
                project = projectCache.get(firstWord);
              }
            }
            
            if (!project) {
              skipped++;
              continue;
            }
            
            // Parse data
            const parsedDeadline = parseDate(deadline);
            const progressPercentage = parseProgress(progress);
            const milestoneStatus = STATUS_MAPPING[status] || 'NotStarted';
            
            // Create milestone
            await client.query(`
              INSERT INTO milestones (
                projectid, title, description, deadline, status, 
                completionpercentage, createdbyuserid, createdat, updatedat
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [
              project.id,
              milestoneTitle,
              `Imported from CSV. Original deadline: ${deadline || 'Not specified'}`,
              parsedDeadline,
              milestoneStatus,
              progressPercentage,
              project.manageruserid || 1
            ]);
            
            successful++;
            
          } catch (error) {
            console.error(`❌ Error processing milestone ${globalIndex + 1}:`, error.message);
            failed++;
          }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(milestones.length / BATCH_SIZE)} (${successful} successful, ${skipped} skipped, ${failed} failed)`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Batch failed:`, error.message);
        failed += batch.length;
      }
    }
    
    // Final summary
    const finalCount = await client.query('SELECT COUNT(*) FROM milestones');
    
    console.log('\n🎉 Import Summary:');
    console.log(`📊 Total milestones processed: ${milestones.length}`);
    console.log(`✅ Successfully imported: ${successful}`);
    console.log(`⏭️ Skipped (no matching project): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total milestones in database: ${finalCount.rows[0].count}`);
    console.log(`📈 New milestones added: ${finalCount.rows[0].count - initialCount.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main(); 